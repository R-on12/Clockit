import React, { useState } from 'react';
import { Heart, MessageSquare, Plus, Share2, Tag, Calendar, UserPlus } from 'lucide-react';
import { CommunityCircle, CommunityPost } from '../types';

interface CirclesViewProps {
  circles: CommunityCircle[];
  onAddPost: (circleId: string, content: string) => void;
  onLikePost: (circleId: string, postId: string) => void;
  onAddComment: (circleId: string, postId: string, commentContent: string) => void;
  userAvatar: string;
}

export const CirclesView: React.FC<CirclesViewProps> = ({
  circles,
  onAddPost,
  onLikePost,
  onAddComment,
  userAvatar
}) => {
  const [activeCircleId, setActiveCircleId] = useState(circles[0]?.id || '');
  const [newPostText, setNewPostText] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [joinedCircles, setJoinedCircles] = useState<string[]>(['seekers_circle']);

  const activeCircle = circles.find(c => c.id === activeCircleId);

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

  return (
    <div className="space-y-8 py-6 animate-fade-in" id="circles-parent-view">
      {/* Hero Community Header */}
      <section className="mb-4">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight leading-tight">
          Community Circles
        </h1>
        <p className="mt-2 text-on-surface-variant font-body text-sm leading-relaxed tracking-wide">
          Enter shared sanctuaries. Reflect, engage, and grow as one of Clockit.
        </p>
      </section>

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
    </div>
  );
};
