import { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Users2, Settings, TrendingUp, Flower, Sparkles, UserCheck } from 'lucide-react';
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [circles, setCircles] = useState<CommunityCircle[]>(initialCircles);
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
  const [userSettings, setUserSettings] = useState<UserSettings>(initialUserSettings);
  const [vitalState, setVitalState] = useState<VitalState>(initialVitalState);
  const [activeConversationId, setActiveConversationId] = useState<string>('julian_m');
  const [showNewChatOverlay, setShowNewChatOverlay] = useState<boolean>(false);

  // Auto-chuckle unread count notification chimes or updates
  useEffect(() => {
    // We can simulate an occasional quiet atmospheric community post or response 
    const timer = setTimeout(() => {
      // Simulate Wellness Guide sending a peaceful greeting if active conversation is not wellness_guide
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

  // Handle Vitality State Increments
  const handleIncrementState = (metric: 'sleep' | 'steps' | 'water') => {
    setVitalState(prev => {
      const target = prev[metric].target;
      const step = metric === 'sleep' ? 0.4 : metric === 'steps' ? 0.8 : 0.2;
      let nextVal = parseFloat((prev[metric].current + step).toFixed(1));
      if (nextVal > target * 1.5) {
        nextVal = parseFloat((prev[metric].current - target).toFixed(1));
        if (nextVal < 0) nextVal = 0;
      }
      return {
        ...prev,
        [metric]: {
          ...prev[metric],
          current: nextVal
        }
      };
    });
  };

  // Chat message submission
  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'user',
      senderName: userSettings.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConversationId) {
        const updatedMsgs = [...c.messages, newMessage];
        return {
          ...c,
          messages: updatedMsgs,
          lastMessage: text,
          timeLabel: 'JUST NOW',
          unreadCount: 0
        };
      }
      return c;
    }));

    // Trigger AI Simulated response
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let replyText = `I hear you, ${userSettings.name}. In this digital sanctuary, every thought has room to rest. Let's take a peaceful moment to align our breath.`;

      if (lowerText.includes('stress') || lowerText.includes('anxious') || lowerText.includes('worry')) {
        replyText = `Take a slow, deep breath and feel your shoulders drop. Let's commit to a 4-7-8 breathing pause together. Would you like me to count the pacing for you?`;
      } else if (lowerText.includes('sleep') || lowerText.includes('tired') || lowerText.includes('exhausted')) {
        replyText = `Sleep is the quiet tide that carries our vitality. Try stepping into silent pasture 30 minutes before bed. I've logged your sleep duration at ${vitalState.sleep.current}h today. Let's keep it steady.`;
      } else if (lowerText.includes('meditate') || lowerText.includes('mindful') || lowerText.includes('zen')) {
        replyText = `Excellent centering, ${userSettings.name}. A single conscious inhale is a meditation in itself. Remember to let passing thoughts glide by like soft forest clouds.`;
      } else if (lowerText.includes('community') || lowerText.includes('yoga') || lowerText.includes('circles')) {
        replyText = `Sharing silent spaces multiplies their restorative harmony. Have you shared your journaling pause in our Clock Seekers circle today? This brings key resonance!`;
      } else if (lowerText.includes('water') || lowerText.includes('hydrate') || lowerText.includes('drink')) {
        replyText = `A pristine stream keeps the heart buoyant. Hydrating steadily at intervals clears neurological strain. You are currently at ${vitalState.water.current}L today! Keep a goblet near.`;
      }

      const companionReply: Message = {
        id: `reply_${Date.now()}`,
        senderId: activeConversationId,
        senderName: activeConversationId === 'julian_m' ? 'Julian M.' : 'Wellness Guide',
        senderAvatar: activeConversationId === 'julian_m' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtbc2t1r8Vs-ObpR8Uu7wZ9i6qL3Hp24MzcsHBVLd8W5xSn7KKoiC2c58Wx337GU1RweBeACbHt-eyZKbVTL70rPKnaeenqQ-tyV-ySd2KPKWD_XbQgO7UW8p8tYu3c8Sj88Gnoh1SJ3dVxp2HIvizMkSeJSphq-1M1bTUcegVn8XagrGMRJYTZmnBm3z-yJ4-yanb__8KRmu9Q1OuBi6erzS8qEoGGEAGk8LkESw5PPuvNxMxpt27m4deez2zBzU3pQFzjmI9JPzb'
          : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: [...c.messages, companionReply],
            lastMessage: replyText,
            timeLabel: 'JUST NOW',
            unreadCount: 0
          };
        }
        return c;
      }));
    }, 1500);
  };

  // Add a new reflection response
  const handleSaveReflection = (newRef: Reflection) => {
    setReflections(prev => [newRef, ...prev]);
    // Gently increase Zen Level to congratulate mindfulness
    setUserSettings(prev => ({
      ...prev,
      zenLevel: prev.zenLevel + 1
    }));
  };

  // Update user profile/nickname
  const handleUpdateUserSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Circle / Community Posts Actions
  const handleAddPost = (circleId: string, content: string) => {
    const newPost = {
      id: `post_${Date.now()}`,
      authorName: `${userSettings.name} Rose`,
      authorAvatar: userSettings.avatar,
      content,
      timeLabel: 'Just Now',
      likes: 0,
      hasLiked: false,
      comments: []
    };

    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        return {
          ...c,
          posts: [newPost, ...c.posts]
        };
      }
      return c;
    }));
  };

  const handleLikePost = (circleId: string, postId: string) => {
    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              const liked = !p.hasLiked;
              return {
                ...p,
                hasLiked: liked,
                likes: p.likes + (liked ? 1 : -1)
              };
            }
            return p;
          })
        };
      }
      return c;
    }));
  };

  const handleAddComment = (circleId: string, postId: string, commentContent: string) => {
    const newComment = {
      id: `comment_${Date.now()}`,
      authorName: userSettings.name,
      content: commentContent,
      timeLabel: 'Just Now'
    };

    setCircles(prev => prev.map(c => {
      if (c.id === circleId) {
        return {
          ...c,
          posts: c.posts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                comments: [...p.comments, newComment]
              };
            }
            return p;
          })
        };
      }
      return c;
    }));
  };

  // Switcher Visual tab routing Helper
  const onNavigate = (tab: string, arg?: string) => {
    if (tab === 'chat_wellness') {
      setActiveConversationId('wellness_guide');
      setCurrentTab('active_guide_chat');
      // Set unread count to 0 when opened
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
  const handleSignOut = () => {
    setVitalState(initialVitalState);
    setCurrentTab('home');
    setIsLoggedIn(false);
  };

  // New Chat Dialog Handler
  const handleTriggerNewChatDialog = () => {
    setShowNewChatOverlay(true);
  };

  const handleCreateContactConversation = (name: string) => {
    const customId = `contact_${Date.now()}`;
    const newConv: Conversation = {
      id: customId,
      name,
      avatar: '', // JL/Letter avatar
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

  // Helper title strings
  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];

  if (!isLoggedIn) {
    return (
      <AuthView 
        defaultName={userSettings.name} 
        onAuthSuccess={(newName) => { 
          setUserSettings(prev => ({ ...prev, name: newName })); 
          setIsLoggedIn(true); 
        }} 
      />
    );
  }

  return (
    <div className="bg-clockit-gradient min-h-screen text-on-background pb-32">
      {/* Dynamic Top App Header (Hidden during active chat transactional context) */}
      {currentTab !== 'active_guide_chat' && (
        <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between glass-pill transition-all" id="app-primary-sticky-header">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center text-primary group" id="main-sidebar-hamburger">
              <Flower className="w-6 h-6 group-hover:rotate-12 transition-transform text-primary animate-pulse" />
            </button>
            <span className="text-xl font-headline tracking-tight text-primary font-bold">Clockit</span>
          </div>
          <div 
            onClick={() => setCurrentTab('settings')}
            className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant cursor-pointer group hover:scale-105 transition-all shadow-sm"
            id="header-user-profile-circle"
          >
            <img 
              alt="User Ronnie Rose profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg"
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
            className={`flex flex-col items-center p-3 transition-colors duration-300 outline-none ${
              currentTab === 'circles' ? 'text-primary' : 'text-outline hover:text-primary'
            }`}
          >
            <Users2 className={`w-5 h-5 ${currentTab === 'circles' ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[10px] mt-1 font-label leading-none font-bold">Circles</span>
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
          <div className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 text-center animate-fade-in">
            <h3 className="font-headline text-xl font-bold text-primary mb-2">Form Wellness Pause</h3>
            <p className="text-xs text-outline mb-6">Enter a companion name to form an invite-only silent thread.</p>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs text-outline font-label block mb-1">Companion Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Leo Vance, Aria Greenfield"
                  id="new-contact-name-input"
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 px-4 text-sm font-body focus:ring-1 focus:ring-primary outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value;
                      if (val.trim()) handleCreateContactConversation(val);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowNewChatOverlay(false)}
                className="flex-grow py-3 bg-surface-container-high rounded-xl text-xs font-bold text-outline uppercase tracking-wider font-label hover:bg-surface-dim transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const inputEl = document.getElementById('new-contact-name-input') as HTMLInputElement;
                  if (inputEl && inputEl.value.trim()) {
                    handleCreateContactConversation(inputEl.value);
                  }
                }}
                className="flex-grow py-3 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-wider font-label hover:opacity-95 transition-all shadow-sm"
              >
                Initiate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
