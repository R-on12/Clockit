export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  timeLabel: string;
  isUser: boolean;
  isItalic?: boolean;
  attachment?: {
    type: 'photo' | 'gif' | 'document';
    url: string;
    name?: string;
    size?: string;
  };
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  subLabel?: string;
  isGroup: boolean;
  groupAvatars?: string[];
  lastMessage: string;
  lastMessageSender?: string;
  unreadCount: number;
  timeLabel: string;
  online?: boolean;
  messages: Message[];
}

export interface VitalState {
  sleep: { current: number; target: number; unit: string };
  steps: { current: number; target: number; unit: string };
  water: { current: number; target: number; unit: string };
}

export interface Reflection {
  id: string;
  date: string;
  prompt: string;
  response: string;
}

export interface CommunityCircle {
  id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  tags: string[];
  posts: CommunityPost[];
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timeLabel: string;
  likes: number;
  hasLiked?: boolean;
  comments: Comment[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  timeLabel: string;
}

export interface UserSettings {
  name: string;
  membership: string;
  clockLevel: number;
  avatar: string;
  notifications: string; // 'Smart Alerts', 'Off', 'All'
  themeMode: 'light' | 'dark' | 'sepia' | 'ocean' | 'forest' | 'cosmic' | 'cyberlime' | 'sunset' | 'aurora';
  smartAlerts: boolean;
}
