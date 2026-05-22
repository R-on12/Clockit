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
    lastMessage: 'How was your morning meditation session?',
    unreadCount: 1,
    timeLabel: '2M AGO',
    online: true,
    messages: [
      {
        id: 'w1',
        senderId: 'wellness_guide',
        senderName: 'Wellness Guide',
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
        text: 'Welcome to Clockit! Ready to starting alignment?',
        timestamp: 'Yesterday, 8:00 AM',
        timeLabel: '08:00 AM',
        isUser: false
      },
      {
        id: 'w2',
        senderId: 'wellness_guide',
        senderName: 'Wellness Guide',
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
        text: 'How was your morning meditation session?',
        timestamp: 'Today, 2:51 PM',
        timeLabel: '02:51 PM',
        isUser: false
      }
    ]
  },
  {
    id: 'julian_m',
    name: 'Julian M.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtbc2t1r8Vs-ObpR8Uu7wZ9i6qL3Hp24MzcsHBVLd8W5xSn7KKoiC2c58Wx337GU1RweBeACbHt-eyZKbVTL70rPKnaeenqQ-tyV-ySd2KPKWD_XbQgO7UW8p8tYu3c8Sj88Gnoh1SJ3dVxp2HIvizMkSeJSphq-1M1bTUcegVn8XagrGMRJYTZmnBm3z-yJ4-yanb__8KRmu9Q1OuBi6erzS8qEoGGEAGk8LkESw5PPuvNxMxpt27m4deez2zBzU3pQFzjmI9JPzb',
    subLabel: 'Wellness Guide • Online',
    isGroup: false,
    lastMessage: 'Good morning. I noticed your sleep cycle was particularly restorative...',
    unreadCount: 0,
    timeLabel: 'JUST NOW',
    online: true,
    messages: [
      {
        id: 'jm1',
        senderId: 'julian_m',
        senderName: 'Julian M.',
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtbc2t1r8Vs-ObpR8Uu7wZ9i6qL3Hp24MzcsHBVLd8W5xSn7KKoiC2c58Wx337GU1RweBeACbHt-eyZKbVTL70rPKnaeenqQ-tyV-ySd2KPKWD_XbQgO7UW8p8tYu3c8Sj88Gnoh1SJ3dVxp2HIvizMkSeJSphq-1M1bTUcegVn8XagrGMRJYTZmnBm3z-yJ4-yanb__8KRmu9Q1OuBi6erzS8qEoGGEAGk8LkESw5PPuvNxMxpt27m4deez2zBzU3pQFzjmI9JPzb',
        text: 'Good morning. I noticed your sleep cycle was particularly restorative last night. How are you feeling today?',
        timestamp: 'Today, 09:12 AM',
        timeLabel: '09:12 AM',
        isUser: false
      },
      {
        id: 'jm2',
        senderId: 'user',
        senderName: 'Ronnie',
        text: 'I feel much more centered than yesterday. The meditation we discussed really helped me settle my thoughts before bed.',
        timestamp: 'Today, 09:15 AM',
        timeLabel: '09:15 AM',
        isUser: true
      },
      {
        id: 'jm3',
        senderId: 'julian_m',
        senderName: 'Julian M.',
        senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtbc2t1r8Vs-ObpR8Uu7wZ9i6qL3Hp24MzcsHBVLd8W5xSn7KKoiC2c58Wx337GU1RweBeACbHt-eyZKbVTL70rPKnaeenqQ-tyV-ySd2KPKWD_XbQgO7UW8p8tYu3c8Sj88Gnoh1SJ3dVxp2HIvizMkSeJSphq-1M1bTUcegVn8XagrGMRJYTZmnBm3z-yJ4-yanb__8KRmu9Q1OuBi6erzS8qEoGGEAGk8LkESw5PPuvNxMxpt27m4deez2zBzU3pQFzjmI9JPzb',
        text: "That's wonderful to hear. I've shared a reflection prompt above. Take your time with it—there's no rush in this space.",
        timestamp: 'Today, 09:20 AM',
        timeLabel: '09:20 AM',
        isUser: false
      }
    ]
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
    lastMessage: 'The new meditation forest is beautiful...',
    lastMessageSender: 'Leo',
    unreadCount: 3,
    timeLabel: '1H AGO',
    messages: [
      {
        id: 'zs1',
        senderId: 'l1',
        senderName: 'Leo',
        text: 'The new meditation forest is beautiful...',
        timestamp: 'Today, 1:40 PM',
        timeLabel: '01:40 PM',
        isUser: false
      }
    ]
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
    lastMessage: 'The new sunrise yoga routine is incredible!',
    lastMessageSender: 'Aria',
    unreadCount: 0,
    timeLabel: '12:45 PM',
    messages: [
      {
        id: 'zc1',
        senderId: 'a1',
        senderName: 'Aria',
        text: 'The new sunrise yoga routine is incredible!',
        timestamp: 'Today, 12:45 PM',
        timeLabel: '12:45 PM',
        isUser: false
      }
    ]
  },
  {
    id: 'marcus_thorne',
    name: 'Marcus Thorne',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
    isGroup: false,
    lastMessage: "Let's catch up at the spa tomorrow.",
    unreadCount: 0,
    timeLabel: 'TUE',
    online: false,
    messages: [
      {
        id: 'mt1',
        senderId: 'marcus_thorne',
        senderName: 'Marcus Thorne',
        text: "Let's catch up at the spa tomorrow.",
        timestamp: 'Tuesday, 4:00 PM',
        timeLabel: '04:00 PM',
        isUser: false
      }
    ]
  },
  {
    id: 'elara_vance',
    name: 'Elara Vance',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt5COrm3yJBOlxp3uC_RUAkXq8LgGDDV6twy0qw0JJ2Y8vSerHSX-mGZ7AlaA5MBPN6j8Dbdk5pzSZ4er2695M_lHBysZlZ1KsQDF_gGx9LnZwqjVE8tqINb91TnS1J51sYF6YUpspDl8OQukpTvL7YtRGk3En8kC2VYxmGYG0-mHiuaCfqM-apeSsHXg5N8TdLeSc9DuNpQwynXYccrTHUKeJMEOIKvt_r91SIbNzZbUYnpgPtqi84P6nJYMD_rXhOOd2kF-9Boug',
    isGroup: false,
    lastMessage: 'Sent a photo',
    unreadCount: 0,
    timeLabel: 'MON',
    online: false,
    messages: [
      {
        id: 'ev1',
        senderId: 'elara_vance',
        senderName: 'Elara Vance',
        text: 'Sent a photo',
        timestamp: 'Monday, 11:30 AM',
        timeLabel: '11:30 AM',
        isUser: false,
        isItalic: true
      }
    ]
  },
  {
    id: 'julian_lowe',
    name: 'Julian Lowe',
    avatar: '', // JL abbreviation card
    isGroup: false,
    lastMessage: 'Thanks for the recommendation!',
    unreadCount: 0,
    timeLabel: 'AUG 12',
    online: false,
    messages: [
      {
        id: 'jl1',
        senderId: 'julian_lowe',
        senderName: 'Julian Lowe',
        text: 'Thanks for the recommendation!',
        timestamp: 'Aug 12, 10:15 AM',
        timeLabel: '10:15 AM',
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
