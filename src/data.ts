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
    subLabel: 'Wellness Practitioner',
    isGroup: false,
    lastMessage: '',
    unreadCount: 0,
    timeLabel: '',
    online: true,
    messages: []
  },
  {
    id: 'julian_m',
    name: 'Julian M.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtbc2t1r8Vs-ObpR8Uu7wZ9i6qL3Hp24MzcsHBVLd8W5xSn7KKoiC2c58Wx337GU1RweBeACbHt-eyZKbVTL70rPKnaeenqQ-tyV-ySd2KPKWD_XbQgO7UW8p8tYu3c8Sj88Gnoh1SJ3dVxp2HIvizMkSeJSphq-1M1bTUcegVn8XagrGMRJYTZmnBm3z-yJ4-yanb__8KRmu9Q1OuBi6erzS8qEoGGEAGk8LkESw5PPuvNxMxpt27m4deez2zBzU3pQFzjmI9JPzb',
    subLabel: 'Wellness Guide • Online',
    isGroup: false,
    lastMessage: '',
    unreadCount: 0,
    timeLabel: '',
    online: true,
    messages: []
  },
  {
    id: 'zen_seekers',
    name: 'Clock Seekers Circle',
    avatar: '',
    isGroup: true,
    groupAvatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADDHRtSyCcVR7LVA85peEf_Y3zaB8xa7uVlF6wUhh_8RZYL9-COUl5KEwfKAlGESqDnyW3FqIeHB_pQmIerHV1EqfqZCuG0-x1SOG3r0i81xTGQgoaqY5lzjyVYvZ0HfVH7h67HpHg1uIdiEoj13KqOAu5fSHkL_rWMI34y1g-7k9jFykEWv6YUp3gNJoMWVSWCDLZfCD2REViVx8xBu2YXgS9NoiC1vxzF7fuZBtOBUa2yiwYWLvTQu_pVd9DRt89GM2I8y5lQPbT',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3BYb15TBwlFwzTJqN6o9BmNk46seaAI2VPGc9R8_NNdTlrqXFS5Kllqo2FtkTBBJONmzDZvQ0XNTPYA7B0GNyDS4Dhe36d3jxcvAe1Hz-BXzsaX5bThsQGSeF59uXukB6Lgm4Tc8g9dturJl5S-wIW6R_n5aIfXuuCM8z22RCE_ovvi2T-xVcxwsEmJeCbxOM-oeaNmvafnZ7_mKF33L791Htiwwv7a45M6xoqRTp9hSPDDrMsUqgVzztKKhRnJ-xvii4Mc-jDNPa'
    ],
    lastMessage: '',
    lastMessageSender: '',
    unreadCount: 0,
    timeLabel: '',
    messages: []
  },
  {
    id: 'zenith_community',
    name: 'Clockit Community',
    avatar: '',
    isGroup: true,
    groupAvatars: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADDHRtSyCcVR7LVA85peEf_Y3zaB8xa7uVlF6wUhh_8RZYL9-COUl5KEwfKAlGESqDnyW3FqIeHB_pQmIerHV1EqfqZCuG0-x1SOG3r0i81xTGQgoaqY5lzjyVYvZ0HfVH7h67HpHg1uIdiEoj13KqOAu5fSHkL_rWMI34y1g-7k9jFykEWv6YUp3gNJoMWVSWCDLZfCD2REViVx8xBu2YXgS9NoiC1vxzF7fuZBtOBUa2yiwYWLvTQu_pVd9DRt89GM2I8y5lQPbT',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3BYb15TBwlFwzTJqN6o9BmNk46seaAI2VPGc9R8_NNdTlrqXFS5Kllqo2FtkTBBJONmzDZvQ0XNTPYA7B0GNyDS4Dhe36d3jxcvAe1Hz-BXzsaX5bThsQGSeF59uXukB6Lgm4Tc8g9dturJl5S-wIW6R_n5aIfXuuCM8z22RCE_ovvi2T-xVcxwsEmJeCbxOM-oeaNmvafnZ7_mKF33L791Htiwwv7a45M6xoqRTp9hSPDDrMsUqgVzztKKhRnJ-xvii4Mc-jDNPa'
    ],
    lastMessage: '',
    lastMessageSender: '',
    unreadCount: 0,
    timeLabel: '',
    messages: []
  },
  {
    id: 'marcus_thorne',
    name: 'Marcus Thorne',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
    isGroup: false,
    lastMessage: '',
    unreadCount: 0,
    timeLabel: '',
    online: false,
    messages: []
  },
  {
    id: 'elara_vance',
    name: 'Elara Vance',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt5COrm3yJBOlxp3uC_RUAkXq8LgGDDV6twy0qw0JJ2Y8vSerHSX-mGZ7AlaA5MBPN6j8Dbdk5pzSZ4er2695M_lHBysZlZ1KsQDF_gGx9LnZwqjVE8tqINb91TnS1J51sYF6YUpspDl8OQukpTvL7YtRGk3En8kC2VYxmGYG0-mHiuaCfqM-apeSsHXg5N8TdLeSc9DuNpQwynXYccrTHUKeJMEOIKvt_r91SIbNzZbUYnpgPtqi84P6nJYMD_rXhOOd2kF-9Boug',
    isGroup: false,
    lastMessage: '',
    unreadCount: 0,
    timeLabel: '',
    online: false,
    messages: []
  },
  {
    id: 'julian_lowe',
    name: 'Julian Lowe',
    avatar: '',
    isGroup: false,
    lastMessage: '',
    unreadCount: 0,
    timeLabel: '',
    online: false,
    messages: []
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
    posts: []
  },
  {
    id: 'breathing_nature',
    name: 'Breath of the Hearth',
    description: 'Exploring cold exposure therapy, natural hot springs alignment, and deep diaphragmatic breathing.',
    avatar: '🌬️',
    memberCount: 840,
    tags: ['Nataraja', 'Hatha', 'WimHof'],
    posts: []
  }
];

export const initialReflections: Reflection[] = [];
export const dailyPrompts = [
  '"In the midst of movement and chaos, keep stillness inside of you." What is one area of your life where you\'d like to invite more stillness today?',
  '"Deep breathing is our love letter to our body." Reflect on three slow breaths you took today and describe their impact on your heart.',
  '"Quiet is not the absence of sound, but the presence of perspective." Where did you find your quiet focal point today?'
];
