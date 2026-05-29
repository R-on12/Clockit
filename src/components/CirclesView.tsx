import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Plus, Share2, Tag, Calendar, UserPlus, Search, Star, Compass, MapPin, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import { CommunityCircle, CommunityPost } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface CirclesViewProps {
  circles: CommunityCircle[];
  onAddPost: (circleId: string, content: string) => void;
  onLikePost: (circleId: string, postId: string) => void;
  onAddComment: (circleId: string, postId: string, commentContent: string) => void;
  userAvatar: string;
  onStartDirectChat?: (userId: string, userName: string, userAvatar: string) => void;
}

export const CirclesView: React.FC<CirclesViewProps> = ({
  circles,
  onAddPost,
  onLikePost,
  onAddComment,
  userAvatar,
  onStartDirectChat
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'circles' | 'members'>('circles');
  const [activeCircleId, setActiveCircleId] = useState(circles[0]?.id || '');
  const [newPostText, setNewPostText] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [joinedCircles, setJoinedCircles] = useState<string[]>(['seekers_circle']);

  // Members state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const activeCircle = circles.find(c => c.id === activeCircleId);

  // Hook to fetch and synchronize all platform members from Firestore in real-time
  useEffect(() => {
    if (activeSubTab === 'members') {
      setLoadingUsers(true);
      setUsersError(null);
      const usersRef = collection(db, 'users');
      
      const unsubscribe = onSnapshot(
        usersRef,
        (snapshot) => {
          const fetched: any[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            fetched.push({
              uid: doc.id,
              ...data
            });
          });
          // Sort by Zen Level descending
          fetched.sort((a, b) => (b.zenLevel ?? 0) - (a.zenLevel ?? 0));
          setUsersList(fetched);
          setLoadingUsers(false);
        },
        (err) => {
          console.error('Error listening to user directory:', err);
          setUsersError('Sanctuary Registry temporarily clouded. Please ensure your database is active.');
          setLoadingUsers(false);
        }
      );

      return () => unsubscribe();
    }
  }, [activeSubTab]);

  const handleCreatePost = () => {
    if (!newPostText.trim() || !activeCircleId) return;
    onAddPost(activeCircleId, newPostText);
    setNewPostText('');
  };

  const handleLike = (postId: string) => {
    onLikePost(activeCircleId, postId);
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    onAddComment(activeCircleId, postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const toggleJoinCircle = (circleId: string) => {
    setJoinedCircles(prev => 
      prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId]
    );
  };

  // Human-friendly aura coordinate / sanctuary locator simulator
  const getSanctuaryLocation = (uid: string, name: string) => {
    const sum = (uid || name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const zones = [
      'Whisperwood Spires',
      'Amber Solstice Ridge',
      'Cyan Abyssal Sanctuary',
      'Nebula Zenith Garden',
      'Emerald Grove Oasis',
      'Cosmic Astral Valley',
      'Sunset Meridian Peaks'
    ];
    const chosenZone = zones[sum % zones.length];
    const latitude = ((sum % 180) - 90).toFixed(1);
    const longitude = ((sum % 360) - 180).toFixed(1);
    return {
      zone: chosenZone,
      coord: `${latitude}° N, ${longitude}° E`
    };
  };

  // Handle filtering search results
  const filteredUsers = usersList.filter(u => {
    const queryStr = memberSearchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(queryStr);
    const membershipMatch = (u.membership || '').toLowerCase().includes(queryStr);
    return nameMatch || membershipMatch;
  });

  return (
    <div className="space-y-8 py-6 animate-fade-in" id="circles-parent-view">
      {/* Hero Community Header */}
      <section className="mb-2">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight leading-tight">
          Clockit Community
        </h1>
        <p className="mt-2 text-on-surface-variant font-body text-sm leading-relaxed tracking-wide">
          Enter shared sanctuaries. Locate other alignment seekers and grow as one on the Clockit platform.
        </p>
      </section>

      {/* Sub-navigation tabs: Circles vs Member Finder */}
      <div className="flex border-b border-outline-variant/20 mb-6 gap-2" id="circles-subtabs-navigation">
        <button
          onClick={() => setActiveSubTab('circles')}
          className={`pb-3 px-4 text-xs font-bold font-headline uppercase tracking-widest transition-all border-b-2 outline-none ${
            activeSubTab === 'circles'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-primary'
          }`}
          id="tab-btn-circles"
        >
          Sanctuary Circles
        </button>
        <button
          onClick={() => setActiveSubTab('members')}
          className={`pb-3 px-4 text-xs font-bold font-headline uppercase tracking-widest transition-all border-b-2 outline-none ${
            activeSubTab === 'members'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-primary'
          }`}
          id="tab-btn-find-members"
        >
          Find Members
        </button>
      </div>

      {activeSubTab === 'circles' ? (
        <>
          {/* Circle Selection / Pills */}
          <section className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {circles.map(c => {
              const isActive = c.id === activeCircleId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCircleId(c.id)}
                  className={`py-2 px-5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap outline-none ${
                    isActive 
                      ? 'bg-primary text-on-primary shadow-sm' 
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="mr-1.5">{c.avatar}</span>
                  {c.name}
                </button>
              );
            })}
          </section>

          {activeCircle && (
            <div className="space-y-8" id={`circle-active-panel-${activeCircle.id}`}>
              {/* Active Circle Information */}
              <section className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-outline uppercase tracking-widest font-semibold block mb-1">Active Sanctuary</span>
                    <h2 className="font-headline text-2xl font-bold text-primary">{activeCircle.name}</h2>
                  </div>
                  <button
                    onClick={() => toggleJoinCircle(activeCircle.id)}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold font-label transition-all ${
                      joinedCircles.includes(activeCircle.id)
                        ? 'bg-primary-container/20 text-on-primary-container border border-primary-container/30'
                        : 'bg-primary text-on-primary shadow-sm'
                    }`}
                  >
                    {joinedCircles.includes(activeCircle.id) ? 'Joined' : 'Join'}
                  </button>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant font-body leading-relaxed max-w-lg">
                  {activeCircle.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 items-center">
                  <span className="text-xs text-outline font-label mr-2">
                    {activeCircle.memberCount + (joinedCircles.includes(activeCircle.id) ? 1 : 0)} participants
                  </span>
                  {activeCircle.tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/10 rounded-full py-1 px-2.5 text-[10px] font-semibold text-outline tracking-wider uppercase">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </div>
                  ))}
                </div>
              </section>

              {/* Create Post Sanctuary */}
              {joinedCircles.includes(activeCircle.id) ? (
                <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Share an organic reflection with the ${activeCircle.name}...`}
                    className="w-full bg-surface-container-low rounded-xl p-3 text-sm font-body text-on-surface placeholder:text-outline/40 border-none outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
                  />
                  <div className="flex justify-end pt-3">
                    <button
                      disabled={!newPostText.trim()}
                      onClick={handleCreatePost}
                      className="py-2 px-5 bg-primary text-on-primary disabled:opacity-50 hover:opacity-95 rounded-xl text-xs font-bold font-label uppercase tracking-widest transition-all shadow-sm"
                      id="submit-new-community-post"
                    >
                      Share Pause
                    </button>
                  </div>
                </section>
              ) : (
                <div className="text-center bg-surface-container-low/40 p-6 rounded-2xl border border-dashed border-outline-variant/40">
                  <UserPlus className="w-8 h-8 mx-auto text-outline mb-2" />
                  <p className="text-sm text-outline">Join this circle to share reflections and participate in threads</p>
                </div>
              )}

              {/* Active Post stream */}
              <section className="space-y-6 pb-20">
                {activeCircle.posts.map(post => (
                  <div 
                    key={post.id} 
                    className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4"
                    id={`community-post-${post.id}`}
                  >
                    {/* Author context line */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/20 flex-shrink-0">
                        <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-headline font-semibold text-on-surface">{post.authorName}</h4>
                        <span className="text-[10px] text-outline font-label uppercase tracking-wider block">{post.timeLabel}</span>
                      </div>
                    </div>

                    {/* Main Content */}
                    <p className="text-sm text-on-surface-variant font-body leading-relaxed">
                      {post.content}
                    </p>

                    {/* Engagement counts bar */}
                    <div className="flex items-center gap-6 pt-2 border-t border-outline-variant/10 text-outline">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide hover:text-primary transition-colors ${
                          post.hasLiked ? 'text-primary' : ''
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>

                    {/* Sub-Comments thread */}
                    {post.comments.length > 0 && (
                      <div className="bg-surface-container-low/50 rounded-xl p-4 space-y-3 border border-outline-variant/10">
                        {post.comments.map(c => (
                          <div key={c.id} className="text-xs font-body leading-relaxed space-y-0.5">
                            <div className="flex justify-between items-baseline">
                              <span className="font-semibold text-primary">{c.authorName}</span>
                              <span className="text-[9px] text-outline uppercase tracking-wider">{c.timeLabel}</span>
                            </div>
                            <p className="text-on-surface-variant">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comments entry input */}
                    {joinedCircles.includes(activeCircle.id) && (
                      <div className="flex gap-2 items-center bg-surface-container-low/60 rounded-xl p-1.5 border border-outline-variant/10">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommentInputs(prev => ({ ...prev, [post.id]: val }));
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                          placeholder="Share a thoughtful reply..."
                          className="flex-grow bg-transparent border-none text-xs text-on-surface placeholder:text-outline/50 outline-none px-2 focus:ring-0"
                        />
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          className="py-1.5 px-3 bg-primary text-on-primary rounded-lg text-[10px] font-bold font-label uppercase tracking-widest hover:opacity-90 transition-all shadow-sm"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            </div>
          )}
        </>
      ) : (
        // Find Members section (The search and locate system)
        <div className="space-y-6" id="find-members-container">
          {/* Member Search input */}
          <section className="bg-surface-container-low/50 border border-outline-variant/10 rounded-2xl p-4">
            <div className="relative group/search">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within/search:text-primary transition-colors">
                <Search className="w-5 h-5 animate-pulse" />
              </div>
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary transition-all placeholder:text-outline/50 font-body text-sm outline-none"
                placeholder="Search clockit members by name, status, or membership badge..."
                id="member-search-input"
              />
            </div>
            <div className="flex justify-between items-center mt-3 px-1 text-xs text-outline font-label">
              <span>
                {loadingUsers ? 'Scanning coordinates...' : `Discovered ${filteredUsers.length} of ${usersList.length} global seekers`}
              </span>
              <span>Real-time Sync Active</span>
            </div>
          </section>

          {usersError && (
            <div className="bg-error/10 text-error p-4 rounded-xl flex gap-3 items-center">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-body">{usersError}</p>
            </div>
          )}

          {/* Search Result Listing cards */}
          {loadingUsers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(item => (
                <div key={item} className="bg-surface-container-low rounded-2xl p-6 h-48 animate-pulse border border-outline-variant/10 flex flex-col justify-between">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-outline-variant/30"></div>
                    <div className="space-y-2 flex-grow">
                      <div className="h-4 bg-outline-variant/30 rounded w-2/3"></div>
                      <div className="h-3 bg-outline-variant/20 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-outline-variant/30 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredUsers.map((user) => {
                const loc = getSanctuaryLocation(user.uid, user.name);
                const hasCustomAvatar = !!user.avatar && user.avatar !== 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg';
                const avatarInitials = (user.name || 'Z').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                // Dynamic visual aesthetic styling depending on user preference
                let headerBackground = 'bg-gradient-to-r from-primary/10 to-primary/5';
                if (user.themeMode === 'ocean') headerBackground = 'bg-gradient-to-r from-cyan-950/40 to-blue-900/30';
                else if (user.themeMode === 'forest') headerBackground = 'bg-gradient-to-r from-emerald-950/40 to-green-900/30';
                else if (user.themeMode === 'cosmic') headerBackground = 'bg-gradient-to-r from-fuchsia-950/35 to-violet-950/30';
                else if (user.themeMode === 'sepia') headerBackground = 'bg-gradient-to-r from-amber-50 to-orange-100/20';

                return (
                  <div 
                    key={user.uid}
                    className="group bg-surface-container-low hover:bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-primary/20 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.01)] hover:shadow-md flex flex-col justify-between"
                  >
                    {/* Card Top Aesthetic Ambient bar */}
                    <div className={`h-1.5 ${headerBackground} w-full`}></div>

                    <div className="p-5 space-y-4">
                      {/* User basic card info */}
                      <div className="flex gap-3.5 items-start">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/15 flex-shrink-0 bg-primary/5 flex items-center justify-center">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-sm font-bold font-headline text-primary">{avatarInitials}</span>
                            )}
                          </div>
                          {/* Pulsing indicator representing a dynamic alignment beacon */}
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-surface-container-low animate-pulse"></span>
                        </div>
                        
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-headline font-bold text-base text-on-surface truncate group-hover:text-primary transition-colors">
                              {user.name}
                            </h3>
                            {user.zenLevel >= 25 && (
                              <Sparkles className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] tracking-wide font-headline bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                              {user.membership || 'Aura Member'}
                            </span>
                            <span className="text-[10px] font-mono font-medium text-outline">
                              Zen {user.zenLevel ?? 12}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Locator / Astral Coordinates */}
                      <div className="bg-surface-container-lowest/60 rounded-2xl p-3 border border-outline-variant/10 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body">
                          <Compass className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate">{loc.zone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-outline">
                          <MapPin className="w-3 h-3 text-secondary flex-shrink-0" />
                          <span>{loc.coord}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Connect Actions */}
                    <div className="p-4 border-t border-outline-variant/15 bg-surface-container-lowest/30 flex items-center gap-2">
                      {onStartDirectChat && (
                        <button
                          onClick={() => onStartDirectChat(user.uid, user.name, user.avatar || '')}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-on-primary hover:bg-primary/95 transition-all text-xs font-bold font-label uppercase tracking-widest rounded-xl shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : (
            <div className="text-center py-16 bg-surface-container-low/40 rounded-3xl border border-dashed border-outline-variant/30">
              <Compass className="w-12 h-12 mx-auto text-outline/40 mb-3" />
              <h3 className="font-headline font-bold text-lg text-primary">No alignment seekers found</h3>
              <p className="text-sm font-body text-outline max-w-sm mx-auto mt-2 leading-relaxed">
                We couldn't locate anyone matching "{memberSearchQuery}". Adjust your coordinate terms and try again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
