import { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Users2, Settings, TrendingUp, Sparkles, UserCheck, Search, Shield } from 'lucide-react';
import logoUrl from './assets/images/hand_logo_outline_1779806157572.png';
import {
  initialConversations,
  initialCircles,
  initialReflections,
  initialUserSettings,
  initialVitalState,
  dailyPrompts
} from './data';
import { Conversation, VitalState, CommunityCircle, Reflection, UserSettings, Message } from './types';
import { DashboardView } from './components/DashboardView';
import { MessagesView } from './components/MessagesView';
import { ChatView } from './components/ChatView';
import { CirclesView } from './components/CirclesView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { AdminView } from './components/AdminView';
import { FriendsView } from './components/FriendsView';

// Firebase Client SDK Integration imports
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { db, auth, logoutUser, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [circles, setCircles] = useState<CommunityCircle[]>(initialCircles);
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('clockit_user_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialUserSettings;
      }
    }
    return initialUserSettings;
  });
  const [vitalState, setVitalState] = useState<VitalState>(initialVitalState);
  const [activeConversationId, setActiveConversationId] = useState<string>('wellness_guide');
  const [showNewChatOverlay, setShowNewChatOverlay] = useState<boolean>(false);
  const [registeredUsersList, setRegisteredUsersList] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [loadingUsersDir, setLoadingUsersDir] = useState<boolean>(false);
  const [usersDirSearch, setUsersDirSearch] = useState<string>('');

  // User Search in overlay logging
  useEffect(() => {
    if (usersDirSearch) {
      const matchCount = registeredUsersList.filter(u => u.name.toLowerCase().includes(usersDirSearch.toLowerCase())).length;
      console.log(`[DEBUG] New Chat Overlay User Search: query="${usersDirSearch}", matchingCount=${matchCount}, totalCount=${registeredUsersList.length}`);
    }
  }, [usersDirSearch, registeredUsersList]);

  // Sync registered users from Firestore for safe messaging
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingUsersDir(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const displayName = data.name || 'Anonymous Member';
        const displayAvatar = data.avatar || '';
        fetched.push({
          uid: doc.id,
          name: displayName,
          username: data.username || displayName,
          avatar: displayAvatar,
          profilePhoto: data.profilePhoto || displayAvatar,
          email: data.email || '',
          isOnline: data.isOnline ?? false,
          createdAt: data.createdAt || null,
          membership: data.membership || 'Registered Member',
          clockLevel: data.clockLevel ?? data.zenLevel ?? 12,
          isSelf: doc.id === currentUserUid
        });
      });
      console.log(`[DEBUG] Syncing users collection. Total registered: ${fetched.length}`);
      setRegisteredUsersList(fetched);
      setLoadingUsersDir(false);
    }, (error) => {
      console.error('Error fetching registered users directory:', error);
      setLoadingUsersDir(false);
    });
    return () => unsubscribe();
  }, [isLoggedIn, currentUserUid]);

  // Realtime Friendships Subscriber (combining friend_requests and friends collections)
  useEffect(() => {
    if (!currentUserUid || !isLoggedIn) return;

    let active = true;
    let requestsList: any[] = [];
    let friendsList: any[] = [];

    const updateCombinedFriendships = () => {
      if (!active) return;
      const combined = [...requestsList, ...friendsList];
      setFriendships(combined);
    };

    // 1. Subscribe to friend_requests where senderId == currentUserUid
    const requestsRef = collection(db, 'friend_requests');
    const qRequestsSender = query(requestsRef, where('senderId', '==', currentUserUid));
    const unsubscribeRequestsSender = onSnapshot(qRequestsSender, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({
          id: doc.id,
          users: [data.senderId, data.receiverId],
          senderId: data.senderId,
          receiverId: data.receiverId,
          status: 'pending',
          createdAt: data.createdAt
        });
      });
      
      const otherPart = requestsList.filter(item => item.senderId !== currentUserUid);
      requestsList = [...otherPart, ...items];
      updateCombinedFriendships();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'friend_requests');
    });

    // 2. Subscribe to friend_requests where receiverId == currentUserUid
    const qRequestsReceiver = query(requestsRef, where('receiverId', '==', currentUserUid));
    const unsubscribeRequestsReceiver = onSnapshot(qRequestsReceiver, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({
          id: doc.id,
          users: [data.senderId, data.receiverId],
          senderId: data.senderId,
          receiverId: data.receiverId,
          status: 'pending',
          createdAt: data.createdAt
        });
      });
      const otherPart = requestsList.filter(item => item.receiverId !== currentUserUid);
      requestsList = [...otherPart, ...items];
      updateCombinedFriendships();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'friend_requests');
    });

    // 3. Subscribe to friends where users array contains currentUserUid
    const friendsRef = collection(db, 'friends');
    const qFriends = query(friendsRef, where('users', 'array-contains', currentUserUid));
    const unsubscribeFriends = onSnapshot(qFriends, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        items.push({
          id: doc.id,
          users: data.users,
          senderId: data.users[0],
          receiverId: data.users[1],
          status: 'accepted',
          createdAt: data.createdAt
        });
      });
      friendsList = items;
      updateCombinedFriendships();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'friends');
    });

    return () => {
      active = false;
      unsubscribeRequestsSender();
      unsubscribeRequestsReceiver();
      unsubscribeFriends();
    };
  }, [currentUserUid, isLoggedIn]);

  // 1. Verify Firestore Connection on Boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Realtime Auth State Synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setCurrentUserEmail(user.email || null);
        setIsLoggedIn(true);
        await loadOrCreateUser(user.uid, user.displayName || 'Ronnie', user.photoURL || undefined, user.email || undefined);
      } else {
        setCurrentUserUid(null);
        setCurrentUserEmail(null);
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync / Initialize User Profile Settings and Vitals in Firestore (splitting public vs private info)
  const loadOrCreateUser = async (uid: string, initialName: string, avatarUrl?: string, emailAddress?: string) => {
    console.log('[DEBUG] loadOrCreateUser started:', { uid, initialName, avatarUrl, emailAddress });
    const userDocRef = doc(db, 'users', uid);
    const vitalsDocRef = doc(db, 'users', uid, 'private', 'vitals');
    try {
      const userDoc = await getDoc(userDocRef);
      const vitalsDoc = await getDoc(vitalsDocRef);
      console.log(`[DEBUG] checked existing docs. userDocExists: ${userDoc.exists()}, vitalsDocExists: ${vitalsDoc.exists()}`);

      const pendingName = localStorage.getItem('clockit_pending_nickname');
      let finalInitialName = initialName;
      if (pendingName && pendingName !== 'Ronnie' && pendingName !== 'Jack') {
        finalInitialName = pendingName;
      }

      const finalEmail = emailAddress || currentUserEmail || 'unspecified@gmail.com';

      if (userDoc.exists()) {
        const data = userDoc.data();
        let nameToUse = data.name || data.username || finalInitialName;
        let shouldUpdateDoc = false;

        // ONLY prioritize the custom pending name if it was explicitly set from an active signin/signup in localStorage
        if (pendingName && pendingName !== data.name) {
          nameToUse = pendingName;
          shouldUpdateDoc = true;
        } else if (!data.name) {
          nameToUse = finalInitialName;
          shouldUpdateDoc = true;
        }

        let avatarToUse = data.avatar || data.profilePhoto || initialUserSettings.avatar;
        if (avatarUrl && (!data.avatar || data.avatar.includes('dicebear') || data.avatar.includes('avatar.png'))) {
          avatarToUse = avatarUrl;
          shouldUpdateDoc = true;
        }

        // Keep email and online status synchronized
        if (!data.email || data.email !== finalEmail) {
          shouldUpdateDoc = true;
        }
        if (data.isOnline !== true) {
          shouldUpdateDoc = true;
        }

        // Recreate or migrate missing audited schema fields (username & profilePhoto)
        if (!data.username || data.username !== nameToUse) {
          shouldUpdateDoc = true;
        }
        if (!data.profilePhoto || data.profilePhoto !== avatarToUse) {
          shouldUpdateDoc = true;
        }

        // Load vitals from private subcollection or fallback to master doc (with writeback) or defaults
        let vitalsData: any = {};
        if (vitalsDoc.exists()) {
          vitalsData = vitalsDoc.data();
        } else {
          vitalsData = {
            sleepCurrent: data.sleepCurrent ?? 7.2,
            sleepTarget: data.sleepTarget ?? 8.0,
            stepsCurrent: data.stepsCurrent ?? 4.8,
            stepsTarget: data.stepsTarget ?? 10.0,
            waterCurrent: data.waterCurrent ?? 1.4,
            waterTarget: data.waterTarget ?? 2.0,
            notifications: data.notifications || 'Smart Alerts',
            themeMode: data.themeMode || 'light',
            smartAlerts: data.smartAlerts ?? true
          };
          await setDoc(vitalsDocRef, vitalsData);
        }

        const loadedSettings = {
          name: nameToUse,
          membership: data.membership || 'Premium Member',
          clockLevel: data.clockLevel ?? data.zenLevel ?? 12,
          avatar: avatarToUse,
          notifications: vitalsData.notifications || 'Smart Alerts',
          themeMode: (vitalsData.themeMode as any) || 'light',
          smartAlerts: vitalsData.smartAlerts ?? true,
        };
        setUserSettings(loadedSettings);
        localStorage.setItem('clockit_user_settings', JSON.stringify(loadedSettings));
        
        if (shouldUpdateDoc) {
          console.log('[DEBUG] updating and migrating existing user profile document in Firestore:', { nameToUse, finalEmail, isOnline: true });
          await setDoc(userDocRef, {
            uid,
            name: nameToUse,
            username: nameToUse,
            email: finalEmail,
            avatar: avatarToUse,
            profilePhoto: avatarToUse,
            isOnline: true,
            createdAt: data.createdAt || new Date().toISOString(),
            membership: loadedSettings.membership,
            clockLevel: loadedSettings.clockLevel
          }, { merge: true });
        }
        setVitalState({
          sleep: { current: vitalsData.sleepCurrent ?? 7.2, target: vitalsData.sleepTarget ?? 8.0, unit: 'h' },
          steps: { current: vitalsData.stepsCurrent ?? 4.8, target: vitalsData.stepsTarget ?? 10.0, unit: 'k' },
          water: { current: vitalsData.waterCurrent ?? 1.4, target: vitalsData.waterTarget ?? 2.0, unit: 'L' }
        });
      } else {
        const avatarToUse = avatarUrl || initialUserSettings.avatar;
        const publicDoc = {
          uid: uid,
          name: finalInitialName,
          username: finalInitialName,
          email: finalEmail,
          avatar: avatarToUse,
          profilePhoto: avatarToUse,
          isOnline: true,
          createdAt: new Date().toISOString(),
          membership: 'Premium Member',
          clockLevel: 12
        };
        console.log('[DEBUG] creating brand new user profile document in Firestore:', publicDoc);
        await setDoc(userDocRef, publicDoc);

        const vitalsDocData = {
          sleepCurrent: 7.2,
          sleepTarget: 8.0,
          stepsCurrent: 4.8,
          stepsTarget: 10.0,
          waterCurrent: 1.4,
          waterTarget: 2.0,
          notifications: 'Smart Alerts',
          themeMode: 'light',
          smartAlerts: true
        };
        await setDoc(vitalsDocRef, vitalsDocData);

        const defaultSettings = {
          name: finalInitialName,
          membership: 'Premium Member',
          clockLevel: 12,
          avatar: avatarToUse,
          notifications: 'Smart Alerts',
          themeMode: 'light' as const,
          smartAlerts: true,
        };
        setUserSettings(defaultSettings);
        localStorage.setItem('clockit_user_settings', JSON.stringify(defaultSettings));
        setVitalState(initialVitalState);
      }
      
      // Clear pending nickname state
      try {
        localStorage.removeItem('clockit_pending_nickname');
      } catch (e) {}
    } catch (error) {
      console.error('[DEBUG] Failed to load/create user profile in Firestore:', {
        uid,
        name: initialName,
        email: emailAddress,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  // 3. Realtime Reflections Listener & Seeder
  useEffect(() => {
    if (!currentUserUid) return;

    const reflectionsRef = collection(db, 'users', currentUserUid, 'reflections');
    const q = query(reflectionsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedReflections: Reflection[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedReflections.push({
          id: doc.id,
          date: data.date || '',
          prompt: data.prompt || '',
          response: data.response || ''
        });
      });

      if (loadedReflections.length === 0) {
        setReflections(initialReflections);
        initialReflections.forEach(ref => {
          const refDocRef = doc(db, 'users', currentUserUid, 'reflections', ref.id);
          setDoc(refDocRef, {
            id: ref.id,
            userId: currentUserUid,
            date: ref.date,
            prompt: ref.prompt,
            response: ref.response,
            createdAt: new Date().toISOString()
          }).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `users/${currentUserUid}/reflections/${ref.id}`);
          });
        });
      } else {
        setReflections(loadedReflections);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${currentUserUid}/reflections`);
    });

    return () => unsubscribe();
  }, [currentUserUid]);

  // 4. Realtime Chat Messages Synchronizer & Pre-populate Default Dialogues
  useEffect(() => {
    if (!currentUserUid) return;

    const messagesRef = collection(db, 'users', currentUserUid, 'conversations', activeConversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          text: data.text,
          timestamp: data.timestamp,
          timeLabel: data.timeLabel,
          isUser: data.isUser,
          isItalic: data.isItalic,
          attachment: data.attachment
        });
      });

      if (loadedMessages.length > 0) {
        setConversations(prev => prev.map(c => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              messages: loadedMessages,
              lastMessage: loadedMessages[loadedMessages.length - 1].text,
              timeLabel: 'Active'
            };
          }
          return c;
        }));
      } else {
        const defaultConv = initialConversations.find(c => c.id === activeConversationId);
        if (defaultConv && defaultConv.messages.length > 0) {
          defaultConv.messages.forEach(async (msg, index) => {
            const msgDocRef = doc(db, 'users', currentUserUid, 'conversations', activeConversationId, 'messages', msg.id || `msg_init_${index}`);
            await setDoc(msgDocRef, {
              id: msg.id || `msg_init_${index}`,
              conversationId: activeConversationId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar || '',
              text: msg.text,
              timestamp: msg.timestamp,
              timeLabel: msg.timeLabel,
              isUser: msg.isUser,
              isItalic: msg.isItalic || false,
              createdAt: new Date(Date.now() - (defaultConv.messages.length - index) * 60000).toISOString()
            });
          });
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${currentUserUid}/conversations/${activeConversationId}/messages`);
    });

    return () => unsubscribe();
  }, [currentUserUid, activeConversationId]);

  // 5. Realtime Circle Posts & Comments Subscriber
  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubscribes = circles.map(circle => {
      const postsRef = collection(db, 'circles', circle.id, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const loadedPosts: any[] = [];
        snapshot.forEach(postDoc => {
          const data = postDoc.data();
          loadedPosts.push({
            id: postDoc.id,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            content: data.content,
            timeLabel: data.timeLabel || 'Recent',
            likes: data.likes || 0,
            hasLiked: false,
            comments: data.comments || [],
            mediaUrl: data.mediaUrl || null,
            mediaType: data.mediaType || null
          });
        });

        if (loadedPosts.length > 0) {
          setCircles(prev => prev.map(c => {
            if (c.id === circle.id) {
              // Merge Firestore snapshots with local state to preserve hasLiked status and keep unsynced posts
              const mergedPosts = loadedPosts.map(loadedP => {
                const existingP = c.posts.find(p => p.id === loadedP.id);
                return {
                  ...loadedP,
                  hasLiked: existingP ? !!existingP.hasLiked : false
                };
              });

              const unsyncedLocalPosts = c.posts.filter(p => 
                p.id.startsWith('post_') && !mergedPosts.some(mp => mp.id === p.id)
              );

              return {
                ...c,
                posts: [...unsyncedLocalPosts, ...mergedPosts]
              };
            }
            return c;
          }));
        } else {
          const defaultCircle = initialCircles.find(c => c.id === circle.id);
          if (defaultCircle && defaultCircle.posts.length > 0) {
            defaultCircle.posts.forEach(async (post, idx) => {
              const postDocRef = doc(db, 'circles', circle.id, 'posts', post.id || `post_${idx}`);
              await setDoc(postDocRef, {
                id: post.id || `post_${idx}`,
                circleId: circle.id,
                authorId: 'system_seed',
                authorName: post.authorName,
                authorAvatar: post.authorAvatar,
                content: post.content,
                timeLabel: post.timeLabel,
                likes: post.likes || 0,
                comments: post.comments || [],
                createdAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString()
              });
            });
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `circles/${circle.id}/posts`);
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isLoggedIn]);

  // Atmospheric guide notifications backport 
  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(prev => prev.map(c => {
        if (c.id === 'wellness_guide' && currentTab !== 'active_guide_chat' && activeConversationId !== 'wellness_guide') {
          return {
            ...c,
            unreadCount: c.unreadCount + 1,
            timeLabel: 'JUST NOW',
            lastMessage: 'Remember to preserve stillness under activity.'
          };
        }
        return c;
      }));
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [currentTab, activeConversationId]);

  // Handle Vitality State Increments with firestore sync (saving to private subcollection)
  const handleIncrementState = (metric: 'sleep' | 'steps' | 'water') => {
    setVitalState(prev => {
      const target = prev[metric].target;
      const step = metric === 'sleep' ? 0.4 : metric === 'steps' ? 0.8 : 0.2;
      let nextVal = parseFloat((prev[metric].current + step).toFixed(1));
      if (nextVal > target * 1.5) {
        nextVal = parseFloat((prev[metric].current - target).toFixed(1));
        if (nextVal < 0) nextVal = 0;
      }
      const updated = {
        ...prev,
        [metric]: {
          ...prev[metric],
          current: nextVal
        }
      };

      if (currentUserUid) {
        const vitalsDocRef = doc(db, 'users', currentUserUid, 'private', 'vitals');
        const fieldMap = {
          sleep: 'sleepCurrent',
          steps: 'stepsCurrent',
          water: 'waterCurrent'
        };
        setDoc(vitalsDocRef, {
          [fieldMap[metric]]: nextVal
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}/private/vitals`);
        });
      }

      return updated;
    });
  };

  // Chat message submission
  const handleSendMessage = async (text: string, attachment?: { type: 'photo' | 'gif' | 'document'; url: string; name?: string; size?: string }) => {
    const msgId = `msg_${Date.now()}`;
    const newMessage = {
      id: msgId,
      conversationId: activeConversationId,
      senderId: currentUserUid || 'user',
      senderName: userSettings.name,
      senderAvatar: userSettings.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      isItalic: false,
      attachment: attachment || null,
      createdAt: new Date().toISOString()
    };

    // Update the local state instantly to ensure immediate UI feedback
    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        const alreadyExists = c.messages.some(m => m.id === msgId);
        const updatedMsgs = alreadyExists ? c.messages : [...c.messages, newMessage];
        return {
          ...c,
          messages: updatedMsgs,
          lastMessage: text,
          timeLabel: 'Active'
        };
      }
      return c;
    }));

    if (currentUserUid) {
      const msgDocRef = doc(db, 'users', currentUserUid, 'conversations', activeConversationId, 'messages', msgId);
      await setDoc(msgDocRef, newMessage).catch(err => {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUserUid}/conversations/${activeConversationId}/messages/${msgId}`);
      });
    }
  };

  // Add a new reflection response
  const handleSaveReflection = async (newRef: Reflection) => {
    setReflections(prev => [newRef, ...prev]);
    setUserSettings(prev => {
      const updated = {
        ...prev,
        clockLevel: prev.clockLevel + 1
      };
      localStorage.setItem('clockit_user_settings', JSON.stringify(updated));

      if (currentUserUid) {
        const refDocRef = doc(db, 'users', currentUserUid, 'reflections', newRef.id);
        setDoc(refDocRef, {
          id: newRef.id,
          userId: currentUserUid,
          date: newRef.date,
          prompt: newRef.prompt,
          response: newRef.response,
          createdAt: new Date().toISOString()
        }).catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${currentUserUid}/reflections/${newRef.id}`);
        });

        const userDocRef = doc(db, 'users', currentUserUid);
        setDoc(userDocRef, { uid: currentUserUid, clockLevel: updated.clockLevel }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}`);
        });
      }
      return updated;
    });
  };

  // Update user profile/nickname
  const handleUpdateUserSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('clockit_user_settings', JSON.stringify(updated));
      if (currentUserUid) {
        // Also update auth profile to keep names tightly aligned across reloads
        if (newSettings.name && auth.currentUser) {
          updateProfile(auth.currentUser, { displayName: newSettings.name }).catch(err => {
            console.warn("Failed to update auth display name:", err);
          });
        }
        // Public settings
        const userDocRef = doc(db, 'users', currentUserUid);
        setDoc(userDocRef, {
          uid: currentUserUid,
          name: updated.name,
          membership: updated.membership,
          clockLevel: updated.clockLevel,
          avatar: updated.avatar
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}`);
        });

        // Private / personal configuration
        const vitalsDocRef = doc(db, 'users', currentUserUid, 'private', 'vitals');
        setDoc(vitalsDocRef, {
          notifications: updated.notifications,
          themeMode: updated.themeMode,
          smartAlerts: updated.smartAlerts
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}/private/vitals`);
        });
      }
      return updated;
    });
  };

  // --- Friendship System Real-time Actions ---
  const handleSendFriendRequest = async (receiverId: string, receiverName: string, receiverAvatar: string) => {
    if (!currentUserUid) {
      console.warn('[DEBUG] cannot send friend request, no current logged-in user UID');
      return;
    }
    const reqId = [currentUserUid, receiverId].sort().join('_');
    const reqRef = doc(db, 'friend_requests', reqId);
    try {
      console.log('[DEBUG] Initiating send friend request:', { senderId: currentUserUid, receiverId, reqId });
      await setDoc(reqRef, {
        id: reqId,
        senderId: currentUserUid,
        senderName: userSettings.name,
        senderAvatar: userSettings.avatar,
        receiverId: receiverId,
        receiverName: receiverName,
        receiverAvatar: receiverAvatar,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      console.log('[DEBUG] Friend request document successfully written to Firestore under ID:', reqId);
    } catch (err) {
      console.error('[DEBUG] Failed to send friend request:', { senderId: currentUserUid, receiverId, error: err });
      handleFirestoreError(err, OperationType.WRITE, `friend_requests/${reqId}`);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    const reqRef = doc(db, 'friend_requests', friendshipId);
    const friendRef = doc(db, 'friends', friendshipId);
    try {
      console.log('[DEBUG] Initiating accept friend request for ID:', friendshipId);
      const parts = friendshipId.split('_');
      await setDoc(friendRef, {
        id: friendshipId,
        users: parts,
        createdAt: new Date().toISOString()
      });
      console.log('[DEBUG] Friendship confirmed, deleting friend request doc:', friendshipId);
      await deleteDoc(reqRef);
      console.log('[DEBUG] Friendship acceptance successfully completed for ID:', friendshipId);
    } catch (err) {
      console.error('[DEBUG] Failed to accept friend request:', { friendshipId, error: err });
      handleFirestoreError(err, OperationType.WRITE, `friends/${friendshipId}`);
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    const reqRef = doc(db, 'friend_requests', friendshipId);
    try {
      console.log('[DEBUG] Initiating reject friend request for ID:', friendshipId);
      await deleteDoc(reqRef);
      console.log('[DEBUG] Friend request document successfully deleted (rejected) for ID:', friendshipId);
    } catch (err) {
      console.error('[DEBUG] Failed to reject friend request:', { friendshipId, error: err });
      handleFirestoreError(err, OperationType.DELETE, `friend_requests/${friendshipId}`);
    }
  };

  const handleCancelFriendRequest = async (friendshipId: string) => {
    const reqRef = doc(db, 'friend_requests', friendshipId);
    try {
      console.log('[DEBUG] Initiating cancel outgoing friend request for ID:', friendshipId);
      await deleteDoc(reqRef);
      console.log('[DEBUG] Friend request document successfully deleted (canceled) for ID:', friendshipId);
    } catch (err) {
      console.error('[DEBUG] Failed to cancel friend request:', { friendshipId, error: err });
      handleFirestoreError(err, OperationType.DELETE, `friend_requests/${friendshipId}`);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const friendRef = doc(db, 'friends', friendshipId);
    try {
      console.log('[DEBUG] Initiating remove friend connection for ID:', friendshipId);
      await deleteDoc(friendRef);
      console.log('[DEBUG] Friend connection successfully deleted for ID:', friendshipId);
    } catch (err) {
      console.error('[DEBUG] Failed to remove friend connection:', { friendshipId, error: err });
      handleFirestoreError(err, OperationType.DELETE, `friends/${friendshipId}`);
    }
  };

  // Circle / Community Posts Actions
  const handleAddPost = async (circleId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'none') => {
    const postId = `post_${Date.now()}`;
    const newPost: any = {
      id: postId,
      circleId,
      authorId: currentUserUid || 'anonymous',
      authorName: userSettings.name,
      authorAvatar: userSettings.avatar,
      content,
      timeLabel: 'Just Now',
      likes: 0,
      hasLiked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      ...(mediaUrl ? { mediaUrl } : {}),
      ...(mediaType ? { mediaType } : {})
    };

    // Update local state IMMEDIATELY so the post shows up on the timeline with zero lag/loading latency
    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        const exists = c.posts.some(p => p.id === postId);
        if (exists) return c;
        return {
          ...c,
          posts: [newPost, ...c.posts]
        };
      }
      return c;
    }));

    const postDocRef = doc(db, 'circles', circleId, 'posts', postId);
    await setDoc(postDocRef, {
      id: newPost.id,
      circleId: newPost.circleId,
      authorId: newPost.authorId,
      authorName: newPost.authorName,
      authorAvatar: newPost.authorAvatar,
      content: newPost.content,
      timeLabel: newPost.timeLabel,
      likes: newPost.likes,
      createdAt: newPost.createdAt,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'none'
    }).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `circles/${circleId}/posts/${postId}`);
    });
  };

  const handleLikePost = async (circleId: string, postId: string) => {
    const activeCircle = circles.find(c => c.id === circleId);
    if (!activeCircle) return;
    const activePost = activeCircle.posts.find(p => p.id === postId);
    if (!activePost) return;

    const liked = !activePost.hasLiked;
    const nextLikes = activePost.likes + (liked ? 1 : -1);

    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              return { ...p, hasLiked: liked, likes: nextLikes };
            }
            return p;
          })
        };
      }
      return c;
    }));

    const postDocRef = doc(db, 'circles', circleId, 'posts', postId);
    await updateDoc(postDocRef, {
      likes: nextLikes
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `circles/${circleId}/posts/${postId}`);
    });
  };

  const handleAddComment = async (circleId: string, postId: string, commentContent: string) => {
    const activeCircle = circles.find(c => c.id === circleId);
    if (!activeCircle) return;
    const activePost = activeCircle.posts.find(p => p.id === postId);
    if (!activePost) return;

    const newComment = {
      id: `comment_${Date.now()}`,
      authorName: userSettings.name,
      content: commentContent,
      timeLabel: 'Just Now'
    };

    const nextComments = [...(activePost.comments || []), newComment];

    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              return { ...p, comments: nextComments };
            }
            return p;
          })
        };
      }
      return c;
    }));

    const postDocRef = doc(db, 'circles', circleId, 'posts', postId);
    await updateDoc(postDocRef, {
      comments: nextComments
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `circles/${circleId}/posts/${postId}`);
    });
  };

  // Switcher Visual tab routing Helper
  const onNavigate = (tab: string, arg?: string) => {
    if (tab === 'chat_wellness') {
      setActiveConversationId('wellness_guide');
      setCurrentTab('active_guide_chat');
      setConversations(prev => prev.map(c => c.id === 'wellness_guide' ? { ...c, unreadCount: 0 } : c));
    } else {
      setCurrentTab(tab);
    }
  };

  const handleSelectConversationFromList = (id: string) => {
    setActiveConversationId(id);
    setCurrentTab('active_guide_chat');
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  // Sign out simulation
  const handleSignOut = async () => {
    if (currentUserUid) {
      try {
        const userDocRef = doc(db, 'users', currentUserUid);
        await setDoc(userDocRef, { isOnline: false }, { merge: true });
      } catch (err) {
        console.error("Error setting online status to false on sign out:", err);
      }
    }
    await logoutUser();
    localStorage.removeItem('clockit_user_settings');
    setVitalState(initialVitalState);
    setCurrentTab('home');
    setIsLoggedIn(false);
  };

  // New Chat Dialog Handler
  const handleTriggerNewChatDialog = () => {
    setShowNewChatOverlay(true);
  };

  const handleCreateContactConversation = (name: string, targetUid?: string, avatarUrl?: string) => {
    const customId = targetUid || `contact_${Date.now()}`;
    const existing = conversations.find(c => c.id === customId || c.name === name);
    if (existing) {
      setActiveConversationId(existing.id);
      setCurrentTab('active_guide_chat');
      setShowNewChatOverlay(false);
      return;
    }

    const newConv: Conversation = {
      id: customId,
      name,
      avatar: avatarUrl || '', // JL/Letter avatar
      isGroup: false,
      lastMessage: 'A new silent channel formed.',
      unreadCount: 0,
      timeLabel: 'JUST NOW',
      online: true,
      messages: [
        {
          id: `con_${Date.now()}`,
          senderId: customId,
          senderName: name,
          senderAvatar: avatarUrl || '',
          text: `Welcome! Let us co-create beautiful alignment here.`,
          timestamp: 'Today, Just Now',
          timeLabel: 'JUST NOW',
          isUser: false
        }
      ]
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(customId);
    setShowNewChatOverlay(false);
    setCurrentTab('active_guide_chat');
  };

  const handleStartDirectChat = (id: string, name: string, avatar: string) => {
    const existing = conversations.find(c => c.id === id || c.name === name);
    if (existing) {
      setActiveConversationId(existing.id);
      setCurrentTab('active_guide_chat');
    } else {
      const customId = id || `member_${Date.now()}`;
      const newConv: Conversation = {
        id: customId,
        name,
        avatar: avatar || '',
        isGroup: false,
        lastMessage: 'A new silent channel formed.',
        unreadCount: 0,
        timeLabel: 'JUST NOW',
        online: true,
        messages: [
          {
            id: `con_${Date.now()}`,
            senderId: customId,
            senderName: name,
            senderAvatar: avatar || '',
            text: `Welcome! Let us co-create beautiful alignment here.`,
            timestamp: 'Today, Just Now',
            timeLabel: 'JUST NOW',
            isUser: false
          }
        ]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(customId);
      setCurrentTab('active_guide_chat');
    }
  };

  // Helper title strings
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  const pendingIncomingRequestsCount = friendships.filter(f => f.status === 'pending' && f.receiverId === currentUserUid).length;

  const getThemeClass = () => {
    if (userSettings.themeMode === 'dark') return 'theme-dark';
    if (userSettings.themeMode === 'sepia') return 'theme-sepia';
    if (userSettings.themeMode === 'ocean') return 'theme-ocean';
    if (userSettings.themeMode === 'forest') return 'theme-forest';
    if (userSettings.themeMode === 'cosmic') return 'theme-cosmic';
    if (userSettings.themeMode === 'cyberlime') return 'theme-cyberlime';
    if (userSettings.themeMode === 'sunset') return 'theme-sunset';
    if (userSettings.themeMode === 'aurora') return 'theme-aurora';
    return '';
  };

  if (!isLoggedIn) {
    return (
      <AuthView 
        defaultName={userSettings.name} 
        onAuthSuccess={async (uid, userName, email) => { 
          setCurrentUserUid(uid);
          setCurrentUserEmail(email || null);
          setIsLoggedIn(true); 
          await loadOrCreateUser(uid, userName, auth.currentUser?.photoURL || undefined, email || undefined);
        }} 
      />
    );
  }

  return (
    <div className={`bg-clockit-gradient min-h-screen text-on-background pb-32 transition-all duration-300 ${getThemeClass()}`}>
      {/* Dynamic Top App Header (Hidden during active chat transactional context) */}
      {currentTab !== 'active_guide_chat' && (
        <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between glass-pill transition-all" id="app-primary-sticky-header">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden group bg-surface-container/20 border border-primary/20 outline outline-2 outline-primary/50 outline-offset-2 hover:outline-primary hover:border-primary/40 transition-all duration-300" id="main-sidebar-hamburger">
              <img 
                src={logoUrl} 
                alt="Clockit Pinch Logo" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </button>
            <span className="text-xl font-headline tracking-tight text-primary font-bold">Clockit</span>
          </div>
          <div className="flex items-center gap-3">
            {currentUserEmail === 'coopedill@gmail.com' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
                  currentTab === 'admin' 
                    ? 'bg-primary border-primary text-on-primary shadow-md' 
                    : 'bg-surface-container/25 border-outline-variant/30 text-primary hover:bg-primary/10 hover:border-primary/50'
                }`}
                title="Admin Control Center"
                id="header-admin-portal-launcher"
              >
                <Shield className="w-5 h-5 fill-current/10" />
              </button>
            )}
            <div 
              onClick={() => setCurrentTab('settings')}
              className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant cursor-pointer group hover:scale-105 transition-all shadow-sm"
              id="header-user-profile-circle"
            >
              <img 
                key={userSettings.avatar}
                alt={`${userSettings.name} profile`} 
                className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110 animate-fade-in" 
                src={userSettings.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg"}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Sanctuary Screens Container content */}
      <main className="max-w-2xl mx-auto px-6 pt-4">
        {currentTab === 'home' && (
          <DashboardView
            vitalState={vitalState}
            conversations={conversations}
            userSettings={userSettings}
            onNavigate={onNavigate}
            onIncrementState={handleIncrementState}
            registeredUsers={registeredUsersList}
            onStartDirectChat={handleStartDirectChat}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesView
            conversations={conversations}
            onSelectConversation={handleSelectConversationFromList}
            onStartNewChat={handleTriggerNewChatDialog}
            registeredUsers={registeredUsersList}
            onStartDirectChat={handleStartDirectChat}
          />
        )}

        {currentTab === 'circles' && (
          <CirclesView
            circles={circles}
            onAddPost={handleAddPost}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            userAvatar={userSettings.avatar}
            onStartDirectChat={handleStartDirectChat}
          />
        )}

        {currentTab === 'friends' && currentUserUid && (
          <FriendsView
            currentUserId={currentUserUid}
            registeredUsers={registeredUsersList}
            friendships={friendships}
            onSendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptFriendRequest}
            onRejectRequest={handleRejectFriendRequest}
            onCancelRequest={handleCancelFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onStartDirectChat={handleStartDirectChat}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            userSettings={userSettings}
            onUpdateSettings={handleUpdateUserSettings}
            onSignOut={handleSignOut}
          />
        )}

        {currentTab === 'admin' && currentUserEmail === 'coopedill@gmail.com' && (
          <AdminView />
        )}

        {currentTab === 'active_guide_chat' && (
          <ChatView
            conversation={activeConversation}
            onBack={() => setCurrentTab('messages')}
            onSendMessage={handleSendMessage}
            onSaveReflection={handleSaveReflection}
            userAvatar={userSettings.avatar}
            userName={userSettings.name}
          />
        )}
      </main>

      {/* Primary Floating Bottom Navigation Bar (Screens 1, 2, 4) */}
      {currentTab !== 'active_guide_chat' && (
        <nav 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass-pill rounded-full p-2 flex items-center justify-around z-50 shadow-lg border border-white/20 transition-all duration-300"
          id="app-bottom-navbar-pill"
        >
          {/* Layout Dashboard tab */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none ${
              currentTab === 'home' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Home</span>
          </button>

          {/* Active Chats/Messages tab with dynamic notification badge if any conversation has unread messages */}
          <button
            onClick={() => setCurrentTab('messages')}
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none relative ${
              currentTab === 'messages' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${currentTab === 'messages' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Messages</span>
            {conversations.some(c => c.id !== 'wellness_guide' && c.unreadCount > 0) && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-secondary rounded-full"></span>
            )}
          </button>

          {/* Friend discovery and request system */}
          <button
            onClick={() => setCurrentTab('friends')}
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none relative ${
              currentTab === 'friends' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <UserCheck className={`w-5 h-5 ${currentTab === 'friends' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Friends</span>
            {pendingIncomingRequestsCount > 0 && (
              <span className="absolute top-1.5 right-3 px-1.5 py-0.5 text-[8px] font-bold bg-red-500 text-white rounded-full min-w-[14px] leading-none flex items-center justify-center animate-pulse">
                {pendingIncomingRequestsCount}
              </span>
            )}
          </button>

          {/* Circles/Community Forums tab */}
          <button
            onClick={() => setCurrentTab('circles')}
            className={`flex flex-col items-center p-3 transition-all duration-300 outline-none relative group ${
              currentTab === 'circles' 
                ? 'text-pink-500 font-bold drop-shadow-[0_0_8px_rgba(246,117,169,0.3)]' 
                : 'text-outline hover:text-pink-400'
            }`}
          >
            <Users2 className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              currentTab === 'circles' ? 'stroke-[2.5px] scale-105 text-pink-500' : 'stroke-[1.5px]'
            }`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold uppercase tracking-wider">Circles</span>
            {currentTab === 'circles' && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-pink-500 rounded-full shadow-[0_0_6px_#ec4899]"></span>
            )}
          </button>

          {/* Global System Settings tab */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none ${
              currentTab === 'settings' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <Settings className={`w-5 h-5 ${currentTab === 'settings' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Settings</span>
          </button>

          {/* Admin Control Panel tab */}
          {currentUserEmail === 'coopedill@gmail.com' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none relative ${
                currentTab === 'admin' ? 'text-primary font-bold' : 'text-outline hover:text-primary'
              }`}
            >
              <Shield className={`w-5 h-5 ${currentTab === 'admin' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              <span className="text-[10px] mt-1 font-label leading-none font-bold">Admin</span>
            </button>
          )}
        </nav>
      )}

      {/* New Chat Contact Overlay Builder popup modal */}
      {showNewChatOverlay && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 text-left animate-fade-in flex flex-col max-h-[85vh]">
            <h3 className="font-headline text-2xl font-bold text-primary mb-1">Message a Registered Member</h3>
            <p className="text-xs text-outline mb-4">You can only connect with other users registered to this platform.</p>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Search registered members..."
                value={usersDirSearch}
                onChange={(e) => setUsersDirSearch(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 px-4 pl-10 text-sm font-body text-on-surface focus:ring-1 focus:ring-primary outline-none"
              />
              <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-outline pointer-events-none" />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[220px] max-h-[350px]">
              {loadingUsersDir ? (
                <div className="text-center py-10 text-xs text-outline">Searching registered directory...</div>
              ) : registeredUsersList.filter(u => !u.isSelf && (u.name.toLowerCase().includes(usersDirSearch.toLowerCase()) || (u.username && u.username.toLowerCase().includes(usersDirSearch.toLowerCase())))).length > 0 ? (
                registeredUsersList
                  .filter(u => !u.isSelf && (u.name.toLowerCase().includes(usersDirSearch.toLowerCase()) || (u.username && u.username.toLowerCase().includes(usersDirSearch.toLowerCase()))))
                  .map((u) => (
                    <button
                      key={u.uid}
                      onClick={() => {
                        handleCreateContactConversation(u.name, u.uid, u.avatar);
                        setUsersDirSearch('');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-low transition-all border border-transparent hover:border-outline-variant/10 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img 
                            src={u.avatar} 
                            alt={u.name} 
                            className="w-10 h-10 rounded-full object-cover border border-outline-variant/10"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {u.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                        )}
                        <div>
                          <div className="font-body text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.isSelf && (
                              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-sans flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-outline font-mono">
                            Clock Level {u.clockLevel ?? u.zenLevel ?? 12} • {u.membership}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-full font-semibold group-hover:bg-primary group-hover:text-on-primary transition-all">
                        Chat
                      </span>
                    </button>
                  ))
              ) : (
                <div className="text-center py-12 text-outline flex flex-col items-center justify-center">
                  <span className="text-2xl mb-2">🔒</span>
                  <div className="text-sm font-bold text-on-surface">No Members Found</div>
                  <div className="text-xs px-4 text-center mt-1">
                    {usersDirSearch ? `No registered user matches "${usersDirSearch}".` : "No other users are currently registered on this database."}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowNewChatOverlay(false);
                  setUsersDirSearch('');
                }}
                className="w-full py-3 bg-surface-container-high rounded-xl text-xs font-bold text-outline hover:bg-surface-dim transition-colors text-center uppercase tracking-wider font-label"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
