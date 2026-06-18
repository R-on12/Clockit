import React, { useState } from 'react';
import { Search, UserPlus, UserMinus, UserCheck, UserX, MessageSquare, Clock, Sparkles, Compass, Users } from 'lucide-react';

interface AppUser {
  uid: string;
  name: string;
  avatar?: string;
  membership?: string;
  clockLevel?: number;
  zenLevel?: number;
  isSelf?: boolean;
  email?: string;
  isOnline?: boolean;
  createdAt?: string | null;
}

interface Friendship {
  id: string;
  users: string[];
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
  createdAt: string;
}

interface FriendsViewProps {
  currentUserId: string;
  registeredUsers: AppUser[];
  friendships: Friendship[];
  onSendRequest: (receiverId: string, receiverName: string, receiverAvatar: string) => Promise<void>;
  onAcceptRequest: (friendshipId: string) => Promise<void>;
  onRejectRequest: (friendshipId: string) => Promise<void>;
  onCancelRequest: (friendshipId: string) => Promise<void>;
  onRemoveFriend: (friendshipId: string) => Promise<void>;
  onStartDirectChat: (id: string, name: string, avatar: string) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUserId,
  registeredUsers,
  friendships,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onRemoveFriend,
  onStartDirectChat,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'requests' | 'friends'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to get relationship with any other user
  const getRelationshipStatus = (otherUid: string) => {
    const rel = friendships.find(f => f.users.includes(otherUid));
    if (!rel) return { status: 'none', friendshipId: null, senderId: null };
    return {
      status: rel.status, // 'pending' | 'accepted'
      friendshipId: rel.id,
      senderId: rel.senderId,
      receiverId: rel.receiverId
    };
  };

  // 1. Discover: Exclude self, and show others
  const discoverUsers = registeredUsers.filter(u => u.uid !== currentUserId);

  const filteredDiscover = discoverUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.membership && u.membership.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 2. Friends list (connections where status is 'accepted')
  const friendsList = registeredUsers.filter(u => {
    if (u.uid === currentUserId) return false;
    const rel = getRelationshipStatus(u.uid);
    return rel.status === 'accepted';
  });

  const filteredFriends = friendsList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Pending requests
  const incomingRequests = registeredUsers.filter(u => {
    const rel = getRelationshipStatus(u.uid);
    return rel.status === 'pending' && rel.senderId === u.uid;
  });

  const outgoingRequests = registeredUsers.filter(u => {
    const rel = getRelationshipStatus(u.uid);
    return rel.status === 'pending' && rel.senderId === currentUserId;
  });

  // User Search logging for connections page
  React.useEffect(() => {
    if (searchQuery || activeSubTab) {
      console.log(`[DEBUG] Friends Tab Search: subTab="${activeSubTab}", query="${searchQuery}", discoverCount=${filteredDiscover.length}, friendsCount=${filteredFriends.length}, incomingRequests=${incomingRequests.length}, outgoingRequests=${outgoingRequests.length}`);
    }
  }, [searchQuery, activeSubTab, filteredDiscover.length, filteredFriends.length, incomingRequests.length, outgoingRequests.length]);

  // Action wrappers with loading and fallback reporting
  const handleAction = async (actionId: string, fn: () => Promise<void>) => {
    setErrorMsg('');
    setActionLoading(actionId);
    try {
      await fn();
    } catch (err: any) {
      console.error(`Friendship action failed for ${actionId}:`, err);
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = incomingRequests.length;

  return (
    <div className="space-y-8 py-6 animate-fade-in" id="friends-view-screen">
      {/* Brand Header */}
      <section className="mb-6">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight leading-tight mb-2">
          Connections
        </h1>
        <p className="text-on-surface-variant font-body text-sm">
          Discover other seekers, establish alignment channels, and build your peaceful circle.
        </p>
      </section>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-mono leading-relaxed" id="friends-error-banner">
          ⚠️ Action Interrupted: {errorMsg}
        </div>
      )}

      {/* Filter and Tab Controller */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-outline-variant/10 pb-3">
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/5 shadow-sm">
          <button
            onClick={() => { setActiveSubTab('discover'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer font-label ${
              activeSubTab === 'discover'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('friends'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer font-label ${
              activeSubTab === 'friends'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends ({friendsList.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('requests'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer relative font-label ${
              activeSubTab === 'requests'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-4 text-center animate-pulse shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Realtime Search Input (Visible on discover & friends list) */}
        {activeSubTab !== 'requests' && (
          <div className="relative group/search shrink-0 w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/15 hover:border-outline-variant/30 rounded-xl py-2 px-3 pl-9 text-xs font-body text-on-surface focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline/65"
              placeholder={activeSubTab === 'discover' ? "Search new seekers..." : "Find a friend..."}
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline pointer-events-none" />
          </div>
        )}
      </section>

      {/* Main Area based on Tab choice */}
      <section className="min-h-[300px]">
        {/* --- Discover Tab --- */}
        {activeSubTab === 'discover' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline px-1">Seeker Search Result ({filteredDiscover.length})</h3>
            {filteredDiscover.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDiscover.map((member) => {
                  const rel = getRelationshipStatus(member.uid);
                  const isPendingSender = rel.status === 'pending' && rel.senderId === currentUserId;
                  const isPendingReceiver = rel.status === 'pending' && rel.senderId === member.uid;
                  const isFriend = rel.status === 'accepted';

                  return (
                    <div
                      key={member.uid}
                      className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-outline-variant/30 transition-all hover:translate-y-[-1px] relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-11 h-11 rounded-full object-cover border border-outline shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                              {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface shadow-sm ${
                              member.isOnline ? 'bg-emerald-500' : 'bg-outline-variant/70'
                            }`}
                            title={member.isOnline ? 'Online now' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-on-surface truncate pr-1 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.isOnline && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-medium px-1.5 py-0.2 rounded-full font-sans">
                                Active
                              </span>
                            )}
                          </h4>
                          {member.email && (
                            <p className="text-[10px] text-outline/85 truncate" title={member.email}>
                              {member.email}
                            </p>
                          )}
                          <p className="text-[9px] text-outline/55 font-mono mt-0.5 uppercase tracking-wide">
                            Lvl {member.clockLevel ?? member.zenLevel ?? 12} • {member.membership || 'Registered Seekr'}
                            {member.createdAt && ` • Joined ${new Date(member.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFriend && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onStartDirectChat(member.uid, member.name, member.avatar || '')}
                              className="p-2 bg-primary/10 hover:bg-primary hover:text-on-primary transition-all text-primary rounded-xl"
                              title="Start Direct Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 rounded-full py-1 px-2.5 font-bold font-label uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Friend</span>
                            </span>
                          </div>
                        )}

                        {isPendingSender && (
                          <button
                            disabled={actionLoading === rel.friendshipId}
                            onClick={() => handleAction(rel.friendshipId || '', () => onCancelRequest(rel.friendshipId || ''))}
                            className="text-[11px] bg-amber-500/10 hover:bg-red-500/10 text-amber-500 hover:text-red-500 border border-amber-500/20 hover:border-red-500/20 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider cursor-pointer font-label transition-all shrink-0 flex items-center gap-1"
                          >
                            <Clock className={`w-3 h-3 ${actionLoading === rel.friendshipId ? 'animate-spin' : ''}`} />
                            <span>Requested</span>
                          </button>
                        )}

                        {isPendingReceiver && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              disabled={actionLoading === rel.friendshipId}
                              onClick={() => handleAction(rel.friendshipId || '', () => onAcceptRequest(rel.friendshipId || ''))}
                              className="bg-primary hover:opacity-95 text-on-primary px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer font-label transition-all shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              disabled={actionLoading === rel.friendshipId}
                              onClick={() => handleAction(rel.friendshipId || '', () => onRejectRequest(rel.friendshipId || ''))}
                              className="bg-surface border border-outline-variant/30 text-outline hover:text-red-500 p-1.5 rounded-full transition-colors cursor-pointer"
                              title="Decline"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {rel.status === 'none' && (
                          <button
                            disabled={actionLoading === member.uid}
                            onClick={() => handleAction(member.uid, () => onSendRequest(member.uid, member.name, member.avatar || ''))}
                            className="bg-primary/5 hover:bg-primary hover:text-on-primary border border-primary/20 hover:border-primary px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary cursor-pointer font-label transition-all shrink-0 flex items-center gap-1"
                          >
                            <UserPlus className={`w-3.5 h-3.5 ${actionLoading === member.uid ? 'animate-spin' : ''}`} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface-container-low border border-dashed border-outline-variant/20 rounded-2xl text-outline flex flex-col items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary mb-2 animate-bounce" />
                <div className="text-sm font-bold text-on-surface">Connecting Outer Dimensions...</div>
                <p className="text-xs px-4 text-center mt-1">
                  {searchQuery ? `No active search matches "${searchQuery}".` : "Enter a search term above, or invite additional users to login!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Friends Tab --- */}
        {activeSubTab === 'friends' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-outline px-1">My Connection Directory ({filteredFriends.length})</h3>
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredFriends.map((member) => {
                  const rel = getRelationshipStatus(member.uid);
                  return (
                    <div
                      key={member.uid}
                      className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-outline-variant/30 transition-all hover:translate-y-[-1px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-11 h-11 rounded-full object-cover border border-outline shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                              {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface shadow-sm ${
                              member.isOnline ? 'bg-emerald-500' : 'bg-outline-variant/70'
                            }`}
                            title={member.isOnline ? 'Online now' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-on-surface truncate pr-1 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.isOnline && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-medium px-1.5 py-0.2 rounded-full font-sans">
                                Active
                              </span>
                            )}
                          </h4>
                          {member.email && (
                            <p className="text-[10px] text-outline/85 truncate" title={member.email}>
                              {member.email}
                            </p>
                          )}
                          <p className="text-[9px] text-outline/55 font-mono mt-0.5 uppercase tracking-wide">
                            Lvl {member.clockLevel ?? member.zenLevel ?? 12} • {member.membership}
                            {member.createdAt && ` • Joined ${new Date(member.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onStartDirectChat(member.uid, member.name, member.avatar || '')}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-on-primary text-primary rounded-full text-[10px] font-bold uppercase tracking-wider transition-all font-label flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>

                        <button
                          disabled={actionLoading === rel.friendshipId}
                          onClick={() => handleAction(rel.friendshipId || '', () => onRemoveFriend(rel.friendshipId || ''))}
                          className="bg-surface-container border border-outline-variant/15 text-outline hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/30 p-2 rounded-xl transition-all cursor-pointer"
                          title="Unfriend Seeker"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-surface-container-low border border-dashed border-outline-variant/20 rounded-2xl text-outline flex flex-col items-center justify-center">
                <Users className="w-8 h-8 text-primary mb-2" />
                <div className="text-sm font-bold text-on-surface">A Quiet Circle</div>
                <p className="text-xs px-4 text-center mt-1">
                  {searchQuery ? `No friends match "${searchQuery}".` : "You haven't established any connections yet. Go to Discover to add friends!"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Requests Tab --- */}
        {activeSubTab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming requests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 px-1">Awaiting Your Alignment ({incomingRequests.length})</h3>
              {incomingRequests.length > 0 ? (
                <div className="space-y-3">
                  {incomingRequests.map((member) => {
                    const rel = getRelationshipStatus(member.uid);
                    return (
                      <div
                        key={member.uid}
                        className="bg-surface-container p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm border border-outline-variant/10 animate-fade-in"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-11 h-11 rounded-full object-cover border border-outline shadow-sm shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface shadow-sm ${
                                member.isOnline ? 'bg-emerald-500' : 'bg-outline-variant/70'
                              }`}
                              title={member.isOnline ? 'Online now' : 'Offline'}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-on-surface truncate flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.isOnline && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-medium px-1.5 py-0.2 rounded-full font-sans">
                                  Active
                                </span>
                              )}
                            </h4>
                            {member.email && (
                              <p className="text-[10px] text-outline/85 truncate" title={member.email}>
                                {member.email}
                              </p>
                            )}
                            <p className="text-[9px] text-outline/55 font-mono mt-0.5 uppercase tracking-wide">
                              Lvl {member.clockLevel ?? member.zenLevel ?? 12} • {member.membership}
                              {member.createdAt && ` • Joined ${new Date(member.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            disabled={actionLoading === rel.friendshipId}
                            onClick={() => handleAction(rel.friendshipId || '', () => onAcceptRequest(rel.friendshipId || ''))}
                            className="bg-primary hover:opacity-95 text-on-primary px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer font-label transition-all shadow-sm flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            disabled={actionLoading === rel.friendshipId}
                            onClick={() => handleAction(rel.friendshipId || '', () => onRejectRequest(rel.friendshipId || ''))}
                            className="px-3.5 py-1.5 bg-surface border border-outline-variant/30 text-outline hover:text-red-500 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer font-label transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-outline italic px-1">No incoming alignment requests outstanding.</p>
              )}
            </div>

            {/* Outgoing requests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 px-1">Sent Invites Pending ({outgoingRequests.length})</h3>
              {outgoingRequests.length > 0 ? (
                <div className="space-y-3">
                  {outgoingRequests.map((member) => {
                    const rel = getRelationshipStatus(member.uid);
                    return (
                      <div
                        key={member.uid}
                        className="bg-surface/40 p-4 rounded-2xl flex items-center justify-between gap-4 border border-outline-variant/10 text-on-surface opacity-80"
                      >
                        <div className="flex items-center gap-3 min-w-0 font-body">
                          <div className="relative shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover border border-outline shadow-sm shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                                {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface shadow-sm ${
                                member.isOnline ? 'bg-emerald-500' : 'bg-outline-variant/70'
                              }`}
                              title={member.isOnline ? 'Online now' : 'Offline'}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm truncate flex items-center gap-1.5">
                              <span>{member.name} (Awaiting)</span>
                              {member.isOnline && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-medium px-1.5 py-0.2 rounded-full font-sans">
                                  Active
                                </span>
                              )}
                            </h4>
                            {member.email && (
                              <p className="text-[10px] text-outline/85 truncate mb-0.5" title={member.email}>
                                {member.email}
                              </p>
                            )}
                            <p className="text-[9px] text-outline/55 font-mono">
                              Level {member.clockLevel ?? member.zenLevel ?? 12} seeker
                              {member.createdAt && ` • Invited ${new Date(member.createdAt).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={actionLoading === rel.friendshipId}
                          onClick={() => handleAction(rel.friendshipId || '', () => onCancelRequest(rel.friendshipId || ''))}
                          className="px-3.5 py-1.5 bg-surface-container hover:bg-red-500/5 hover:border-red-500/20 border border-outline-variant/15 text-outline hover:text-red-500 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer font-label"
                        >
                          Cancel invite
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-outline italic px-1">No active outgoing invites outstanding.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
