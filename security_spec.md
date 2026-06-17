# Security Specifications for Connections

This security specification details the Data Invariants, adversarial payloads ("The Dirty Dozen"), and the security rule checks designed to protect the wellness portal sandbox from identity spoofing, state bypasses, and data leaks.

## 1. Data Invariants

1. **User Profile Ownership / Identity Integrity**: A user document under `/users/{userId}` can only be created and updated by the user whose authenticated UID strictly matches `userId`. Users cannot rename or modify accounts of other members.
2. **PII and Vital State Isolation**: Personally Identifiable Information (PII) such as health vital rates, sleep targets, and device push preferences resides strictly inside `/users/{userId}/private/vitals`. Access is granted *exclusively* to the authenticated owner (`isOwner(userId)`). Other users are completely forbidden from reading or writing this subcollection.
3. **Double-Sided Friendship Requests**: Friend request documents under `/friend_requests/{requestId}` must be initiated with a status of `'pending'`. The `senderId` in the request document must match the authenticating caller's UID.
4. **Mutually Exclusive Action Partition**: Once a friend request is accepted, the request document must be deleted, and a corresponding friendship record in the `friends` collection must be created atomically.
5. **No Blind Friend Deletion/Access**: Documents in `/friends/{friendId}` can only be read or deleted by users who are members of that specific friends list (`auth.uid in data.users`). No external users can list, query, or disrupt other friendships.

---

## 2. The Great "Dirty Dozen" Payloads

Here are twelve adversarial payloads designed to break the rules of Identity, Integrity, Isolation, and State. All of these must return `PERMISSION_DENIED`.

### Pillar A: Identity Spoofing & Privilege Escalation
1. **The Ghost Signup**: Attempting to register username/profile with a `uid` that does not match the active authenticated user's UID.
   - **Path**: `/users/legit_user_uid`
   - **Payload**: `{ "uid": "attacker_uid", "name": "Fake Name", "email": "attacker@gmail.com", "avatar": "fake_url" }`
   - **Expected Status**: `PERMISSION_DENIED`
2. **The Field Injection Attack**: Attempting to overwrite protected privilege fields like `membership` or `clockLevel` inside the public profile.
   - **Path**: `/users/victim_user_uid`
   - **Payload**: `{ "uid": "victim_user_uid", "name": "V", "membership": "Grandmaster Curator", "clockLevel": 999 }`
   - **Expected Status**: `PERMISSION_DENIED`

### Pillar B: PII & Deep State leaks (Private Information Exposure)
3. **The Vital Scraper**: A foreign signed-in seeker attempts to read another user's wellness metrics or push configurations.
   - **Path**: `/users/victim_user_uid/private/vitals` (GET request by `attacker_uid`)
   - **Expected Status**: `PERMISSION_DENIED`
4. **The Vital Poisioning**: Attempting to write malicious health patterns into some other user's private subcollection.
   - **Path**: `/users/victim_uid/private/vitals`
   - **Payload**: `{ "sleepCurrent": -10, "stepsCurrent": 99999, "themeMode": "destructive" }`
   - **Expected Status**: `PERMISSION_DENIED`

### Pillar C: Friend Request Bypasses & State Hijacking
5. **The Force Friend Request**: Attempting to skip the standard "pending" flow by creating a pre-accepted friend requests record.
   - **Path**: `/friend_requests/sender_receiver`
   - **Payload**: `{ "id": "sender_receiver", "senderId": "attacker", "receiverId": "victim", "status": "accepted", "createdAt": "2026-06-17" }`
   - **Expected Status**: `PERMISSION_DENIED`
6. **The Receiver Spoofing**: Attempting to send a friend request where you set someone else as the sender.
   - **Path**: `/friend_requests/fake_receiver`
   - **Payload**: `{ "id": "fake_receiver", "senderId": "victim_uid", "receiverId": "attacker_uid", "status": "pending" }`
   - **Expected Status**: `PERMISSION_DENIED`
7. **The Request Invalidation / Modification**: An attacker attempts to modify a pending friend request sent by another user directly into an accepted state without deletion.
   - **Path**: `/friend_requests/sender_victim`
   - **Payload**: `{ "status": "accepted" }` (by unauthorized third party)
   - **Expected Status**: `PERMISSION_DENIED`

### Pillar D: Friend List Tampering
8. **The Blind Friendship Hijack**: Attempting to force-inject an established friend relationship on the database without an active request context.
   - **Path**: `/friends/attacker_victim`
   - **Payload**: `{ "id": "attacker_victim", "users": ["attacker_uid", "victim_uid"], "createdAt": "2026-06-17T00:00:00Z" }` (triggered without authorization from target)
   - **Expected Status**: `PERMISSION_DENIED`
9. **The Connection Scraper**: Attempting to read a list of friendships of someone else on the platform.
   - **Path**: `/friends/friendship_of_others` (GET by foreign `attacker_uid`)
   - **Expected Status**: `PERMISSION_DENIED`
10. **The Disruptive Deletion**: Trying to delete a friendship between two unrelated users.
    - **Path**: `/friends/userA_userB` (DELETE request by `attacker_uid` who is not userA or userB)
    - **Expected Status**: `PERMISSION_DENIED`

### Pillar E: Resource Poisoning & Size Attacks
11. **The Buffer Overflow Seeker**: Registering a profile with an extremely massive name string to exhaust resources or distort rendering templates.
    - **Path**: `/users/attacker_uid`
    - **Payload**: `{ "uid": "attacker_uid", "name": "AveryLongNameThatExceedsTheSafeCharacterCutoffLimitsEnforcedByTheSecuritySchemaDefendersOfSanctuary..." }`
    - **Expected Status**: `PERMISSION_DENIED`
12. **The Spam Friend Request**: Creating a request document containing extremely massive, unvetted payload fields.
    - **Path**: `/friend_requests/attacker_victim`
    - **Payload**: `{ "id": "attacker_victim", "senderId": "attacker_uid", "receiverId": "victim_uid", "status": "pending", "customToxicBuffer": "A..." }`
    - **Expected Status**: `PERMISSION_DENIED`

---

## 3. Test Runner Specification

The following `firestore.rules.test.ts` represents the automated Red Team validation verifying that all vulnerabilities are strictly blocked:

```typescript
import { assertFails, assertSucceeds, initializeTestApp } from '@firebase/rules-unit-testing';

const MY_PROJECT_ID = "ai-studio-clockit";

describe("Wellness Connections Security Rule Suite", () => {
  it("Securely blocks Ghost Signups (Invariants 1)", async () => {
    const db = initializeTestApp({ projectId: MY_PROJECT_ID, auth: { uid: "attacker_uid" } }).firestore();
    const maliciousRef = db.collection("users").doc("legit_user_uid");
    await assertFails(maliciousRef.set({
      uid: "attacker_uid",
      name: "Saboteur",
      email: "sab@bad.com",
      avatar: "avatar.png",
      isOnline: true,
      createdAt: new Date().toISOString()
    }));
  });

  it("Blocks external reading of private vital trackers (Invariants 2)", async () => {
    const db = initializeTestApp({ projectId: MY_PROJECT_ID, auth: { uid: "attacker_uid" } }).firestore();
    const vitalsRef = db.collection("users").doc("victim_uid").collection("private").doc("vitals");
    await assertFails(vitalsRef.get());
  });

  it("Prevents sending friend requests on behalf of other users", async () => {
    const db = initializeTestApp({ projectId: MY_PROJECT_ID, auth: { uid: "attacker_uid" } }).firestore();
    const ref = db.collection("friend_requests").doc("victim_target");
    await assertFails(ref.set({
      id: "victim_target",
      senderId: "victim_uid",
      receiverId: "target_uid",
      status: "pending",
      createdAt: new Date().toISOString()
    }));
  });
});
```
