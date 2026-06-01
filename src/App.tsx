import { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Users2, Settings, TrendingUp, Sparkles, UserCheck, Search } from 'lucide-react';
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
import { InsightsView } from './components/InsightsView';
import { AuthView } from './components/AuthView';

// Firebase Client SDK Integration imports
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer,
  updateDoc
} from 'firebase/firestore';
import { db, auth, logoutUser, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
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
  const [loadingUsersDir, setLoadingUsersDir] = useState<boolean>(false);
  const [usersDirSearch, setUsersDirSearch] = useState<string>('');

  // Sync registered users from Firestore for safe messaging
  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingUsersDir(true);
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Skip current user to prevent direct messaging yourself
        if (doc.id !== currentUserUid) {
          fetched.push({
            uid: doc.id,
            name: data.name || 'Anonymous Member',
            avatar: data.avatar || '',
            membership: data.membership || 'Registered Member',
            zenLevel: data.zenLevel ?? 12
          });
        }
      });
      setRegisteredUsersList(fetched);
      setLoadingUsersDir(false);
    }, (error) => {
      console.error('Error fetching registered users directory:', error);
      setLoadingUsersDir(false);
    });
    return () => unsubscribe();
  }, [isLoggedIn, currentUserUid]);

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
        setIsLoggedIn(true);
        await loadOrCreateUser(user.uid, user.displayName || 'Ronnie');
      } else {
        setCurrentUserUid(null);
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync / Initialize User Profile Settings and Vitals in Firestore
  const loadOrCreateUser = async (uid: string, initialName: string) => {
    const userDocRef = doc(db, 'users', uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        let nameToUse = data.name || initialName;
        let shouldUpdateDoc = false;

        // Correct race conditions where the Firestore doc was pre-maturely auto-created as 'Ronnie'
        if ((data.name === 'Ronnie' || !data.name) && initialName && initialName !== 'Ronnie') {
          nameToUse = initialName;
          shouldUpdateDoc = true;
        }

        const loadedSettings = {
          name: nameToUse,
          membership: data.membership || 'Premium Member',
          zenLevel: data.zenLevel ?? 12,
          avatar: data.avatar || initialUserSettings.avatar,
          notifications: data.notifications || 'Smart Alerts',
          themeMode: (data.themeMode as 'light' | 'dark' | 'sepia' | 'ocean' | 'forest' | 'cosmic') || 'light',
          smartAlerts: data.smartAlerts ?? true,
        };
        setUserSettings(loadedSettings);
        localStorage.setItem('clockit_user_settings', JSON.stringify(loadedSettings));
        if (shouldUpdateDoc) {
          await setDoc(userDocRef, { uid, name: nameToUse }, { merge: true });
        }
        setVitalState({
          sleep: { current: data.sleepCurrent ?? 7.2, target: data.sleepTarget ?? 8.0, unit: 'h' },
          steps: { current: data.stepsCurrent ?? 4.8, target: data.stepsTarget ?? 10.0, unit: 'k' },
          water: { current: data.waterCurrent ?? 1.4, target: data.waterTarget ?? 2.0, unit: 'L' }
        });
      } else {
        const defaultDoc = {
          uid: uid,
          name: initialName,
          membership: 'Premium Member',
          zenLevel: 12,
          avatar: initialUserSettings.avatar,
          notifications: 'Smart Alerts',
          themeMode: 'light',
          smartAlerts: true,
          sleepCurrent: 7.2,
          sleepTarget: 8.0,
          stepsCurrent: 4.8,
          stepsTarget: 10.0,
          waterCurrent: 1.4,
          waterTarget: 2.0
        };
        await setDoc(userDocRef, defaultDoc);
        const defaultSettings = {
          name: initialName,
          membership: 'Premium Member',
          zenLevel: 12,
          avatar: initialUserSettings.avatar,
          notifications: 'Smart Alerts',
          themeMode: 'light',
          smartAlerts: true,
        };
        setUserSettings(defaultSettings);
        localStorage.setItem('clockit_user_settings', JSON.stringify(defaultSettings));
        setVitalState(initialVitalState);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
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
              return {
                ...c,
                posts: loadedPosts
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

  // Handle Vitality State Increments with firestore sync
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
        const userDocRef = doc(db, 'users', currentUserUid);
        const fieldMap = {
          sleep: 'sleepCurrent',
          steps: 'stepsCurrent',
          water: 'waterCurrent'
        };
        setDoc(userDocRef, {
          [fieldMap[metric]]: nextVal
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}`);
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
        zenLevel: prev.zenLevel + 1
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
        setDoc(userDocRef, { uid: currentUserUid, zenLevel: updated.zenLevel }, { merge: true }).catch(err => {
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
        const userDocRef = doc(db, 'users', currentUserUid);
        setDoc(userDocRef, {
          uid: currentUserUid,
          name: updated.name,
          membership: updated.membership,
          zenLevel: updated.zenLevel,
          avatar: updated.avatar,
          notifications: updated.notifications,
          themeMode: updated.themeMode,
          smartAlerts: updated.smartAlerts
        }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUserUid}`);
        });
      }
      return updated;
    });
  };

  // Circle / Community Posts Actions
  const handleAddPost = async (circleId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'none') => {
    const postId = `post_${Date.now()}`;
    const newPost = {
      id: postId,
      circleId,
      authorId: currentUserUid || 'anonymous',
      authorName: `${userSettings.name} Rose`,
      authorAvatar: userSettings.avatar,
      content,
      timeLabel: 'Just Now',
      likes: 0,
      createdAt: new Date().toISOString(),
      ...(mediaUrl ? { mediaUrl } : {}),
      ...(mediaType ? { mediaType } : {})
    };

    const postDocRef = doc(db, 'circles', circleId, 'posts', postId);
    await setDoc(postDocRef, newPost).catch(err => {
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

  const getThemeClass = () => {
    if (userSettings.themeMode === 'dark') return 'theme-dark';
    if (userSettings.themeMode === 'sepia') return 'theme-sepia';
    if (userSettings.themeMode === 'ocean') return 'theme-ocean';
    if (userSettings.themeMode === 'forest') return 'theme-forest';
    if (userSettings.themeMode === 'cosmic') return 'theme-cosmic';
    return '';
  };

  if (!isLoggedIn) {
    return (
      <AuthView 
        defaultName={userSettings.name} 
        onAuthSuccess={async (uid, userName, email) => { 
          setCurrentUserUid(uid);
          setIsLoggedIn(true); 
          await loadOrCreateUser(uid, userName);
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
          <div 
            onClick={() => setCurrentTab('settings')}
            className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant cursor-pointer group hover:scale-105 transition-all shadow-sm"
            id="header-user-profile-circle"
          >
            <img 
              alt={`${userSettings.name} profile`} 
              className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110" 
              src={userSettings.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg"}
              referrerPolicy="no-referrer"
            />
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
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            vitalState={vitalState}
            reflections={reflections}
            userName={userSettings.name}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesView
            conversations={conversations}
            onSelectConversation={handleSelectConversationFromList}
            onStartNewChat={handleTriggerNewChatDialog}
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

        {currentTab === 'settings' && (
          <SettingsView
            userSettings={userSettings}
            onUpdateSettings={handleUpdateUserSettings}
            onSignOut={handleSignOut}
          />
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

          {/* Analytics/Insights tab (Displays "Insights" as seen in image bottom nav) */}
          <button
            onClick={() => setCurrentTab('insights')}
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none ${
              currentTab === 'insights' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${currentTab === 'insights' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Insights</span>
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
            {conversations.some(c => c.unreadCount > 0) && (
              <span className="absolute top-2 right-4 w-2 h-2 bg-secondary rounded-full"></span>
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
              ) : registeredUsersList.filter(u => u.name.toLowerCase().includes(usersDirSearch.toLowerCase())).length > 0 ? (
                registeredUsersList
                  .filter(u => u.name.toLowerCase().includes(usersDirSearch.toLowerCase()))
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
                          <div className="font-body text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-outline font-mono">
                            Zen Level {u.zenLevel} • {u.membership}
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
