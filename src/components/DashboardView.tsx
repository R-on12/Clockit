import React from 'react';
import { Moon, Footprints, Droplet, MessageSquare, Users, Star } from 'lucide-react';
import { Conversation, VitalState, UserSettings } from '../types';

interface DashboardViewProps {
  vitalState: VitalState;
  conversations: Conversation[];
  userSettings: UserSettings;
  onNavigate: (tab: string, arg?: string) => void;
  onIncrementState: (metric: 'sleep' | 'steps' | 'water') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vitalState,
  conversations,
  userSettings,
  onNavigate,
  onIncrementState,
}) => {
  // Recent conversations to display (Wellness Guide and Clock Seekers)
  const recentChats = conversations.filter(c => c.id === 'wellness_guide' || c.id === 'zen_seekers');

  const getMetricProgress = (current: number, target: number) => {
    const ratio = current / target;
    return Math.min(Math.max(ratio, 0), 1);
  };

  const getCirclePath = (ratio: number) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ratio * circumference;
    return { circumference, strokeDashoffset };
  };

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

  return (
    <div className="space-y-10 py-6 animate-fade-in" id="dashboard-view">
      {/* Hero Welcome */}
      <section className="mb-8">
        <h1 className="text-5xl font-headline font-light text-primary tracking-tight leading-tight">
          {getGreeting()},<br />{userSettings.name}
        </h1>
        <p className="mt-4 text-on-surface-variant font-body tracking-wide">
          Your community is waiting for you.
        </p>
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
                onClick={() => onNavigate(chat.id === 'wellness_guide' ? 'chat_wellness' : 'messages')}
                className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all cursor-pointer hover:scale-[0.99] active:scale-[0.98]"
                id={`chat-item-${chat.id}`}
              >
                {/* Avatar Icon */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                  chat.id === 'wellness_guide' ? 'bg-primary-container/20' : 'bg-secondary-container/30'
                }`}>
                  {chat.id === 'wellness_guide' ? (
                    <span className="text-primary text-xl">🧠</span>
                  ) : (
                    <Users className="text-secondary w-6 h-6" />
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

      {/* Daily Vitality Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-outline">Daily Vitality</h2>
          <span className="text-[10px] text-outline/80">Tap icons to log progress</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Sleep */}
          <div 
            onClick={() => onIncrementState('sleep')}
            className="group bg-surface-container-low/50 hover:bg-surface-container/60 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-outline-variant/20 transition-all cursor-pointer"
            id="vitality-sleep-card"
          >
            <div className="relative w-12 h-12 mb-2">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                <circle 
                  className="text-primary transition-all duration-300" 
                  cx="24" 
                  cy="24" 
                  fill="transparent" 
                  r="20" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeDasharray={2 * Math.PI * 20} 
                  strokeDashoffset={(2 * Math.PI * 20) * (1 - getMetricProgress(vitalState.sleep.current, vitalState.sleep.target))}
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-label text-outline uppercase tracking-wider">Sleep</span>
            <span className="text-sm font-headline text-on-surface font-medium mt-0.5">{vitalState.sleep.current}{vitalState.sleep.unit}</span>
          </div>

          {/* Steps */}
          <div 
            onClick={() => onIncrementState('steps')}
            className="group bg-surface-container-low/50 hover:bg-surface-container/60 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-outline-variant/20 transition-all cursor-pointer"
            id="vitality-steps-card"
          >
            <div className="relative w-12 h-12 mb-2">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                <circle 
                  className="text-primary transition-all duration-300" 
                  cx="24" 
                  cy="24" 
                  fill="transparent" 
                  r="20" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeDasharray={2 * Math.PI * 20} 
                  strokeDashoffset={(2 * Math.PI * 20) * (1 - getMetricProgress(vitalState.steps.current, vitalState.steps.target))}
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Footprints className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-label text-outline uppercase tracking-wider">Steps</span>
            <span className="text-sm font-headline text-on-surface font-medium mt-0.5">{vitalState.steps.current}{vitalState.steps.unit}</span>
          </div>

          {/* Water */}
          <div 
            onClick={() => onIncrementState('water')}
            className="group bg-surface-container-low/50 hover:bg-surface-container/60 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center border border-outline-variant/20 transition-all cursor-pointer"
            id="vitality-water-card"
          >
            <div className="relative w-12 h-12 mb-2">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="3"></circle>
                <circle 
                  className="text-primary transition-all duration-300" 
                  cx="24" 
                  cy="24" 
                  fill="transparent" 
                  r="20" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeDasharray={2 * Math.PI * 20} 
                  strokeDashoffset={(2 * Math.PI * 20) * (1 - getMetricProgress(vitalState.water.current, vitalState.water.target))}
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] font-label text-outline uppercase tracking-wider">Water</span>
            <span className="text-sm font-headline text-on-surface font-medium mt-0.5">{vitalState.water.current}{vitalState.water.unit}</span>
          </div>
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
    </div>
  );
};
