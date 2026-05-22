# Security Specification (TDD) for Clockit

## 1. Data Invariants
- **User Settings & VitalState**: A user's profile can only be read, created, or updated by the authenticated owner (`request.auth.uid == userId`).
- **Reflections**: Mindful journal entries can only be viewable and editable by the authenticated owner (`request.auth.uid == userId`).
- **Circle Posts**: Community posts can be viewed by authenticated users. Posts can only be created with `authorId` matching the caller. Only the author can update/delete their posts.
- **Circle Comments**: Comments are viewable by authenticated users. Comments can only be written by the author.
- **Chat Messages**: Direct messaging histories are strictly scoped to the matching `userId` and cannot be accessed by other users.

## 2. Dirty Dozen payloads (Blocked by Security Rules)
1. Creating a user settings document with a different user's UID.
2. Modifying another user's sleep/water stats.
3. Reading another user's private reflections.
4. Adding an unverified reflection document with arbitrary fields.
5. Creating a circle post where `authorId` !== `request.auth.uid`.
6. Reading comments or posts as an unauthenticated user when rules enforce standard Auth.
7. Modifying someone else's circle post.
8. Deleting someone else's comment.
9. Injecting oversized contents into a post or reflection.
10. Reading another user's private chat messages with the wellness guide.
11. Spoofing user role or adding privileged admin status.
12. Modifying immutable fields like `createdAt`.

## 3. Security Evaluation
The security rules (`firestore.rules`) will reject all malicious attempts with `Permission Denied` using clean helper functions.
