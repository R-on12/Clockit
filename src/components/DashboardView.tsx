import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Star, 
  Search, 
  Sparkles, 
  Crown, 
  X, 
  CheckCircle, 
  MessageCircle, 
  Bookmark,
  Activity,
  Heart
} from 'lucide-react';
import { Conversation, VitalState, UserSettings } from '../types';

interface DashboardViewProps {
  vitalState: VitalState;
  conversations: Conversation[];
  userSettings: UserSettings;
  onNavigate: (tab: string, arg?: string) => void;
  onIncrementState: (metric: 'sleep' | 'steps' | 'water') => void;
  registeredUsers?: any[];
  onStartDirectChat?: (id: string, name: string, avatar: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vitalState,
  conversations,
  userSettings,
  onNavigate,
  onIncrementState,
  registeredUsers = [],
  onStartDirectChat,
}) => {
  // Recent conversations to display (the most recent conversations)
  const recentChats = conversations.filter(c => c.id !== 'wellness_guide').slice(0, 2);

  // Home-focused states for registered member Profiles list
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<'all' | 'premium' | 'standard'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Peaceful morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Nice afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Quiet evening';
    } else {
      return 'Restful night';
    }
  };

  // Filtered members list
  const filteredUsers = registeredUsers.filter((u) => {
    if (u.isSelf) return false;
    const matchesSearch = u.name.toLowerCase().includes(profileSearchQuery.toLowerCase()) ||
                          (u.username && u.username.toLowerCase().includes(profileSearchQuery.toLowerCase()));
    const isPremium = u.membership?.toLowerCase().includes('premium');
    if (membershipFilter === 'premium') {
      return matchesSearch && isPremium;
    }
    if (membershipFilter === 'standard') {
      return matchesSearch && !isPremium;
    }
    return matchesSearch;
  });

  // Dynamic search/filter debugging log for newly registered user directory searches
  React.useEffect(() => {
    if (profileSearchQuery || membershipFilter !== 'all') {
      console.log(`[DEBUG] Dashboard User Directory Search: query="${profileSearchQuery}", filter="${membershipFilter}", matchingCount=${filteredUsers.length}, totalRegisteredCount=${registeredUsers.length}`);
    }
  }, [profileSearchQuery, membershipFilter, filteredUsers.length, registeredUsers.length]);

  const handleOpenProfile = (user: any) => {
    setSelectedUser(user);
    setQuickMessageText('');
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !onStartDirectChat) return;
    onStartDirectChat(selectedUser.uid, selectedUser.name, selectedUser.avatar);
    // Note: in parent, starting a direct chat will open the active chat view.
    setSelectedUser(null);
  };

  return (
    <div className="space-y-10 py-6 animate-fade-in" id="dashboard-view">
      {/* Hero Welcome */}
      <section className="mb-8">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tight leading-tight">
          {getGreeting()}, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-amber-500 font-extrabold">
            {userSettings.name || 'Seeker'}
          </span>
        </h1>
        <p className="mt-4 text-on-surface-variant font-body tracking-wide">
          Your active communication circles and connections are waiting.
        </p>
      </section>

      {/* Registered Platforms Directory section */}
      <section className="mb-8" id="registered-members-quick-access">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-headline text-primary font-bold">Registered Members</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">Explore and connect with registered pioneers on the platform.</p>
          </div>
          <span className="self-start sm:self-center text-[10px] font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
            {registeredUsers.length} {registeredUsers.length === 1 ? 'seeker' : 'seekers'} registered
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search registered names..."
              value={profileSearchQuery}
              onChange={(e) => setProfileSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 focus:border-primary focus:outline-none rounded-xl text-sm transition-all text-on-surface placeholder-outline/65"
              id="member-profile-search-input"
            />
            {profileSearchQuery && (
              <button 
                onClick={() => setProfileSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 self-start overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setMembershipFilter('all')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                membershipFilter === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/10'
              }`}
            >
              All Members
            </button>
            <button
              onClick={() => setMembershipFilter('premium')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                membershipFilter === 'premium'
                  ? 'bg-amber-500/15 border border-amber-500/40 text-amber-500 font-bold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Premium Only
            </button>
            <button
              onClick={() => setMembershipFilter('standard')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                membershipFilter === 'standard'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/10'
              }`}
            >
              Standard Only
            </button>
          </div>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredUsers.map((user) => {
              const isPremium = user.membership?.toLowerCase().includes('premium');
              return (
                <div
                  key={user.uid}
                  className="group relative flex flex-col justify-between bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-primary/20 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm"
                  id={`member-profile-card-${user.uid}`}
                >
                  {/* Subtle profile backdrop header panel */}
                  <div className={`h-12 w-full bg-gradient-to-r ${
                    isPremium 
                      ? 'from-amber-500/10 via-pink-500/5 to-amber-500/15' 
                      : 'from-primary/10 via-background to-secondary/15'
                  }`} />
                  
                  {/* Main profile card information */}
                  <div className="px-4 pb-4 pt-0 -mt-6">
                    <div className="flex items-end justify-between mb-3">
                      <div className="relative group-hover:scale-105 transition-transform duration-300">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className={`w-14 h-14 rounded-full object-cover border-2 shadow-sm ${
                              isPremium ? 'border-amber-400' : 'border-primary-container'
                            }`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                            isPremium 
                              ? 'bg-amber-400/20 text-amber-500 border-amber-400' 
                              : 'bg-primary/10 text-primary border-primary-container'
                          }`}>
                            {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                        )}
                        <span 
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-surface-container-low rounded-full ${
                            user.isOnline ? 'bg-emerald-500' : 'bg-outline-variant'
                          }`} 
                          title={user.isOnline ? 'Active Platform Seeker' : 'Offline'} 
                        />
                      </div>

                      {/* Membership / Profile status pills */}
                      <div className="flex flex-col items-end gap-1">
                        {user.isSelf ? (
                          <span className="text-[9px] font-extrabold bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                            You
                          </span>
                        ) : isPremium ? (
                          <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5" />
                            Premium
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-outline-variant/30 text-on-surface-variant px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Standard
                          </span>
                        )}
                        
                        <span className="text-[9px] text-outline font-mono">
                          Zen Lvl {user.clockLevel ?? 12}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {user.isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Active Now" />
                        )}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                        {isPremium 
                          ? '🌟 Authorized premium system seeker & explorer' 
                          : '💬 Active participant in private circles'}
                      </p>
                    </div>

                    {/* Interactive buttons */}
                    <div className="mt-4 pt-3 border-t border-outline-variant/10 flex gap-2">
                      <button
                        onClick={() => handleOpenProfile(user)}
                        className="flex-1 text-center py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        id={`btn-view-profile-${user.uid}`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onStartDirectChat?.(user.uid, user.name, user.avatar)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-primary/10"
                        id={`btn-chat-${user.uid}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-low/40 border border-dashed border-outline-variant/30 rounded-2xl p-8 text-center text-outline">
            <p className="text-sm font-semibold mb-1">No matching registered seekers</p>
            <p className="text-xs">Try adjusting your search keyword or membership filters to locate seekers.</p>
          </div>
        )}
      </section>

      {/* Active Chats Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-headline text-primary font-medium">Recent Conversations</h2>
          <button 
            onClick={() => onNavigate('messages')} 
            className="text-primary text-sm font-semibold hover:underline"
            id="view-all-conversations"
          >
            View all
          </button>
        </div>
        <div className="space-y-4">
          {recentChats.map((chat) => {
            const isUnread = chat.unreadCount > 0;
            return (
              <div
                key={chat.id}
                onClick={() => onNavigate('active_guide_chat', chat.id)}
                className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all cursor-pointer hover:scale-[0.99] active:scale-[0.98]"
                id={`chat-item-${chat.id}`}
              >
                {/* Avatar Icon */}
                <div className="relative flex-shrink-0">
                  {chat.avatar ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container/20">
                      <img
                        alt={chat.name}
                        className="w-full h-full object-cover"
                        src={chat.avatar}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-semibold text-lg">
                      {chat.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  )}
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface-container-lowest"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-headline font-semibold text-on-surface truncate pr-2">{chat.name}</h3>
                    <span className="text-[10px] font-label text-outline uppercase tracking-wider">{chat.timeLabel}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant truncate mt-0.5">
                    {chat.lastMessageSender && (
                      <span className="font-semibold text-primary mr-1">{chat.lastMessageSender}:</span>
                    )}
                    {chat.lastMessage}
                  </p>
                </div>

                {isUnread && (
                  <div className="w-5 h-5 bg-primary text-on-primary text-[10px] rounded-full flex items-center justify-center font-bold">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Insights/Weekly Ritual Preview */}
      <section className="mb-14 pb-8">
        <div 
          onClick={() => onNavigate('circles')}
          className="bg-secondary-container rounded-2xl p-6 flex items-center justify-between overflow-hidden relative border border-outline-variant/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
          id="weekly-ritual-dashboard-card"
        >
          <div className="z-10">
            <h3 className="text-on-secondary-container font-headline text-lg font-bold mb-1">Weekly Ritual</h3>
            <p className="text-on-secondary-container/80 max-w-[220px] text-xs leading-relaxed font-body">
              You've connected with 4 new community members this week!
            </p>
          </div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-on-secondary-container/15">
            <Star className="w-24 h-24 fill-current" />
          </div>
        </div>
      </section>

      {/* Interactive Detail Profile Modal Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in" id="profile-detail-modal-overlay">
          <div className="relative w-full max-w-md bg-surface-container-high rounded-3xl border border-outline-variant/35 shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header backdrop gradient */}
            <div className={`h-28 w-full bg-gradient-to-tr ${
              selectedUser.membership?.toLowerCase().includes('premium')
                ? 'from-amber-500/20 via-pink-500/15 to-rose-500/20'
                : 'from-primary/20 via-background to-secondary/20'
            } flex items-start justify-end p-4`}>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-full bg-background/30 hover:bg-background/65 text-on-surface hover:scale-105 transition-all cursor-pointer"
                aria-label="Close user profile"
                id="close-profile-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Overlap */}
            <div className="px-6 pb-6 relative -mt-10">
              <div className="flex items-end justify-between mb-4">
                <div className="relative">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className={`w-20 h-20 rounded-full object-cover border-4 ${
                        selectedUser.membership?.toLowerCase().includes('premium') ? 'border-amber-400' : 'border-primary'
                      } shadow-md`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl border-4 ${
                      selectedUser.membership?.toLowerCase().includes('premium')
                        ? 'bg-amber-400/20 text-amber-500 border-amber-400'
                        : 'bg-primary/20 text-primary border-primary'
                    }`}>
                      {selectedUser.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-surface-container-high rounded-full animate-pulse" />
                </div>

                <div className="flex flex-col items-end">
                  {selectedUser.isSelf ? (
                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
                      Personal Profile
                    </span>
                  ) : selectedUser.membership?.toLowerCase().includes('premium') ? (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                      <Crown className="w-3 h-3 text-amber-500" />
                      Premium Tier
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-outline-variant/30 text-on-surface-variant px-3 py-1 rounded-full uppercase tracking-widest">
                      Standard Seeker
                    </span>
                  )}
                </div>
              </div>

              {/* Seeker metadata */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface tracking-tight">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-outline font-mono select-all select-text">
                      UID: {selectedUser.uid.substring(0, 8)}...{selectedUser.uid.substring(selectedUser.uid.length - 4)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline/40" />
                    <span className="text-xs text-primary font-semibold">
                      Zen Level {selectedUser.clockLevel ?? 12}
                    </span>
                  </div>
                </div>

                {/* Additional decorative status lines to enrich presentation with true craftsmanship */}
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Member since connection setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Active in 4 synchronized circles</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span>Focusing on Peaceful Mental Well-being</span>
                  </div>
                </div>

                {/* Initial quick message / chat trigger */}
                {!selectedUser.isSelf && onStartDirectChat ? (
                  <form onSubmit={handleSendQuickMessage} className="mt-5 space-y-3" id="quick-icebreaker-chat-form">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">
                      Send a quick greeting
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Say hello to ${selectedUser.name.split(' ')[0]}...`}
                        value={quickMessageText}
                        onChange={(e) => setQuickMessageText(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-surface-container border border-outline-variant/35 focus:border-primary focus:outline-none rounded-xl text-sm transition-all text-on-surface placeholder-outline/65"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-on-primary font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-primary/15 whitespace-nowrap flex items-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                    </div>
                  </form>
                ) : selectedUser.isSelf ? (
                  <p className="text-xs text-center text-outline italic pt-3">
                    You cannot send a message to yourself.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
