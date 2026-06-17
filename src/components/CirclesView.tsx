import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageSquare, Plus, Share2, Tag, Calendar, UserPlus, Search, 
  Star, Compass, MapPin, Sparkles, MessageCircle, AlertCircle, Play, 
  Pause, Bookmark, Flame, ListFilter, TrendingUp, Image as ImageIcon,
  Video, Smile, Send, Globe, ChevronLeft, ChevronRight, CheckCircle2,
  MoreHorizontal, Users, Grid, Sparkle, Film, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityCircle, CommunityPost } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface CirclesViewProps {
  circles: CommunityCircle[];
  onAddPost: (circleId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'none') => void;
  onLikePost: (circleId: string, postId: string) => void;
  onAddComment: (circleId: string, postId: string, commentContent: string) => void;
  userAvatar: string;
  onStartDirectChat?: (userId: string, userName: string, userAvatar: string) => void;
}

// Dynamic stories moments data (Instagram style)
interface StoryMoment {
  id: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  quote: string;
  viewed: boolean;
  topic: string;
  type?: 'image' | 'video';
}

// Trending topics data (X style)
interface TrendTopic {
  id: string;
  hashtag: string;
  postsCount: string;
  description: string;
  category: string;
}

// Dynamic media templates the user can attach to simulated posts
const POST_MEDIA_TEMPLATES = [
  {
    id: 'forest_med',
    title: 'Meditation Canopy',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    type: 'image' as const
  },
  {
    id: 'bamboo_rain',
    title: 'Peaceful Bamboo',
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    type: 'image' as const
  },
  {
    id: 'tea_clock',
    title: 'Bonsai Tea Room',
    url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80',
    type: 'image' as const
  },
  {
    id: 'sunset_peaks',
    title: 'Sunset Peaks',
    url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80',
    type: 'image' as const
  },
  {
    id: 'waterfall_flow',
    title: 'Cascading Brook',
    url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80',
    type: 'video' as const // Marked as video to display simulated player controls!
  },
  {
    id: 'cosmic_sky',
    title: 'Ambient Cosmos',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80',
    type: 'video' as const // Marked as video to display simulated player controls!
  }
];

export const CirclesView: React.FC<CirclesViewProps> = ({
  circles,
  onAddPost,
  onLikePost,
  onAddComment,
  userAvatar,
  onStartDirectChat
}) => {
  // Feed layout tabs: 'explore' (Twitter feed), 'showcase' (Instagram grid), 'members' (locator registry)
  const [activeFeedTab, setActiveFeedTab] = useState<'explore' | 'showcase' | 'members'>('explore');
  const [activeCircleId, setActiveCircleId] = useState(circles[0]?.id || 'seekers_circle');
  
  // Custom Filters / Hashtags
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState<string | null>(null);
  
  // Create post states
  const [newPostText, setNewPostText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<typeof POST_MEDIA_TEMPLATES[0] | null>(null);
  const [showMediaAttachmentDrawer, setShowMediaAttachmentDrawer] = useState(false);
  
  // Comments input mapped by post id
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  
  // Track which posts have their comment panel open
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});

  // Device & OneDrive upload integration states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deviceImageFile, setDeviceImageFile] = useState<File | null>(null);
  const [deviceImagePreview, setDeviceImagePreview] = useState<string | null>(null);

  // Permissive Story & Moment Creator states
  const [showMomentCreator, setShowMomentCreator] = useState(false);
  const [momentCaption, setMomentCaption] = useState('');
  const [momentPreview, setMomentPreview] = useState<string | null>(null);
  const [momentFile, setMomentFile] = useState<File | null>(null);
  const [isPublishingMoment, setIsPublishingMoment] = useState(false);
  const [momentPublishProgress, setMomentPublishProgress] = useState(0);
  const momentFileInputRef = useRef<HTMLInputElement>(null);
  
  // OneDrive simulated cloud storage states
  const [showOneDriveModal, setShowOneDriveModal] = useState(false);
  const [isOneDriveConnected, setIsOneDriveConnected] = useState(false);
  const [isOneDriveSyncing, setIsOneDriveSyncing] = useState(false);
  const [oneDriveUploadProgress, setOneDriveUploadProgress] = useState(0);
  const [oneDriveToast, setOneDriveToast] = useState<string | null>(null);
  
  // Custom OneDrive mock files for selection
  const [oneDriveFiles, setOneDriveFiles] = useState<Array<{ id: string; name: string; url: string; size: string; type: 'image' | 'video' }>>([
    { id: 'od_f1', name: 'Ambient Forest Dawn.jpg', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80', size: '2.4 MB', type: 'image' },
    { id: 'od_f2', name: 'Wind Chimes Meditation.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-wind-chimes-hanging-from-a-tree-in-the-wind-41662-large.mp4', size: '12.8 MB', type: 'video' },
    { id: 'od_f3', name: 'Quiet Sea Solitude.png', url: 'https://images.unsplash.com/photo-150752428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', size: '3.1 MB', type: 'image' },
    { id: 'od_v1', name: 'Deep Valley Mist Flow.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-foggy-pine-tree-forest-4112-large.mp4', size: '18.4 MB', type: 'video' }
  ]);
  
  // Bookmarked posts list
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(['p2']);
  
  // Real web news states loaded from full-stack server
  const [newsTab, setNewsTab] = useState<'internal' | 'live'>('live');
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNewsDetail, setSelectedNewsDetail] = useState<any | null>(null);
  
  // Re-pinched (Reposted) posts list
  const [repinchedIds, setRepinchedIds] = useState<string[]>([]);

  // Simulation play state for videos
  const [playingVideoPostId, setPlayingVideoPostId] = useState<string | null>(null);
  const [videoPlaybackProgress, setVideoPlaybackProgress] = useState<{ [postId: string]: number }>({});

  // Active Story moments preview state (Instagram-style Stories)
  const [stories, setStories] = useState<StoryMoment[]>([
    {
      id: 's1',
      userName: 'Aria Greenfield',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg',
      mediaUrl: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80',
      quote: 'Nature doesn’t hurry, yet everything is accomplished.',
      viewed: false,
      topic: 'Tea Whispers'
    },
    {
      id: 's2',
      userName: 'Marcus Thorne',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
      mediaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      quote: 'The present moment is filled with joy. If you are attentive, you will see it.',
      viewed: false,
      topic: 'Forest Canopy'
    },
    {
      id: 's3',
      userName: 'Leo Vance',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvSpMok5jI4RgugUel-JbT0e5Mb8NKiMxtsH8y_6ryHi8H9BOazZ4th7_ISoshw2LEa1xN7dLtN6Z0SBYtioeMd5VDWwvUQ5i1y9Np2h-6WNzzdUpnCv6Ry_zRh7rBqkd6mVbtxjuDaizYEa_jPZmImNHyWLO3b426biCNj9hGPif5NRzP7nQl9-jTlCa1kHiirdTuMpwIX-1tVDDTe9dNvhOHkvbtF7JwaHciShXmDHG4gjyEPcF0hxeKZHa1HBzXHhs4Ax9P2aJg',
      mediaUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80',
      quote: 'Quiet minds yield peaceful reflections.',
      viewed: true,
      topic: 'Cyber Solstice'
    },
    {
      id: 's4',
      userName: 'Dr. Evelyn Moss',
      userAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE54NSPHbX_rB2bvgKiljuvd5-JlEpnq-PUTJroJhuoDHf8xcICcz1SdKGAXQTPgd9Lnf_1RQ2gK2uGfCED5UyyvSaHTvRE5Tz7QlNVB2bwiWB7kMRx-wa1malx4rt3pw8wlFV29vnBaAjSHXeef8ImZjwK3zi6McOGsVOQfVV6TcJlBsCQeAZcMtfwmzbjPQi8z6lxFlk80nkQMGfINcD8OkpUc_O9sqIAmBZPmOFzanAnArGrcRF8NtpqJneZWDZJSb8xU980Xue',
      mediaUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
      quote: 'Look deep into nature, and then you will understand everything better.',
      viewed: false,
      topic: 'Ancient Canopy'
    }
  ]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  // Trending Topics of Clockit (X style)
  const trendingTopics: TrendTopic[] = [
    { id: 't1', hashtag: '#ClockChallenge', postsCount: '4.8K', description: 'Mindful seekers practice 20-min daily pine silence.', category: 'Global Movement' },
    { id: 't2', hashtag: '#PinchToPause', postsCount: '3.2K', description: 'Capturing moments of slow breathing in hectic periods.', category: 'Trending in Tech' },
    { id: 't3', hashtag: '#SlowTrend', postsCount: '1.9K', description: 'Advocates sharing peaceful high-definition analog garden shots.', category: 'Lifestyle' },
    { id: 't4', hashtag: '#MuteTheNoise', postsCount: '942', description: 'Turning off all alerts and reporting sensory clarity.', category: 'Health & Soul' }
  ];

  // Members sync lists
  const [usersList, setUsersList] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  const activeCircle = circles.find(c => c.id === activeCircleId) || circles[0];

  // Hook to fetch live trending news from backend (Express / Gemini Search Grounding)
  useEffect(() => {
    let active = true;
    const fetchTrendingNews = async () => {
      setLoadingNews(true);
      setNewsError(null);
      try {
        const response = await fetch('/api/news/trending');
        if (!response.ok) {
          throw new Error('Cloud reception dimmed. Could not retrieve news grid.');
        }
        const data = await response.json();
        if (active) {
          if (data && Array.isArray(data.news)) {
            setLiveNews(data.news || []);
          } else {
            setNewsError('Invalid cloud feed format.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching live news feed:', err);
        if (active) {
          setNewsError(err.message || 'Error collecting web updates.');
        }
      } finally {
        if (active) {
          setLoadingNews(false);
        }
      }
    };

    fetchTrendingNews();
    return () => {
      active = false;
    };
  }, []);

  // Hook to fetch and synchronize all platform members from Firestore in real-time
  useEffect(() => {
    if (activeFeedTab === 'members') {
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
          // Sort by Clock Level descending
          fetched.sort((a, b) => ((b.clockLevel ?? b.zenLevel ?? 0) - (a.clockLevel ?? a.zenLevel ?? 0)));
          setUsersList(fetched);
          setLoadingUsers(false);
        },
        (err) => {
          console.error('Error listening to user directory:', err);
          setUsersError('Registry temporarily clouded. Please check connection.');
          setLoadingUsers(false);
        }
      );

      return () => unsubscribe();
    }
  }, [activeFeedTab]);

  // Handle ticking animation simulation when a video is being "played"
  useEffect(() => {
    let interval: any = null;
    if (playingVideoPostId) {
      interval = setInterval(() => {
        setVideoPlaybackProgress(prev => {
          const current = prev[playingVideoPostId] || 0;
          const next = current >= 100 ? 0 : current + 4;
          return { ...prev, [playingVideoPostId]: next };
        });
      }, 200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playingVideoPostId]);

  // Story timed transit timer
  useEffect(() => {
    let timer: any = null;
    if (activeStoryIdx !== null) {
      timer = setTimeout(() => {
        handleNextStory();
      }, 5000); // 5 seconds per story slide
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeStoryIdx]);

  const handleNextStory = () => {
    if (activeStoryIdx === null) return;
    if (activeStoryIdx < stories.length - 1) {
      // Set previous as viewed
      setStories(prev => prev.map((s, idx) => idx === activeStoryIdx ? { ...s, viewed: true } : s));
      setActiveStoryIdx(activeStoryIdx + 1);
    } else {
      setActiveStoryIdx(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIdx === null) return;
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
    } else {
      setActiveStoryIdx(null);
    }
  };

  const handleCreatePost = () => {
    const targetCircleId = activeCircleId || circles[0]?.id || 'seekers_circle';
    
    let contentToPost = newPostText.trim();
    if (!contentToPost && !attachedMedia) {
      // Elegant presets that are beautifully themed around time, silence and clocks
      const presets = [
        "Pausing for a moment of quiet focus... 🕰️",
        "Synchronizing my daily routine with a peaceful breathing pace 🧘",
        "Sensing the rich, analog flow of the present second ⏱️",
        "Muting the digital noise to experience high-definition stillness 🌲",
        "Grateful for a quiet interval of sensory clarity ✨"
      ];
      contentToPost = presets[Math.floor(Math.random() * presets.length)];
    }
    
    // Call the parent props callback with optional media URL and media type
    onAddPost(
      targetCircleId, 
      contentToPost, 
      attachedMedia?.url || undefined, 
      attachedMedia ? attachedMedia.type : undefined
    );
    
    // Clear state
    setNewPostText('');
    setAttachedMedia(null);
    setShowMediaAttachmentDrawer(false);
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    onAddComment(activeCircleId, postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleBookmark = (postId: string) => {
    setBookmarkedPostIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const toggleRepinch = (postId: string) => {
    setRepinchedIds(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleDeviceLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDeviceImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDeviceImagePreview(dataUrl);
      const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi') || file.name.endsWith('.webm');
      
      // Auto-attach as custom attached media
      setAttachedMedia({
        id: `custom_${Date.now()}`,
        title: file.name,
        url: dataUrl,
        type: isVideo ? 'video' as const : 'image' as const
      });
      setOneDriveToast(`Loaded: ${file.name}`);
      setTimeout(() => setOneDriveToast(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDevicePicToOneDrive = (file: File) => {
    if (!file) return;
    setIsOneDriveSyncing(true);
    setOneDriveUploadProgress(10);
    
    const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi') || file.name.endsWith('.webm');
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 100) progress = 100;
      setOneDriveUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Convert local file to online simulated OneDrive document file
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const newOneDriveFile = {
            id: `od_f_${Date.now()}`,
            name: file.name,
            url: dataUrl,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: isVideo ? 'video' as const : 'image' as const
          };
          
          setOneDriveFiles(prev => [newOneDriveFile, ...prev]);
          setIsOneDriveSyncing(false);
          setAttachedMedia({
            id: newOneDriveFile.id,
            title: `OneDrive: ${newOneDriveFile.name}`,
            url: newOneDriveFile.url,
            type: isVideo ? 'video' as const : 'image' as const
          });
          setOneDriveToast(`Successfully synced "${file.name}" to OneDrive!`);
          setTimeout(() => setOneDriveToast(null), 4000);
        };
        reader.readAsDataURL(file);
      }
    }, 150);
  };

  const handleMomentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMomentFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setMomentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishMoment = () => {
    if (!momentPreview) {
      setOneDriveToast("Please select or capture a visual first!");
      setTimeout(() => setOneDriveToast(null), 3500);
      return;
    }

    setIsPublishingMoment(true);
    setMomentPublishProgress(20);

    let progress = 20;
    const interval = setInterval(() => {
      progress += 25;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setMomentPublishProgress(progress);
    }, 120);

    setTimeout(() => {
      const targetCircleId = activeCircleId || 'seekers_circle';
      const promptCaption = momentCaption.trim() || 'A peaceful capture of today’s quiet moment. 🌅';
      const isVideo = momentFile ? (momentFile.type.startsWith('video') || momentFile.name.endsWith('.mp4') || momentFile.name.endsWith('.mov') || momentFile.name.endsWith('.avi') || momentFile.name.endsWith('.webm')) : (momentPreview.startsWith('data:video') || momentPreview.includes('.mp4'));
      
      // 1. Publish directly as a post in the active circle timeline
      onAddPost(targetCircleId, promptCaption, momentPreview, isVideo ? 'video' : 'image');

      // 2. Also inject into story bubble list at the top bar
      const newStory: StoryMoment = {
        id: `story_${Date.now()}`,
        userName: 'You',
        userAvatar: userAvatar,
        mediaUrl: momentPreview,
        quote: promptCaption,
        viewed: false,
        topic: 'Custom Moment',
        type: isVideo ? 'video' as const : 'image' as const
      };
      setStories(prev => [newStory, ...prev]);

      // Reset states
      setIsPublishingMoment(false);
      setMomentCaption('');
      setMomentPreview(null);
      setMomentFile(null);
      setShowMomentCreator(false);
      setOneDriveToast("Successfully shared new Moment to your timeline and story feed!");
      setTimeout(() => setOneDriveToast(null), 4000);
    }, 850);
  };

  // Human-friendly location simulator
  const getSanctuaryLocation = (uid: string, name: string) => {
    const sum = (uid || name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const zones = [
      'Whisperwood Spires',
      'Amber Solstice Ridge',
      'Cyan Abyssal Sanctuary',
      'Nebula Clock Garden',
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

  // Grid/Feed Post filter selector
  const getFilteredPosts = () => {
    if (!activeCircle || !activeCircle.posts) return [];
    let list = [...activeCircle.posts];
    
    // Filter by search/hashtag
    if (selectedHashtagFilter) {
      const q = selectedHashtagFilter.toLowerCase();
      list = list.filter(p => p.content.toLowerCase().includes(q));
    }
    return list;
  };

  const displayPosts = getFilteredPosts();

  // Grid list of all visual posts across circles
  const getAllVisualMockMedia = () => {
    const media: { id: string; url: string; authorName: string; title: string; type: 'image' | 'video'; likes: number }[] = [];
    
    // Fallback/Default showcase grids
    const fallbackVisuals = [
      { id: 'v1', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80', authorName: 'Leo Vance', title: 'Meditation Spires', type: 'image' as const, likes: 98 },
      { id: 'v2', url: 'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80', authorName: 'Aria Greenfield', title: 'Autumn Tranquility', type: 'image' as const, likes: 114 },
      { id: 'v3', url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80', authorName: 'Marcus Thorne', title: 'Wellness Solstice', type: 'video' as const, likes: 82 },
      { id: 'v4', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80', authorName: 'Dr. Evelyn Moss', title: 'Nebula Sinks', type: 'video' as const, likes: 210 },
      { id: 'v5', url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80', authorName: 'Sienna Ray', title: 'Hearth Raindrops', type: 'image' as const, likes: 65 },
      { id: 'v6', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80', authorName: 'Clock Guide', title: 'Morning Ascent', type: 'image' as const, likes: 154 }
    ];

    // Grab actual attachments from active stream if any
    circles.forEach(c => {
      c.posts.forEach(p => {
        if (p.mediaUrl) {
          media.push({
            id: p.id,
            url: p.mediaUrl,
            authorName: p.authorName,
            title: p.content.substring(0, 30) + '...',
            type: p.mediaType === 'video' ? 'video' : 'image',
            likes: p.likes
          });
        }
      });
    });

    // Merge and filter unique
    return [...media, ...fallbackVisuals].slice(0, 8);
  };

  // Filter registry
  const filteredUsers = usersList.filter(u => {
    const queryStr = memberSearchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(queryStr);
    const membershipMatch = (u.membership || '').toLowerCase().includes(queryStr);
    return nameMatch || membershipMatch;
  });

  return (
    <div className="space-y-6 py-4 animate-fade-in relative" id="circles-parent-view">
      
      {/* 🔴 INSTAGRAM-STYLE MOCK STORIES Moments Bar */}
      <section className="bg-surface-container-low rounded-3xl p-4 border border-outline-variant/10 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
        <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar touch-pan-x items-center">
          {/* Your own Story Anchor */}
          <div 
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group relative transition-all duration-300 hover:scale-105 active:scale-95" 
            onClick={() => setShowMomentCreator(true)}
          >
            <div className="relative w-14 h-14 rounded-full p-[2px] border-2 border-dashed border-pink-400 flex items-center justify-center transition-all group-hover:rotate-45">
              <img src={userAvatar} className="w-11 h-11 rounded-full object-cover animate-pulse" alt="User profile" />
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 rounded-full p-1 text-white shadow-[0_0_15px_rgba(236,72,153,0.8)] border border-white/30 animate-pulse group-hover:scale-110 active:scale-90 transition-all duration-300">
                <Plus className="w-3.5 h-3.5 font-bold" />
              </div>
            </div>
            <span className="text-[10px] mt-1.5 font-bold font-label text-outline group-hover:text-pink-500 transition-colors">Moment</span>
          </div>

          {/* Seeker Stories Bubbles */}
          {stories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setActiveStoryIdx(idx)}
              className="flex flex-col items-center flex-shrink-0 outline-none"
            >
              <div className={`w-14 h-14 rounded-full p-[2.5px] transition-all duration-300 ${
                story.viewed 
                  ? 'bg-outline-variant/40' 
                  : 'bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 animate-pulse-glow shadow-[0_0_12px_rgba(236,72,153,0.25)]'
              } flex items-center justify-center hover:scale-105 active:scale-95`}>
                <div className="w-[46px] h-[46px] bg-surface rounded-full p-0.5">
                  <img src={story.userAvatar} className="w-full h-full rounded-full object-cover" alt={story.userName} />
                </div>
              </div>
              <span className="text-[10px] mt-1.5 font-semibold text-on-surface-variant truncate w-14 text-center">
                {story.userName.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Modern Dashboard Navigation Tabs Grid */}
      <div className="flex items-center justify-between border-b border-outline-variant/15 pr-2" id="circles-hub-tabs">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveFeedTab('explore');
              setSelectedHashtagFilter(null);
            }}
            className={`pb-3 px-4 text-xs font-bold font-headline uppercase tracking-widest transition-all border-b-2 relative outline-none flex items-center gap-1.5 ${
              activeFeedTab === 'explore'
                ? 'border-pink-500 text-pink-500 font-bold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-pink-500" />
            <span>Explore Feed</span>
          </button>
          <button
            onClick={() => setActiveFeedTab('showcase')}
            className={`pb-3 px-4 text-xs font-bold font-headline uppercase tracking-widest transition-all border-b-2 relative outline-none flex items-center gap-1.5 ${
              activeFeedTab === 'showcase'
                ? 'border-pink-500 text-pink-500 font-bold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <Grid className="w-4 h-4 text-pink-500" />
            <span>Showcase Grid</span>
          </button>
          <button
            onClick={() => setActiveFeedTab('members')}
            className={`pb-3 px-4 text-xs font-bold font-headline uppercase tracking-widest transition-all border-b-2 relative outline-none flex items-center gap-1.5 ${
              activeFeedTab === 'members'
                ? 'border-pink-500 text-pink-500'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <Users className="w-4 h-4 text-pink-500" />
            <span>Members Directory</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/10">
          <Sparkle className="w-3 h-3 text-pink-500 animate-spin" />
          <span className="text-[9px] uppercase tracking-wider font-bold text-outline">Social active</span>
        </div>
      </div>

      {/* Main Flow Layout: Side Panels on Large screen, single column on small screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Feed/Main Panels */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active hashtag filter status alert */}
          {selectedHashtagFilter && (
            <div className="bg-pink-500/10 text-pink-500 border border-pink-500/20 px-4 py-2.5 rounded-2xl flex justify-between items-center text-xs">
              <span className="font-semibold">Showing alignments related to: <span className="underline font-bold text-base ml-1">{selectedHashtagFilter}</span></span>
              <button 
                onClick={() => setSelectedHashtagFilter(null)}
                className="bg-pink-500 text-white font-bold px-2 py-1 rounded-lg hover:bg-pink-600 transition-colors uppercase tracking-wider text-[10px]"
              >
                Clear Filter
              </button>
            </div>
          )}

          {activeFeedTab === 'explore' && (
            <>
              {/* Circles Pill Selector row */}
              <section className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 hide-scrollbar touch-pan-x">
                {circles.map(c => {
                  const isActive = c.id === activeCircleId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCircleId(c.id)}
                      className={`py-1.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap outline-none flex items-center gap-1.5 ${
                        isActive 
                          ? 'bg-pink-500 text-white shadow-md' 
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span>{c.avatar}</span>
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </section>

              {/* 🐦 POST COMPOSER (X / Instagram style) */}
              <section className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-[0_8px_32px_rgba(0,0,0,0.015)] space-y-4">
                <div className="flex gap-3.5 items-start">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-outline-variant/10">
                    <img src={userAvatar} className="w-full h-full object-cover" alt="My identity" />
                  </div>
                  <div className="flex-grow space-y-3">
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder={`What’s happening in your clock practice, ${activeCircle.name}?`}
                      className="w-full bg-transparent text-sm font-body text-on-surface placeholder:text-outline/40 border-none outline-none focus:ring-0 resize-none h-20"
                    />

                    {/* Pre-attached Media Preview Card */}
                    {attachedMedia && (
                      <div className="relative rounded-2xl overflow-hidden group shadow-sm max-h-56">
                        <img src={attachedMedia.url} className="w-full h-full object-cover" alt="Attached template illustration" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold uppercase tracking-widest">{attachedMedia.title} ({attachedMedia.type})</span>
                        </div>
                        <button 
                          onClick={() => setAttachedMedia(null)}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Action Drawer triggers */}
                    <div className="flex justify-between items-center pt-2 border-t border-outline-variant/5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowMediaAttachmentDrawer(!showMediaAttachmentDrawer)}
                          className={`p-2 rounded-full transition-all duration-300 hover:bg-pink-500/10 text-pink-500 relative group leading-none ${
                            showMediaAttachmentDrawer ? 'bg-pink-500/15 scale-110 shadow-sm' : ''
                          }`}
                          title="Attach Device Photo or OneDrive Cloud Media"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" title="OneDrive cloud integration online"></span>
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            // Quick hashtag insert
                            setNewPostText(prev => prev + ' #PinchToPause ');
                          }}
                          className="p-2 rounded-full hover:bg-pink-500/10 text-pink-500 transition-colors"
                          title="Quick Hashtag"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setNewPostText(prev => prev + ' 😊');
                          }}
                          className="p-2 rounded-full hover:bg-pink-500/10 text-pink-500 transition-colors"
                          title="Add Clock smile"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={handleCreatePost}
                        className="py-1.5 px-5 bg-pink-500 hover:bg-pink-600 font-headline font-bold text-white tracking-wider rounded-full text-xs shadow-md shadow-pink-500/20 hover:shadow-pink-500/40 transition-all duration-300 active:scale-95 flex items-center gap-1 cursor-pointer"
                        id="submit-social-post"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Pinch Thread</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SLIDING ATTACHMENT Media Selector (Instagram stock templates) */}
                <AnimatePresence>
                  {showMediaAttachmentDrawer && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-outline-variant/5 pt-3 space-y-4"
                    >
                      {/* Interactive Premium Attachment Selector Bar */}
                      <div className="flex flex-col sm:flex-row gap-2 bg-stone-950/30 p-2 rounded-2xl border border-outline-variant/10">
                        {/* 1. Device upload */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                          className="flex-1 py-1.5 px-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 animate-bounce" />
                          <span>Browse Photos & Videos</span>
                        </button>
                        
                        {/* 2. OneDrive Connect & Upload Portal */}
                        <button
                          onClick={() => setShowOneDriveModal(true)}
                          type="button"
                          className="flex-1 py-1.5 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          <span>OneDrive Cloud Storage {isOneDriveConnected ? "• Connected" : ""}</span>
                        </button>
                      </div>

                      {deviceImagePreview && (
                        <div className="p-3 bg-stone-950/40 rounded-xl flex items-center justify-between border border-outline-variant/10">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {attachedMedia?.type === 'video' || deviceImageFile?.type.startsWith('video') || deviceImagePreview.startsWith('data:video') || deviceImagePreview.includes('.mp4') ? (
                              <video src={deviceImagePreview} className="w-10 h-10 object-cover rounded-md bg-stone-900" muted playsInline />
                            ) : (
                              <img src={deviceImagePreview} className="w-10 h-10 object-cover rounded-md" alt="Preview custom image" />
                            )}
                            <div className="text-xs truncate">
                              <span className="font-semibold block text-on-surface truncate">{deviceImageFile?.name || "device_pic.jpg"}</span>
                              <span className="text-[10px] text-outline">
                                {attachedMedia?.type === 'video' ? 'Attached local video' : 'Attached local picture'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (deviceImageFile) {
                                  handleUploadDevicePicToOneDrive(deviceImageFile);
                                }
                              }}
                              className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Upload online to OneDrive
                            </button>
                            <button
                              onClick={() => {
                                setDeviceImageFile(null);
                                setDeviceImagePreview(null);
                                setAttachedMedia(null);
                              }}
                              className="py-1 px-2.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-[10px] text-outline font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                          Or Select Aesthetic Background Presets
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {POST_MEDIA_TEMPLATES.map(media => {
                            const isSelected = attachedMedia?.id === media.id;
                            return (
                              <button
                                key={media.id}
                                onClick={() => setAttachedMedia(media)}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all outline-none ${
                                  isSelected ? 'border-pink-500 scale-95 shadow-md' : 'border-transparent hover:border-pink-500/50'
                                }`}
                              >
                                <img src={media.url} className="w-full h-full object-cover" alt={media.title} />
                                <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[8px] truncate rounded py-0.5 px-1 font-semibold text-center leading-none">
                                  {media.type === 'video' ? '🎥 ' : '🖼️ '}
                                  {media.title.split(' ')[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* DYNAMIC POST STREAM (Blending Text, Images, and Video Play/Pause loops) */}
              <section className="space-y-6 pb-20">
                {displayPosts.length > 0 ? (
                  displayPosts.map(post => {
                    const isBookmarked = bookmarkedPostIds.includes(post.id);
                    const isRepinched = repinchedIds.includes(post.id);
                    const isPlaying = playingVideoPostId === post.id;
                    const progress = videoPlaybackProgress[post.id] || 0;

                    return (
                      <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300 relative group"
                        id={`premium-post-${post.id}`}
                      >
                        {/* Repinched banner badge if simulated */}
                        {isRepinched && (
                          <div className="flex items-center gap-1.5 text-[9px] text-pink-500 font-bold uppercase tracking-widest mb-3 border-b border-outline-variant/5 pb-2">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>You re-pinched this to your followers</span>
                          </div>
                        )}

                        {/* Heading author bar */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/25 flex-shrink-0">
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-container-low rounded-full"></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <h4 className="text-sm font-headline font-semibold text-on-surface hover:text-pink-500 transition-colors cursor-pointer">{post.authorName}</h4>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 fill-current" title="Verified Seeker Guide" />
                              </div>
                              <span className="text-[10px] text-outline font-label uppercase tracking-wider block">{post.timeLabel}</span>
                            </div>
                          </div>
                          
                          <button className="text-outline/40 hover:text-pink-500 p-1.5 rounded-full hover:bg-surface-container-high transition-colors outline-none">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Body content text */}
                        <p className="mt-3.5 text-sm text-on-surface-variant font-body leading-relaxed max-w-xl whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Render Attached Backdrops (X / Instagram style image/video block) */}
                        {post.mediaUrl && (
                          <div className="mt-4 rounded-2xl overflow-hidden relative border border-outline-variant/10 shadow-sm group-has-[video]/media">
                            {post.mediaType === 'video' && isPlaying ? (
                              <video 
                                src={post.mediaUrl} 
                                className="w-full max-h-80 object-cover bg-stone-950" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                controls={true}
                              />
                            ) : (
                              <img src={post.mediaUrl} className="w-full max-h-80 object-cover" alt="Attached alignment visual card" />
                            )}
                            
                            {/* VIDEO PLAYER OVERLAY (Simulating playable relaxation video sessions!) */}
                            {post.mediaType === 'video' ? (
                              <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 text-white">
                                <span className="self-start text-[10px] uppercase font-bold tracking-widest bg-pink-500/80 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <Film className="w-3 h-3 text-white" /> Live Clock Track
                                </span>

                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => {
                                        setPlayingVideoPostId(isPlaying ? null : post.id);
                                      }}
                                      className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-transform active:scale-90 shadow-lg glow-pink"
                                    >
                                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                    </button>
                                    
                                    {isPlaying && (
                                      <div className="text-right text-[10px] font-mono leading-none bg-black/60 px-2 py-1 rounded">
                                        <p className="font-bold text-pink-400">BREATHE IN: {(progress % 20) < 10 ? 'HOLD' : 'EXHALE'}</p>
                                        <p className="mt-0.5 opacity-70">Solfeggio 528Hz active</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Custom progress tracker bar */}
                                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-pink-500 h-full rounded-full transition-all duration-200 shadow-[0_0_10px_#ec4899]" 
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Interactive operations bar (Twitter styled but premium pink vibes!) */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-outline-variant/10 text-outline">
                          {/* Like button with pink hearts triggers */}
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => onLikePost(activeCircle.id, post.id)}
                              className={`group/like-button flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:bg-pink-500/10 ${
                                post.hasLiked ? 'text-pink-500 scale-105' : 'hover:text-pink-500'
                              }`}
                              id={`dynamic-heart-like-${post.id}`}
                            >
                              <motion.div
                                animate={{ scale: post.hasLiked ? [1, 1.45, 1] : 1 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="relative"
                              >
                                <Heart className={`w-4 h-4 transition-all duration-300 ${
                                  post.hasLiked 
                                    ? 'text-pink-500 fill-pink-500 stroke-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' 
                                    : 'text-outline group-hover/like-button:scale-110'
                                }`} />

                                {/* Falling cute floating sparks animations when clicked */}
                                {post.hasLiked && (
                                  <>
                                    <motion.span
                                      initial={{ opacity: 1, scale: 0.4, y: 0, x: 0 }}
                                      animate={{ opacity: 0, scale: 1.2, y: -22, x: -12 }}
                                      transition={{ duration: 0.55 }}
                                      className="absolute text-[8px] pointer-events-none select-none text-pink-500"
                                    >
                                      🌸
                                    </motion.span>
                                    <motion.span
                                      initial={{ opacity: 1, scale: 0.4, y: 0, x: 0 }}
                                      animate={{ opacity: 0, scale: 1.2, y: -24, x: 12 }}
                                      transition={{ duration: 0.65, delay: 0.04 }}
                                      className="absolute text-[8px] pointer-events-none select-none text-pink-400"
                                    >
                                      💕
                                    </motion.span>
                                    <motion.span
                                      initial={{ opacity: 1, scale: 0.4, y: 0, x: 0 }}
                                      animate={{ opacity: 0, scale: 1.1, y: -16, x: 0 }}
                                      transition={{ duration: 0.45, delay: 0.08 }}
                                      className="absolute text-[6px] pointer-events-none select-none text-pink-500"
                                    >
                                      ✨
                                    </motion.span>
                                  </>
                                )}
                              </motion.div>
                              <span className="text-xs ml-1.5 select-none font-medium tabular-nums">{post.likes}</span>
                            </button>
                          </div>

                          {/* Comment trigger badge */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-400 ${
                                expandedComments[post.id] ? 'text-blue-400 bg-blue-500/5' : ''
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-xs ml-1.5 font-medium tabular-nums">{post.comments.length}</span>
                            </button>
                          </div>

                          {/* Re-Pinch trigger ("X" simulated retweet) */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => toggleRepinch(post.id)}
                              className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:bg-pink-500/10 ${
                                isRepinched ? 'text-pink-500 font-bold scale-105' : 'hover:text-pink-500'
                              }`}
                            >
                              <RefreshCw className={`w-4 h-4 ${isRepinched ? 'stroke-[2.5px] rotate-180 transition-transform duration-300' : ''}`} />
                            </button>
                          </div>

                          {/* Bookmark trigger drawer (Instagram style save item) */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => toggleBookmark(post.id)}
                              className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 hover:bg-yellow-500/10 ${
                                isBookmarked ? 'text-yellow-500 scale-105' : 'hover:text-amber-500'
                              }`}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Comment/Reply Panel Container */}
                        <div className={expandedComments[post.id] ? "block" : "hidden"}>
                          {/* Rendering Comment threads inside layout */}
                          {post.comments.length > 0 && (
                            <div className="bg-surface-container-lowest/70 rounded-2xl p-4 mt-4 space-y-3 border border-outline-variant/10 text-xs text-on-surface-variant font-body">
                              {post.comments.map(comment => (
                                <div key={comment.id} className="space-y-1">
                                  <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-pink-500">{comment.authorName}</span>
                                    <span className="text-[9px] text-outline uppercase tracking-wider">{comment.timeLabel}</span>
                                  </div>
                                  <p className="text-on-surface-variant">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Expandable replies input box */}
                          <div className="flex gap-2 items-center bg-surface-container-lowest rounded-2xl p-1.5 mt-4 border border-outline-variant/5">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCommentInputs(prev => ({ ...prev, [post.id]: val }));
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                              placeholder="Add a thoughtful wellness reply..."
                              className="flex-grow bg-transparent border-none text-xs text-on-surface placeholder:text-outline/40 outline-none px-3 focus:ring-0"
                            />
                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              className="py-1 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-[10px] font-bold font-label uppercase tracking-widest transition-all"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 bg-surface-container-low/40 rounded-3xl border border-dashed border-outline-variant/30">
                    <Compass className="w-12 h-12 mx-auto text-outline/40 mb-3" />
                    <h3 className="font-headline font-bold text-base text-primary">Backdrop empty</h3>
                    <p className="text-xs font-body text-outline max-w-xs mx-auto mt-2 leading-relaxed">
                      Select another circle, clear query hashtag filter or compose a dynamic thought-frame to start engagement!
                    </p>
                  </div>
                )}
              </section>
            </>
          )}

          {/* 📷 INSTAGRAM-STYLE SHOWCASE GRID TAB */}
          {activeFeedTab === 'showcase' && (
            <div className="space-y-6">
              <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-sm">
                <h3 className="font-headline font-bold text-base text-primary mb-1">Visual Sanctuary Grid</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Browse serene photos and videos taken by global mindfulness practitioners. Breathe, absorb, and save bookmarks.
                </p>
              </div>

              <section className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20">
                {getAllVisualMockMedia().map(media => {
                  const isBookmarked = bookmarkedPostIds.includes(media.id);
                  return (
                    <motion.div 
                      key={media.id}
                      whileHover={{ scale: 1.02 }}
                      className="group relative aspect-square bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10 shadow-sm cursor-pointer"
                    >
                      <img src={media.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={media.title} />
                      
                      {/* Grid hover styling overlay details */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(media.id);
                            }}
                            className={`p-2 bg-black/40 hover:bg-black/75 rounded-full transition-colors ${
                              isBookmarked ? 'text-yellow-400' : 'text-white'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="bg-pink-500 text-[8px] font-bold uppercase py-0.5 px-1.5 rounded-full tracking-wider block w-fit">
                            {media.type === 'video' ? '🎥 VIDEO' : '🖼️ PHOTO'}
                          </span>
                          <h4 className="font-bold text-[11px] truncate leading-tight uppercase tracking-wider">{media.title}</h4>
                          <div className="flex items-center gap-1 text-[9px] opacity-90 truncate">
                            <span>by {media.authorName}</span>
                            <span>•</span>
                            <span>{media.likes} likes</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </section>
            </div>
          )}

          {/* 👥 THE DEEP REAL-TIME SEARCH & LOCATE MEMBER REGISTRY TAB */}
          {activeFeedTab === 'members' && (
            <div className="space-y-6" id="find-members-container">
              {/* Member Search input */}
              <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5">
                <div className="relative group/search">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within/search:text-pink-500 transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-pink-500 transition-all placeholder:text-outline/40 font-body text-sm outline-none"
                    placeholder="Search clockit members by name, status, or membership badge..."
                    id="member-search-input"
                  />
                </div>
                <div className="flex justify-between items-center mt-3 px-1 text-xs text-outline font-label">
                  <span>
                    {loadingUsers ? 'Scanning alignments...' : `Located ${filteredUsers.length} of ${usersList.length} global seekers`}
                  </span>
                  <span className="text-pink-500 font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></div> Real-time Active
                  </span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 4].map(item => (
                    <div key={item} className="bg-surface-container-low rounded-3xl p-6 h-48 animate-pulse border border-outline-variant/10 flex flex-col justify-between">
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
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {filteredUsers.map((user) => {
                    const loc = getSanctuaryLocation(user.uid, user.name);
                    const avatarInitials = (user.name || 'Z').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                    // Dynamic header ambient bars depending on seeker custom profiles
                    let headerBackground = 'from-pink-500/10 to-pink-500/5';
                    if (user.themeMode === 'ocean') headerBackground = 'from-cyan-950/40 to-blue-900/30';
                    else if (user.themeMode === 'forest') headerBackground = 'from-emerald-950/40 to-green-900/30';
                    else if (user.themeMode === 'cosmic') headerBackground = 'from-fuchsia-950/35 to-violet-950/30';
                    else if (user.themeMode === 'sepia') headerBackground = 'from-amber-100 to-orange-100/20';

                    return (
                      <div 
                        key={user.uid}
                        className="group bg-surface-container-low hover:bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-pink-500/20 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.01)] hover:shadow-md flex flex-col justify-between"
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${headerBackground} w-full`}></div>

                        <div className="p-5 space-y-4">
                          <div className="flex gap-3.5 items-start">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full overflow-hidden border border-outline-variant/20 flex-shrink-0 bg-pink-500/5 flex items-center justify-center">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="text-sm font-bold font-headline text-pink-500">{avatarInitials}</span>
                                )}
                              </div>
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-container-low animate-pulse"></span>
                            </div>
                            
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-headline font-bold text-base text-on-surface truncate group-hover:text-pink-500 transition-colors">
                                  {user.name}
                                </h3>
                                {(user.clockLevel ?? user.zenLevel ?? 12) >= 20 && (
                                  <Sparkles className="w-3.5 h-3.5 text-pink-500 flex-shrink-0 animate-bounce" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] tracking-wide font-headline bg-pink-500/10 text-pink-500 px-2.5 py-0.5 rounded-full font-bold uppercase">
                                  {user.membership || 'Aura Seeker'}
                                </span>
                                <span className="text-[10px] font-mono text-outline">
                                  Clock {user.clockLevel ?? user.zenLevel ?? 12}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Coordinates */}
                          <div className="bg-surface-container-lowest/60 rounded-2xl p-3 border border-outline-variant/10 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body">
                              <Compass className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                              <span className="truncate text-outline">{loc.zone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-outline">
                              <MapPin className="w-3 h-3 text-pink-500 flex-shrink-0" />
                              <span>{loc.coord}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest/30">
                          {onStartDirectChat && (
                            <button
                              onClick={() => onStartDirectChat(user.uid, user.name, user.avatar || '')}
                              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-pink-500 text-white hover:bg-pink-600 transition-all text-xs font-bold font-label uppercase tracking-widest rounded-xl shadow-xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-white" />
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
                  <h3 className="font-headline font-bold text-base text-primary">Seeker registry index blank</h3>
                  <p className="text-xs font-body text-outline max-w-sm mx-auto mt-2 leading-relaxed">
                    No seekers matching your terms. Adjust coordinate rules and search global spheres again.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (X style trends, analytics, bookmarks etc) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 🐦 Twitter-like "What's Happening" Trends & Live news Topic Drawer */}
          <section className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/5 pb-2.5">
              <h3 className="font-headline font-bold text-xs text-primary flex items-center gap-1.5 uppercase tracking-widest">
                <TrendingUp className="w-4 h-4 text-pink-500" />
                Trends & Web News
              </h3>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={async () => {
                    setLoadingNews(true);
                    setNewsError(null);
                    try {
                      const res = await fetch('/api/news/trending');
                      const data = await res.json();
                      if (data && Array.isArray(data.news)) {
                        setLiveNews(data.news);
                      } else {
                        setNewsError('Invalid feed format.');
                      }
                    } catch (err) {
                      setNewsError('Could not refresh news updates.');
                    } finally {
                      setLoadingNews(false);
                    }
                  }}
                  disabled={loadingNews}
                  className="p-1 rounded-lg bg-surface-container-lowest hover:bg-pink-500/10 text-outline hover:text-pink-500 transition-all cursor-pointer disabled:opacity-50"
                  title="Refresh web news"
                  id="btn-refresh-trends"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin text-pink-500' : ''}`} />
                </button>
                <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
              </div>
            </div>

            {/* Selector tabs for Sidebar Trend Type */}
            <div className="grid grid-cols-2 gap-1 bg-surface-container-lowest p-1 rounded-xl">
              <button
                onClick={() => setNewsTab('internal')}
                className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  newsTab === 'internal'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Internal
              </button>
              <button
                onClick={() => setNewsTab('live')}
                className={`py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  newsTab === 'live'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm font-extrabold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <Globe className="w-3 h-3 text-pink-200" />
                Web News
              </button>
            </div>

            <div className="space-y-4">
              {newsTab === 'internal' ? (
                // --- INTERNAL TRENDS ---
                trendingTopics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedHashtagFilter(topic.hashtag);
                      setActiveFeedTab('explore');
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-surface-container-lowest hover:bg-pink-500/5 hover:border-pink-500/20 border border-transparent transition-all outline-none block group cursor-pointer"
                  >
                    <div className="flex justify-between text-[10px] font-label text-outline uppercase tracking-wider mb-1 leading-none">
                      <span>{topic.category}</span>
                      <span className="text-pink-500 font-bold">{topic.postsCount} pinches</span>
                    </div>
                    <h4 className="font-bold text-sm text-on-surface group-hover:text-pink-500 transition-colors">
                      {topic.hashtag}
                    </h4>
                    <p className="text-[11px] text-outline mt-1 font-body leading-tight">
                      {topic.description}
                    </p>
                  </button>
                ))
              ) : (
                // --- LIVE WEB NEWS GROUNDED VIA GEMINI SEARCH ---
                <div className="space-y-3">
                  {loadingNews ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-7 h-7 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto animate-pulse" />
                      <p className="text-[10px] uppercase tracking-wider text-outline animate-pulse font-mono">Synchronizing Live Web...</p>
                    </div>
                  ) : newsError ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {newsError}
                      </p>
                      <button
                        onClick={async () => {
                          setLoadingNews(true);
                          setNewsError(null);
                          try {
                            const res = await fetch('/api/news/trending');
                            const data = await res.json();
                            if (data && Array.isArray(data.news)) {
                              setLiveNews(data.news);
                            } else {
                              setNewsError('Invalid feed format.');
                            }
                          } catch (err) {
                            setNewsError('Could not reconnect.');
                          } finally {
                            setLoadingNews(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        Retry Connection
                      </button>
                    </div>
                  ) : liveNews.length > 0 ? (
                    liveNews.map((newsItem) => (
                      <button
                        key={newsItem.id}
                        onClick={() => setSelectedNewsDetail(newsItem)}
                        className="w-full text-left p-3 rounded-2xl bg-surface-container-lowest hover:bg-pink-500/5 hover:border-pink-500/20 border border-transparent transition-all outline-none block group cursor-pointer"
                        id={`btn-live-news-${newsItem.id}`}
                      >
                        <div className="flex justify-between text-[10px] font-label text-outline uppercase tracking-wider mb-1 leading-none">
                          <span className="font-bold text-pink-500/90">{newsItem.category}</span>
                          <span className="text-pink-500 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                            {newsItem.postsCount} views
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-on-surface group-hover:text-pink-500 transition-colors line-clamp-1">
                          {newsItem.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant font-semibold mt-1 flex items-center gap-1 font-mono">
                          <span className="text-outline uppercase text-[9px] font-bold">Hashtag:</span> {newsItem.hashtag}
                        </p>
                        <p className="text-[11px] text-outline mt-1 font-body leading-tight line-clamp-2">
                          {newsItem.description}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-outline">
                      <p className="text-xs font-semibold">No active news waves detected.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Bookmarks widget */}
          <section className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-1.5 uppercase tracking-widest">
              <Bookmark className="w-4 h-4 text-pink-500" />
              Saved Solstices
            </h3>
            <p className="text-[11px] text-on-surface-variant font-body leading-relaxed">
              You currently have <span className="font-bold text-pink-500 underline">{bookmarkedPostIds.length} bookmarks</span> stored securely on your browser instance. Tapping bookmarks on active threads saves them instantly for silent memory.
            </p>
          </section>

          {/* Social connection quote cards */}
          <section className="bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent rounded-3xl p-5 border border-outline-variant/10 shadow-sm text-center relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"></div>
            <Sparkle className="w-6 h-6 text-pink-500 mx-auto mb-2.5 animate-spin" />
            <p className="text-xs italic text-on-surface-variant font-body leading-relaxed max-w-xs mx-auto">
              "We form silent connections with those whose pauses match our breathing speed."
            </p>
            <span className="text-[9px] uppercase tracking-wider text-pink-500/75 mt-3 font-semibold block">Clockit Wisdom Registry</span>
          </section>

        </div>
      </div>

      {/* 🔴 FULL SCREEN TIMED INSTAGRAM STORY OVERLAY CARDS MODAL */}
      <AnimatePresence>
        {activeStoryIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/98 backdrop-blur z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-stone-900 rounded-3xl border border-stone-800 overflow-hidden relative aspect-[9/16] shadow-2xl flex flex-col justify-between p-6">
              
              {/* TOP: Story Progress Indicator Bar (5s timed auto-next) */}
              <div className="space-y-4 z-10 w-full">
                <div className="flex gap-1.5 w-full">
                  {stories.map((s, idx) => {
                    let pct = 0;
                    if (idx < activeStoryIdx) pct = 100;
                    if (idx === activeStoryIdx) pct = 100; // Simulated full bar
                    return (
                      <div key={s.id} className="h-1 bg-white/20 flex-grow rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: '0%' }}
                          animate={{ width: idx === activeStoryIdx ? '100%' : idx < activeStoryIdx ? '100%' : '0%' }}
                          transition={{ duration: idx === activeStoryIdx ? 5 : 0.1, ease: 'linear' }}
                          className="bg-pink-500 h-full rounded-full"
                        ></motion.div>
                      </div>
                    );
                  })}
                </div>

                {/* Profile Header line inside story */}
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center gap-2.5">
                    <img src={stories[activeStoryIdx].userAvatar} className="w-9 h-9 rounded-full object-cover border border-white/20" alt="Avatar" />
                    <div>
                      <h4 className="text-xs font-bold font-headline leading-tight">{stories[activeStoryIdx].userName}</h4>
                      <span className="text-[9px] text-pink-400 font-bold block uppercase tracking-wider">{stories[activeStoryIdx].topic}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveStoryIdx(null)}
                    className="p-1 px-3 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold tracking-widest text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* BACKGROUND VISUAL FILL FOR INSTAGRAM FEEL */}
              <div className="absolute inset-0 z-0 bg-stone-950">
                {stories[activeStoryIdx].type === 'video' || stories[activeStoryIdx].mediaUrl.includes('.mp4') || stories[activeStoryIdx].mediaUrl.startsWith('data:video') ? (
                  <video 
                    src={stories[activeStoryIdx].mediaUrl} 
                    className="w-full h-full object-cover opacity-65 font-sans" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                  />
                ) : (
                  <img src={stories[activeStoryIdx].mediaUrl} className="w-full h-full object-cover opacity-60" alt="Story visual backdrop" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
              </div>

              {/* MIDDLE: Timed inspiration text display */}
              <div className="z-10 text-center px-4 self-center max-w-sm">
                <motion.div
                  key={activeStoryIdx}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <span className="text-pink-400 font-serif text-5xl font-extrabold block">“</span>
                  <p className="text-lg md:text-xl font-headline font-bold text-white tracking-wide leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                    {stories[activeStoryIdx].quote}
                  </p>
                  <span className="text-pink-400 font-serif text-5xl font-extrabold block">”</span>
                </motion.div>
              </div>

              {/* BOTTOM: Direct interactions and navigation triggers */}
              <div className="z-10 space-y-4 w-full">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Reply to ${stories[activeStoryIdx].userName.split(' ')[0]}...`}
                    className="w-full bg-white/10 hover:bg-white/15 border-none outline-none focus:ring-1 focus:ring-pink-500 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/50 font-body"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // Quick feedback simulation
                        setActiveStoryIdx(null);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      // Animated like response
                      setActiveStoryIdx(null);
                    }}
                    className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-transform active:scale-90 shadow-md shadow-pink-500/20"
                  >
                    <Heart className="w-4 h-4 fill-current text-white" />
                  </button>
                </div>

                <div className="flex justify-between text-white/50 text-[10px] uppercase font-bold tracking-widest pt-1 px-1">
                  <button onClick={handlePrevStory} className="hover:text-white transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <span>{activeStoryIdx + 1} of {stories.length}</span>
                  <button onClick={handleNextStory} className="hover:text-white transition-colors flex items-center gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden standard HTML file inputs for Device upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleDeviceLocalFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* ☁️ MICROSOFT ONEDRIVE INTEGRATION & CLOUD PIC PORTAL MODAL */}
      <AnimatePresence>
        {showOneDriveModal && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 text-white w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400 animate-pulse" />
                  <h3 className="font-headline font-black text-xs tracking-widest uppercase text-blue-450">OneDrive Cloud Portal</h3>
                </div>
                <button 
                  onClick={() => setShowOneDriveModal(false)}
                  className="p-1.5 px-3 bg-stone-800 hover:bg-stone-700 rounded-full text-xs font-bold leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* OneDrive Alert Toast inside Modal */}
              {oneDriveToast && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{oneDriveToast}</span>
                </div>
              )}

              {/* Core Content */}
              <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-1 hide-scrollbar">
                
                {/* 1. Account Connectivity Connection bar */}
                <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Cloud Account Provider</div>
                    <div className="font-bold text-xs text-stone-200">
                      {isOneDriveConnected ? "coopedill@gmail.com (Active)" : "OneDrive Storage Disconnected"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isOneDriveConnected) {
                        setIsOneDriveConnected(false);
                      } else {
                        setIsOneDriveSyncing(true);
                        setOneDriveUploadProgress(20);
                        setTimeout(() => setOneDriveUploadProgress(60), 200);
                        setTimeout(() => {
                          setIsOneDriveSyncing(false);
                          setIsOneDriveConnected(true);
                          setOneDriveToast("Connected to Microsoft OneDrive successfully!");
                          setTimeout(() => setOneDriveToast(null), 3500);
                        }, 500);
                      }
                    }}
                    className={`py-1.5 px-4 rounded-xl text-[10px] font-bold font-label uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                      isOneDriveConnected 
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isOneDriveConnected ? "Disconnect ID" : "Connect Identity"}
                  </button>
                </div>

                {/* 2. Upload section: device to OneDrive Sync block */}
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Permissive Device Cloud Sync
                  </h4>
                  <p className="text-[11px] text-stone-400 leading-normal">
                    Upload any local photo from your device online onto OneDrive, storing it securely inside the digital cloud directory.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Browse local device file
                    </button>
                  </div>

                  {deviceImageFile && (
                    <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {deviceImageFile.type.startsWith('video') || deviceImagePreview?.startsWith('data:video') ? (
                          <video src={deviceImagePreview || ''} className="w-10 h-10 rounded object-cover flex-shrink-0 bg-stone-900" muted playsInline />
                        ) : (
                          <img src={deviceImagePreview || ''} className="w-10 h-10 rounded object-cover flex-shrink-0" alt="Preview device" />
                        )}
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold truncate text-white">{deviceImageFile.name}</div>
                          <div className="text-[10px] text-stone-500">{(deviceImageFile.size / 1024).toFixed(0)} KB • Ready</div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleUploadDevicePicToOneDrive(deviceImageFile)}
                        className="py-1.5 px-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer"
                        disabled={isOneDriveSyncing}
                      >
                        {isOneDriveSyncing ? `Syncing ${oneDriveUploadProgress}%` : "Sync to OneDrive"}
                      </button>
                    </div>
                  )}

                  {isOneDriveSyncing && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-blue-400 font-bold uppercase">
                        <span>Uploading device picture online...</span>
                        <span>{oneDriveUploadProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-200"
                          style={{ width: `${oneDriveUploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Browse Online Storage section */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>OneDrive Cloud Directory (/Pictures & Videos/)</span>
                    <span className="text-[10px] font-mono text-stone-500">{oneDriveFiles.length} files available</span>
                  </div>

                  {isOneDriveConnected ? (
                    <div className="grid grid-cols-2 gap-3">
                      {oneDriveFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className="bg-stone-950 rounded-xl border border-stone-800 p-2 flex flex-col justify-between group hover:border-blue-500/40 transition-colors"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/10 mb-2">
                            {file.type === 'video' ? (
                              <div className="relative w-full h-full">
                                <video src={file.url} className="w-full h-full object-cover" muted playsInline />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <span className="text-white text-[9px] bg-blue-500/80 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">🎥 VIDEO</span>
                                </div>
                              </div>
                            ) : (
                              <img src={file.url} className="w-full h-full object-cover" alt={file.name} referrerPolicy="no-referrer" />
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/60 text-[8px] text-white px-1 py-0.5 rounded leading-none">
                              {file.size}
                            </span>
                          </div>
                          <div>
                            <div className="text-[11px] font-bold truncate text-stone-200 leading-tight mb-2">
                              {file.name}
                            </div>
                            <button
                              onClick={() => {
                                setAttachedMedia({
                                  id: file.id,
                                  title: `OneDrive: ${file.name}`,
                                  url: file.url,
                                  type: file.type === 'video' ? 'video' as const : 'image' as const
                                });
                                setShowOneDriveModal(false);
                                setOneDriveToast(`Attached: ${file.name}`);
                                setTimeout(() => setOneDriveToast(null), 3000);
                              }}
                              className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center block"
                            >
                              {file.type === 'video' ? "Attach Cloud Video" : "Attach Cloud Image"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-stone-950 rounded-2xl border border-stone-800 text-stone-500 space-y-2">
                      <p className="text-xs">Connect your Microsoft Account to explore OneDrive cloud pictures.</p>
                      <button
                        onClick={() => {
                          setIsOneDriveSyncing(true);
                          setOneDriveUploadProgress(20);
                          setTimeout(() => setOneDriveUploadProgress(60), 200);
                          setTimeout(() => {
                            setIsOneDriveSyncing(false);
                            setIsOneDriveConnected(true);
                            setOneDriveToast("Connected to Microsoft OneDrive successfully!");
                            setTimeout(() => setOneDriveToast(null), 3500);
                          }, 500);
                        }}
                        className="py-1 px-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors inline-block cursor-pointer"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}

                </div>

              </div>

              <div className="pt-4 border-t border-stone-800 text-[10px] text-stone-600 text-center uppercase tracking-widest font-mono">
                Microsoft Graph Secure API Connected
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden standard HTML file input for Moment Creator */}
      <input 
        type="file" 
        ref={momentFileInputRef} 
        onChange={handleMomentFileChange} 
        accept="image/*,video/*" 
        className="hidden" 
      />

      {/* 📸 PERMISSIVE WELLNESS MOMENT CREATOR MODAL */}
      <AnimatePresence>
        {showMomentCreator && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="flex justify-between items-center pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
                  <h3 className="font-headline font-black text-xs tracking-widest uppercase text-pink-400">Share a Live Moment</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowMomentCreator(false);
                    setMomentCaption('');
                    setMomentPreview(null);
                    setMomentFile(null);
                  }}
                  className="p-1.5 px-3 bg-stone-800 hover:bg-stone-700 rounded-full text-xs font-bold leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-4">
                {/* Visual Attachment Preview Block */}
                {momentPreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 flex items-center justify-center group shadow-inner">
                    {momentFile?.type.startsWith('video') || momentPreview.includes('.mp4') || momentPreview.startsWith('data:video') ? (
                      <video src={momentPreview} className="w-full h-full object-cover" controls muted playsInline />
                    ) : (
                      <img src={momentPreview} className="w-full h-full object-cover" alt="Moment picture to share" />
                    )}
                    <button
                      onClick={() => {
                        setMomentPreview(null);
                        setMomentFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/65 hover:bg-black/95 rounded-full text-white text-xs font-bold leading-none backdrop-blur-sm"
                      title="Remove media"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full shadow-md">
                      {momentFile?.type.startsWith('video') || momentPreview.includes('.mp4') || momentPreview.startsWith('data:video') ? 'Video Selected' : 'Picture Selected'}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pick from Device */}
                    <button
                      onClick={() => momentFileInputRef.current?.click()}
                      className="aspect-video bg-stone-950 hover:bg-stone-950/80 rounded-2xl border-2 border-dashed border-stone-800 hover:border-pink-500/40 transition-colors flex flex-col items-center justify-center p-3 text-center gap-1.5 cursor-pointer group"
                    >
                      <ImageIcon className="w-6 h-6 text-pink-500 group-hover:animate-bounce" />
                      <div className="text-[10px] font-bold uppercase text-stone-300">Browse Device File</div>
                      <p className="text-[9px] text-stone-500">Photos & Videos (MP4, PNG, etc.)</p>
                    </button>

                    {/* Choose OneDrive Cloud files directly inside modal! */}
                    <button
                      onClick={() => {
                        if (!isOneDriveConnected) {
                          // Connect OneDrive instantly with feedback and then show the files
                          setIsOneDriveConnected(true);
                          setOneDriveToast("OneDrive logged in as coopedill@gmail.com!");
                          setTimeout(() => setOneDriveToast(null), 3000);
                        }
                        // Use a random OneDrive photo or video as a nice preset
                        const randomOdFile = oneDriveFiles[Math.floor(Math.random() * oneDriveFiles.length)];
                        setMomentPreview(randomOdFile.url);
                        setMomentFile(randomOdFile.type === 'video' ? new File([], randomOdFile.name, { type: 'video/mp4' }) : null);
                        setOneDriveToast(`Imported "${randomOdFile.name}" from OneDrive!`);
                        setTimeout(() => setOneDriveToast(null), 3500);
                      }}
                      className="aspect-video bg-stone-950 hover:bg-stone-950/80 rounded-2xl border-2 border-dashed border-stone-800 hover:border-blue-500/40 transition-colors flex flex-col items-center justify-center p-3 text-center gap-1.5 cursor-pointer group"
                    >
                      <Globe className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
                      <div className="text-[10px] font-bold uppercase text-stone-300">OneDrive Cloud</div>
                      <p className="text-[9px] text-stone-500">Pick cloud photos & videos</p>
                    </button>
                  </div>
                )}

                {/* Caption / Inspiration Text Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Add a story or caption</label>
                  <textarea
                    value={momentCaption}
                    onChange={(e) => setMomentCaption(e.target.value)}
                    placeholder="Type a thoughtful caption, mindfulness quote or deep pause reflection..."
                    rows={3}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-pink-500/40 rounded-2xl p-3 text-xs outline-none focus:ring-0 text-white placeholder:text-stone-600 resize-none"
                  />
                </div>

                {/* Show simulation progress */}
                {isPublishingMoment && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-pink-400 font-bold uppercase">
                      <span>Publishing live to your active Timeline and Stories...</span>
                      <span>{momentPublishProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-pink-500/10 rounded-full overflow-hidden">
                      <div 
                        className="bg-pink-500 h-full transition-all duration-200"
                        style={{ width: `${momentPublishProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-800 flex gap-2">
                <button
                  onClick={() => {
                    setShowMomentCreator(false);
                    setMomentCaption('');
                    setMomentPreview(null);
                    setMomentFile(null);
                  }}
                  className="flex-1 py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                  disabled={isPublishingMoment}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishMoment}
                  className="flex-1 py-1.5 px-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  disabled={isPublishingMoment}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Moment</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📰 INTERACTIVE DETAILED TRENDING NEWS MODAL */}
      <AnimatePresence>
        {selectedNewsDetail && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col justify-between"
              id="news-detail-modal"
            >
              <div className="flex justify-between items-center pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-pink-500 animate-pulse" />
                  <h3 className="font-headline font-black text-xs tracking-widest uppercase text-pink-400">Grounded Web News</h3>
                </div>
                <button 
                  onClick={() => setSelectedNewsDetail(null)}
                  className="p-1 px-2.5 bg-stone-800 hover:bg-stone-700 rounded-full text-xs font-bold cursor-pointer transition-all"
                  id="close-news-modal-btn"
                >
                  ✕
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-pink-500 tracking-wider mb-1.5 font-mono">
                    <span>{selectedNewsDetail.category}</span>
                    <span className="bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full">{selectedNewsDetail.postsCount} readers</span>
                  </div>
                  <h4 className="font-headline font-extrabold text-base text-stone-100 leading-snug">
                    {selectedNewsDetail.title}
                  </h4>
                </div>

                <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 text-xs text-stone-300 leading-relaxed font-body">
                  {selectedNewsDetail.description}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 bg-stone-950/40 p-2 rounded-xl border border-stone-800/40">
                  <span className="font-bold text-stone-500 uppercase text-[9px]">Outlet:</span>
                  <span className="text-pink-400 font-bold">{selectedNewsDetail.source}</span>
                  <span className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                  <span className="text-stone-400 select-all select-text truncate text-[10px]" title={selectedNewsDetail.url}>{selectedNewsDetail.url}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-800 flex gap-2">
                <a
                  href={selectedNewsDetail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-stone-850 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 cursor-pointer border border-stone-800"
                  id="link-read-full-news"
                >
                  <Globe className="w-3.5 h-3.5 text-pink-405" />
                  <span>Official Article</span>
                </a>
                <button
                  onClick={() => {
                    // Pre-populate post box
                    setNewPostText(`🚨 Debating: Let's discuss "${selectedNewsDetail.title}" (via ${selectedNewsDetail.source}). What are your thoughts? ${selectedNewsDetail.hashtag}`);
                    // Close news modal
                    setSelectedNewsDetail(null);
                    // Bring user back to explore chat board
                    setActiveFeedTab('explore');
                  }}
                  className="flex-grow py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-draft-news-post"
                >
                  <Share2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>Sync to Feed</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
