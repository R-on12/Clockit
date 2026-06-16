import React, { useState } from 'react';
import { Search, CheckCheck, Edit } from 'lucide-react';
import { Conversation } from '../types';

interface MessagesViewProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onStartNewChat?: () => void;
  registeredUsers?: any[];
  onStartDirectChat?: (id: string, name: string, avatar: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  onSelectConversation,
  onStartNewChat,
  registeredUsers = [],
  onStartDirectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Separating Featured/Pinned and Recent
  const featuredIds = ['wellness_guide', 'clock_seekers', 'clock_community'];
  
  const filteredConversations = conversations.filter(c =>
    c.id !== 'wellness_guide' && (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const featuredConversations = filteredConversations.filter(c => featuredIds.includes(c.id));
  const recentConversations = filteredConversations.filter(c => !featuredIds.includes(c.id));

  return (
    <div className="space-y-10 py-6 animate-fade-in" id="messages-list-view">
      {/* Search Header */}
      <section className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight leading-tight mb-6">
          Messages
        </h1>
        <div className="relative group/search">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within/search:text-primary transition-colors">
            <Search className="w-5 h-5" id="search-icon-messages" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary-fixed transition-all placeholder:text-outline/60 font-body text-sm outline-none"
            placeholder="Find a contact..."
            id="messages-search-input"
          />
        </div>
      </section>

      {/* Registered Directory Quick Connect */}
      {registeredUsers && registeredUsers.length > 0 && (
        <section className="mb-6 -mt-4 bg-surface-container-low/20 p-4 rounded-3xl border border-outline-variant/10" id="quick-connect-registered-members">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-headline text-xs font-bold text-primary uppercase tracking-wider">Quick Connect Directory</span>
            <button 
              onClick={onStartNewChat} 
              className="text-primary text-xs font-semibold hover:underline bg-primary/5 px-2.5 py-1 rounded-full text-[11px]"
              id="view-all-registered-members-link"
            >
              Search ({registeredUsers.length})
            </button>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
            {/* Quick search/add entry button */}
            <button
              onClick={onStartNewChat}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              id="quick-start-chat-button"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-primary/40 group-hover:border-primary group-hover:bg-primary/5 flex items-center justify-center transition-all bg-surface-container-low">
                <span className="text-xl text-primary group-hover:scale-110 transition-transform font-bold">+</span>
              </div>
              <span className="text-[11px] font-medium text-outline truncate w-14 text-center group-hover:text-primary transition-colors">
                Search
              </span>
            </button>

            {/* List users */}
            {registeredUsers.map((user) => (
              <button
                key={user.uid}
                onClick={() => onStartDirectChat?.(user.uid, user.name, user.avatar)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none cursor-pointer"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-outline-variant/10 shadow-sm group-hover:scale-105 group-hover:border-primary group-focus:border-primary transition-all"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm group-hover:scale-105 group-hover:border-primary group-focus:border-primary transition-all">
                      {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
                </div>
                <span className="text-[11px] font-medium text-on-surface truncate w-14 text-center group-hover:text-primary transition-colors">
                  {user.isSelf ? 'You' : user.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured list */}
      {featuredConversations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-bold text-primary px-1">Featured</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {featuredConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectConversation(chat.id)}
                className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-5 flex items-center gap-4 transition-all hover:bg-surface-container cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
                id={`featured-chat-${chat.id}`}
              >
                <div className="relative flex-shrink-0">
                  {chat.isGroup ? (
                    <div className="relative w-14 h-14">
                      {chat.groupAvatars && chat.groupAvatars[0] && (
                        <div className="absolute top-0 right-0 w-9 h-9 rounded-full border-2 border-surface-container-low overflow-hidden z-10 shadow-sm">
                          <img
                            alt="Group member"
                            className="w-full h-full object-cover"
                            src={chat.groupAvatars[0]}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {chat.groupAvatars && chat.groupAvatars[1] && (
                        <div className="absolute bottom-0 left-0 w-9 h-9 rounded-full border-2 border-surface-container-low overflow-hidden shadow-sm">
                          <img
                            alt="Group member"
                            className="w-full h-full object-cover"
                            src={chat.groupAvatars[1]}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container/20">
                      <img
                        alt={chat.name}
                        className="w-full h-full object-cover"
                        src={chat.avatar}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {chat.online && !chat.isGroup && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface-container-low group-hover:border-surface-container transition-all"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-headline font-bold text-on-surface truncate pr-2">
                      {chat.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-outline">
                      {chat.timeLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-on-surface-variant truncate">
                    {chat.lastMessageSender && (
                      <span className="font-semibold text-secondary mr-1">
                        {chat.lastMessageSender}:
                      </span>
                    )}
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent list */}
      <section className="mb-10 pb-8">
        <h2 className="font-headline text-lg font-bold text-primary mb-4 px-1">Recent</h2>
        {recentConversations.length > 0 ? (
          <div className="space-y-1">
            {recentConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectConversation(chat.id)}
                className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-surface-container-low cursor-pointer"
                id={`recent-chat-${chat.id}`}
              >
                <div className="relative flex-shrink-0">
                  {chat.avatar ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        alt={chat.name}
                        className="w-full h-full object-cover"
                        src={chat.avatar}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-semibold text-sm">
                      {chat.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-on-surface">{chat.name}</span>
                    <span className="text-[10px] uppercase tracking-widest text-outline">
                      {chat.timeLabel}
                    </span>
                  </div>
                  <p className={`text-sm text-on-surface-variant truncate ${chat.messages[chat.messages.length - 1]?.isItalic ? 'italic' : ''}`}>
                    {chat.lastMessage}
                  </p>
                </div>

                {/* ticks for sent messages */}
                {chat.unreadCount === 0 && chat.id !== 'julian_lowe' && (
                  <CheckCheck className="text-primary w-4 h-4 ml-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-outline">No conversations found</div>
        )}
      </section>

      {/* FAB Floating Action Button to initiate new chats */}
      <button 
        onClick={onStartNewChat}
        className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl md:rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
        id="new-chat-fab"
      >
        <Edit className="w-5 h-5" />
      </button>
    </div>
  );
};
