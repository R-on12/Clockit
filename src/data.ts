import { Conversation, VitalState, CommunityCircle, UserSettings, Reflection } from './types';

export const initialVitalState: VitalState = {
  sleep: { current: 7.2, target: 8, unit: 'h' },
  steps: { current: 6.4, target: 10, unit: 'k' },
  water: { current: 1.2, target: 2, unit: 'L' }
};

export const initialUserSettings: UserSettings = {
  name: 'Ronnie',
  membership: 'Premium Member',
  zenLevel: 12,
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg',
  notifications: 'Smart Alerts',
  themeMode: 'light',
  smartAlerts: true
};

export const initialConversations: Conversation[] = [
  {
    id: 'wellness_guide',
    name: 'Wellness Guide',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
    subLabel: 'Wellness Companion',
    isGroup: false,
    lastMessage: 'Ready to start your centering journey?',
    unreadCount: 0,
    timeLabel: 'Active',
    online: true,
    messages: [
      {
        id: 'w_init',
        senderId: 'wellness_guide',
        senderName: 'Wellness Guide',
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
        text: 'Welcome to Clockit, your digital sanctuary. Whenever you feel ready, take a deep breath and share your thoughts to begin alignment.',
        timestamp: 'Just Now',
        timeLabel: 'JUST NOW',
        isUser: false
      }
    ]
  }
];

export const initialCircles: CommunityCircle[] = [
  {
    id: 'seekers_circle',
    name: 'Clock Seekers',
    description: 'A quiet circle dedicated to breathing patterns, silent retreats, and organic mindfulness reflections.',
    avatar: '🌸',
    memberCount: 1420,
    tags: ['Mindfulness', 'Meditation', 'Quietude'],
    posts: [
      {
        id: 'p1',
        authorName: 'Leo Vance',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
        content: 'I spent an hour in the new meditation forest today. The natural light filtering through the birch canopy creates the most sublime shadows. If you are struggling with sensory overload, I highly suggest sitting there without any device for 15 minutes.',
        timeLabel: '2 Hours Ago',
        likes: 18,
        hasLiked: false,
        comments: [
          {
            id: 'c1',
            authorName: 'Aria Greenfield',
            content: 'It truly is magnificent! The air humidity there is incredibly refreshing.',
            timeLabel: '1 Hour Ago'
          }
        ]
      }
    ]
  },
  {
    id: 'breathing_nature',
    name: 'Breath of the Hearth',
    description: 'Exploring cold exposure therapy, natural hot springs alignment, and deep diaphragmatic breathing.',
    avatar: '🌬️',
    memberCount: 840,
    tags: ['Nataraja', 'Hatha', 'WimHof'],
    posts: [
      {
        id: 'p2',
        authorName: 'Marcus Thorne',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
        content: 'Completed credit-hours of Hatha centering this afternoon. The pulse rates stabilized far faster after my morning alignment. What was everyone’s recovery focus today?',
        timeLabel: 'Yesterday',
        likes: 32,
        hasLiked: true,
        comments: []
      }
    ]
  }
];

export const initialReflections: Reflection[] = [
  {
    id: 'r1',
    date: '2026-05-20',
    prompt: '"Quiet the mind and the soul will speak." Where did your soul wander today during silent pause?',
    response: 'Wandered back to childhood summers by the stream. Realized I need more of that unstructured, completely silent natural play in my weekly schedule.'
  }
];
export const dailyPrompts = [
  '"In the midst of movement and chaos, keep stillness inside of you." What is one area of your life where you\'d like to invite more stillness today?',
  '"Deep breathing is our love letter to our body." Reflect on three slow breaths you took today and describe their impact on your heart.',
  '"Quiet is not the absence of sound, but the presence of perspective." Where did you find your quiet focal point today?'
];
