import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  Award, 
  Send, 
  Mail, 
  TrendingUp, 
  Info, 
  Sparkles,
  RefreshCw,
  UserX,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs
} from 'firebase/firestore';

interface ReviewTicket {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  category: string;
  text: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

interface AppUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  membership?: string;
  zenLevel?: number;
  lastActive?: string;
}

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [reviews, setReviews] = useState<ReviewTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs within admin panel
  const [activeTab, setActiveTab] = useState<'users' | 'reviews' | 'broadcasting'>('users');
  
  // Search state
  const [userSearch, setUserSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Broadcast system state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTopic, setBroadcastTopic] = useState('System Maintenance');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Fetch real-time users and reviews
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to users
    const usersRef = collection(db, 'users');
    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      const uList: AppUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        uList.push({
          id: doc.id,
          name: data.name || 'Anonymous User',
          email: data.email || `${(data.name || 'user').toLowerCase().replace(/\s+/g, '')}@clockit.com`,
          avatar: data.avatar || '',
          membership: data.membership || 'Standard',
          zenLevel: data.zenLevel ?? 12,
          lastActive: data.lastActive || new Date().toISOString()
        });
      });
      setUsers(uList);
    }, (err) => {
      console.error('Admin view fetch users error:', err);
    });

    // Subscribe to reviews & support tickets
    const reviewsRef = collection(db, 'reviews');
    const unsubReviews = onSnapshot(reviewsRef, (snapshot) => {
      const rList: ReviewTicket[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        rList.push({
          id: doc.id,
          userName: data.userName || 'Anonymous Usr',
          userEmail: data.userEmail || 'unknown@clockit.com',
          userAvatar: data.userAvatar || '',
          category: data.category || 'App Feedback',
          text: data.text || '',
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || 'pending'
        });
      });
      // Sort reviews newest first
      rList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(rList);
      setLoading(false);
    }, (err) => {
      console.error('Admin view fetch reviews error:', err);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReviews();
    };
  }, []);

  // Update a review ticket's status
  const handleToggleReviewStatus = async (ticketId: string, currentStatus: 'pending' | 'resolved') => {
    try {
      const ticketDocRef = doc(db, 'reviews', ticketId);
      const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
      await updateDoc(ticketDocRef, {
        status: newStatus
      });
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  // Delete a review/ticket
  const handleDeleteReview = async (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this report/review document?')) {
      try {
        await deleteDoc(doc(db, 'reviews', ticketId));
      } catch (err) {
        console.error('Failed to delete review:', err);
      }
    }
  };

  // Adjust User Zen score directly in DB
  const handleModifyUserZen = async (userId: string, currentLevel: number, delta: number) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        zenLevel: Math.max(1, currentLevel + delta)
      });
    } catch (err) {
      console.error('Failed to update User score:', err);
    }
  };

  // Promote User Membership
  const handleModifyUserMembership = async (userId: string, currentTier: string) => {
    const tiers = ['Standard', 'Premium Member', 'Zen Master'];
    const currentIndex = tiers.indexOf(currentTier);
    const nextIndex = (currentIndex + 1) % tiers.length;
    const nextTier = tiers[nextIndex];

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        membership: nextTier
      });
    } catch (err) {
      console.error('Failed to update User tier:', err);
    }
  };

  // Broadcast Notification
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      // Simulate broadcasting to public notice board
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
      setBroadcastText('');
    } catch (err) {
      console.error('Failed to broadcast:', err);
    }
  };

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.membership?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.text.toLowerCase().includes(reviewSearch.toLowerCase()) || 
                          r.userName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                          r.userEmail.toLowerCase().includes(reviewSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8 py-6 animate-fade-in" id="admin-view-viewport">
      {/* Brand Header */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest font-mono">
            <Shield className="w-4 h-4 text-primary fill-primary/10" />
            <span>Clockit Control Panel</span>
          </div>
          <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mt-2">
            Platform Monitor
          </h2>
          <p className="text-on-surface-variant text-sm font-body mt-2">
            Real-time diagnostics, reviews, database alignment scores, and direct oversight.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-xs font-semibold text-primary font-mono shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>SYSTEM ACTIVE & SYNCED</span>
        </div>
      </section>

      {/* Analytics KPI Dashboard Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-3xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-outline font-label uppercase tracking-wider font-semibold">User Directory</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-black text-on-surface">
            {users.length}
          </div>
          <div className="text-[10px] text-primary mt-1 font-mono">Active on Firestore</div>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-5 rounded-3xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-pink-500/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-outline font-label uppercase tracking-wider font-semibold">Live Feedbacks</span>
            <MessageSquare className="w-4 h-4 text-pink-500" />
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-black text-on-surface">
            {reviews.length}
          </div>
          <div className="text-[10px] text-pink-500 mt-1 font-mono">Reviews & Reports</div>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-5 rounded-3xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-amber-500/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-outline font-label uppercase tracking-wider font-semibold">Unresolved Action Items</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-black text-on-surface text-amber-500">
            {pendingCount}
          </div>
          <div className="text-[10px] text-amber-500 mt-1 font-mono">Awaiting Review</div>
        </div>

        <div className="bg-surface-container-low p-4 sm:p-5 rounded-3xl border border-outline-variant/10 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-secondary/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-outline font-label uppercase tracking-wider font-semibold">Wellness Score</span>
            <Award className="w-4 h-4 text-secondary" />
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-black text-on-surface">
            {users.length > 0 
              ? Math.round(users.reduce((acc, curr) => acc + (curr.zenLevel || 0), 0) / users.length) 
              : 12}
          </div>
          <div className="text-[10px] text-secondary mt-1 font-mono">Average Zen Rating</div>
        </div>
      </section>

      {/* Navigation Sub-tab Control Panel */}
      <section className="flex border-b border-outline-variant/10 py-1">
        {[
          { id: 'users', label: 'Registered Directory', count: users.length, icon: Users },
          { id: 'reviews', label: 'User Feedback Logs', count: reviews.length, badge: pendingCount, icon: FileText },
          { id: 'broadcasting', label: 'Broadcast Dispatcher', icon: Send }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold cursor-pointer transition-all uppercase tracking-wider font-label ${
                isSelected 
                  ? 'border-primary text-primary font-bold' 
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-500 text-white font-bold rounded-full animate-pulse">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {/* Main Container Workspace */}
      <section className="bg-surface-container-low/30 border border-outline-variant/15 rounded-3xl p-4 sm:p-6 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-outline space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <div className="text-sm font-semibold">Synchronizing with Clockit Master Database...</div>
          </div>
        ) : (
          <>
            {/* View A: Users Directory Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold font-headline text-on-surface">Database Accounts ({filteredUsers.length})</h3>
                    <p className="text-xs text-outline font-body">Manage specific privileges, alignments, and tiers manually.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <input 
                      type="text" 
                      placeholder="Search users or tiers..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/20 rounded-xl py-2 px-3 pl-9 text-xs font-body focus:ring-1 focus:ring-primary outline-none text-on-surface"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-on-surface border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/10 text-outline font-semibold uppercase tracking-wider font-label">
                        <th className="py-3 px-2">Member</th>
                        <th className="py-3 px-2">Secure Email</th>
                        <th className="py-3 px-2">Membership Tier</th>
                        <th className="py-3 px-2 text-center">Zen Alignment</th>
                        <th className="py-3 px-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors group">
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-3">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                                    {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                  </div>
                                )}
                                <div className="font-semibold text-sm text-on-surface">{u.name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-on-surface-variant font-mono">{u.email}</td>
                            <td className="py-4 px-2">
                              <button 
                                onClick={() => handleModifyUserMembership(u.id, u.membership || 'Standard')}
                                className="px-3 py-1 bg-surface border border-outline-variant/20 rounded-full text-[10px] font-bold tracking-wide hover:border-primary/50 text-primary uppercase transition-all"
                              >
                                {u.membership}
                              </button>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => handleModifyUserZen(u.id, u.zenLevel || 12, -1)}
                                  className="w-6 h-6 rounded bg-surface hover:bg-surface-container text-on-surface hover:text-primary transition-all flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold w-6">{u.zenLevel}</span>
                                <button 
                                  onClick={() => handleModifyUserZen(u.id, u.zenLevel || 12, 1)}
                                  className="w-6 h-6 rounded bg-surface hover:bg-surface-container text-on-surface hover:text-primary transition-all flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <span className="text-[10px] text-outline font-mono">
                                Registered User
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-outline">
                            No member matches "{userSearch}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View B: User Feedback Logs & Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold font-headline text-on-surface">Feedback, Reviews & Emails List ({filteredReviews.length})</h3>
                    <p className="text-xs text-outline font-body">Live logs submitted from the custom Setting Support Hub.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-surface border border-outline-variant/20 rounded-xl py-2 px-3 text-xs font-body text-on-surface outline-none"
                    >
                      <option value="all">All Topics</option>
                      <option>Technical Help</option>
                      <option>Billing & Sanctuary Plans</option>
                      <option>Guided Meditation Requests</option>
                      <option>App Feedback</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-surface border border-outline-variant/20 rounded-xl py-2 px-3 text-xs font-body text-on-surface outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                    </select>

                    <div className="relative w-full sm:w-56 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Search text or emails..."
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/20 rounded-xl py-2 px-3 pl-9 text-xs font-body focus:ring-1 focus:ring-primary outline-none text-on-surface"
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((r) => (
                      <div 
                        key={r.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          r.status === 'resolved' 
                            ? 'bg-surface/40 border-outline-variant/10 opacity-70' 
                            : 'bg-surface-container-low border-outline-variant/20 shadow-md ring-1 ring-primary/5'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {r.userAvatar ? (
                              <img src={r.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-outline-variant/15" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-xs uppercase">
                                {r.userName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm text-on-surface">{r.userName}</div>
                              <div className="text-[11px] text-outline font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 text-outline" />
                                <span>{r.userEmail}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-label bg-primary-container/10 text-primary border border-primary-container/20">
                              {r.category}
                            </span>
                            
                            {r.status === 'resolved' ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-label bg-green-500/10 text-green-500 border border-green-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolved</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase font-label bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-on-surface-variant font-body leading-relaxed mb-4 pl-1 border-l-2 border-outline-variant/20 italic">
                          "{r.text}"
                        </p>

                        <div className="flex items-center justify-between border-t border-outline-variant/5 pt-3">
                          <span className="text-[10px] text-outline font-mono">
                            Logged: {new Date(r.createdAt).toLocaleString()}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleReviewStatus(r.id, r.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                r.status === 'resolved'
                                  ? 'bg-surface border border-outline-variant/30 text-outline hover:border-outline-variant/60'
                                  : 'bg-primary text-on-primary hover:opacity-95 shadow-sm'
                              }`}
                            >
                              {r.status === 'resolved' ? 'Mark as Pending' : 'Mark as Resolved'}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteReview(r.id)}
                              className="px-2.5 py-1.5 bg-surface-container border border-outline-variant/15 text-outline hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/30 rounded-lg text-xs font-semibold transition-all"
                            >
                              Delete Doc
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-surface border border-outline-variant/10 rounded-2xl text-outline flex flex-col items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-outline mb-2" />
                      <div className="text-sm font-bold text-on-surface">No feedback logs match filter</div>
                      <p className="text-xs mt-1">Change the dropdown filters or try searching for another term.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View C: Announcement Broadcasting Dispatcher Tab */}
            {activeTab === 'broadcasting' && (
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div>
                  <h3 className="text-lg font-bold font-headline text-on-surface text-center">System Broadcast Dispatcher</h3>
                  <p className="text-xs text-outline font-body text-center mt-1">
                    Push live, system-wide alarms and maintenance announcements instantly.
                  </p>
                </div>

                {broadcastSuccess && (
                  <div className="bg-primary-container/20 text-on-primary-container p-4 rounded-xl flex items-center gap-2 text-sm border border-primary-container/30 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Communication broadcast deployed! All online participants have been alerted.</span>
                  </div>
                )}

                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/15 space-y-4">
                  <div>
                    <label className="text-xs text-outline font-label block mb-1.5">Announcement Topic Header</label>
                    <select
                      value={broadcastTopic}
                      onChange={(e) => setBroadcastTopic(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body text-on-surface"
                    >
                      <option>System Maintenance Notice</option>
                      <option>Daily Reflection Catalyst</option>
                      <option>Collective Circle Expansion</option>
                      <option>Official Community Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-outline font-label block mb-1.5">Dispatch Script Content ({broadcastText.length}/280)</label>
                    <textarea
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value.slice(0, 280))}
                      placeholder="e.g. A digital wellness update is incoming. Please take a mindful breath while we recalibrate state engines..."
                      rows={5}
                      className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body text-on-surface resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSendBroadcast}
                      disabled={!broadcastText.trim()}
                      className="w-full py-3 bg-primary text-on-primary hover:opacity-95 font-semibold text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider font-label flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Deploy Interactive Dispatch</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-low/40 border border-outline-variant/10 rounded-2xl p-4 flex gap-3 text-xs text-outline">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <p className="leading-relaxed">
                    Note: Dispatching system items simulates a telemetry burst targeted globally. Under GDPR constraints, alerts are transient unless explicitly committed as Community Circle Posts.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
