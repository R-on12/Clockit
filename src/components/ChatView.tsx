import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, Phone, MoreVertical, Plus, Send, Sparkles, X, Heart, FileText, Image, Camera, Paperclip, Download, Mic, MicOff, VideoOff, PhoneOff, Activity, Volume2, VolumeX, Check, CheckCheck, Smile, CornerUpLeft, Trash2, Search, Play, Pause, Sliders, Link, Upload } from 'lucide-react';
import { Conversation, Message, Reflection } from '../types';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text: string, attachment?: { type: 'photo' | 'gif' | 'document'; url: string; name?: string; size?: string }) => void;
  onSaveReflection: (reflection: Reflection) => void;
  userAvatar: string;
  userName?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  onSaveReflection,
  userAvatar,
  userName = 'Ronnie'
}) => {
  const [inputText, setInputText] = useState('');
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPhotoPresetPicker, setShowPhotoPresetPicker] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isBreathingState, setIsBreathingState] = useState<'In' | 'Hold' | 'Out' | 'Pause'>('In');
  const [breathingProgress, setBreathingProgress] = useState(1); // 1 to 1.5 scale

  // WhatsApp styling & feature states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const [msgReactions, setMsgReactions] = useState<Record<string, string[]>>({});
  const [activeReactionPopId, setActiveReactionPopId] = useState<string | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  // Aura interactive video call & soundbath streams states
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isLocalVideoSwapped, setIsLocalVideoSwapped] = useState(false);
  const [isSoundBathPlaying, setIsSoundBathPlaying] = useState(false);
  const [activeSessionTimer, setActiveSessionTimer] = useState(0);
  const [heartCoherence, setHeartCoherence] = useState(94);
  const [videoCallGuidance, setVideoCallGuidance] = useState("Establishing secure holographic link...");

  // Aura immersive audio call states
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [audioCallGuidance, setAudioCallGuidance] = useState("Establishing secure voice alignment...");
  const [isMicAccessGranted, setIsMicAccessGranted] = useState(false);

  // Sound bath & alignment settings states
  const [showSettings, setShowSettings] = useState(false);
  const [solfeggioFreq, setSolfeggioFreq] = useState<number>(528);
  const [soundVolume, setSoundVolume] = useState<number>(40);
  const [breathingPace, setBreathingPace] = useState<'normal' | 'slow' | 'fast'>('normal');
  const [auraOpacity, setAuraOpacity] = useState<number>(18);
  const [showGuidanceTips, setShowGuidanceTips] = useState<boolean>(true);
  const [localMessages, setLocalMessages] = useState<Message[]>(conversation.messages);

  const [chatWallpaper, setChatWallpaper] = useState<string>(() => {
    return localStorage.getItem(`chat_wallpaper_${conversation.id}`) || 'default';
  });

  const [chatWallpaperBlur, setChatWallpaperBlur] = useState<number>(() => {
    return Number(localStorage.getItem(`chat_wallpaper_blur_${conversation.id}`)) || 0;
  });

  const [chatWallpaperDim, setChatWallpaperDim] = useState<number>(() => {
    const saved = localStorage.getItem(`chat_wallpaper_dim_${conversation.id}`);
    if (saved !== null) return Number(saved);
    const currWall = localStorage.getItem(`chat_wallpaper_${conversation.id}`) || 'default';
    return (currWall.startsWith('pic_') || currWall.startsWith('http') || currWall.startsWith('data:')) ? 25 : 0;
  });

  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);

  useEffect(() => {
    setLocalMessages(conversation.messages);
    const savedWallpaper = localStorage.getItem(`chat_wallpaper_${conversation.id}`) || 'default';
    setChatWallpaper(savedWallpaper);
    setChatWallpaperBlur(Number(localStorage.getItem(`chat_wallpaper_blur_${conversation.id}`)) || 0);
    const savedDim = localStorage.getItem(`chat_wallpaper_dim_${conversation.id}`);
    if (savedDim !== null) {
      setChatWallpaperDim(Number(savedDim));
    } else {
      setChatWallpaperDim((savedWallpaper.startsWith('pic_') || savedWallpaper.startsWith('http') || savedWallpaper.startsWith('data:')) ? 25 : 0);
    }
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    if (showVideoCall && isVideoEnabled && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [showVideoCall, isVideoEnabled, isLocalVideoSwapped]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const soundBathTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Note Recording Refs & Simulated Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSynthAudioNodesRef = useRef<{ oscs: OscillatorNode[]; gain: GainNode } | null>(null);

  // Dynamic message delivery ticks tracker (WhatsApp read receipts effect)
  useEffect(() => {
    const lastMsg = localMessages[localMessages.length - 1];
    if (lastMsg && lastMsg.isUser && !messageStatuses[lastMsg.id]) {
      const msgId = lastMsg.id;
      setMessageStatuses(prev => ({ ...prev, [msgId]: 'sent' }));

      const deliverTimer = setTimeout(() => {
        setMessageStatuses(prev => ({ ...prev, [msgId]: 'delivered' }));
      }, 700);

      const readTimer = setTimeout(() => {
        setMessageStatuses(prev => ({ ...prev, [msgId]: 'read' }));
      }, 1600);

      return () => {
        clearTimeout(deliverTimer);
        clearTimeout(readTimer);
      };
    }
  }, [localMessages]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      stopSyntheticVocalHarmony();
    };
  }, []);

  const playSyntheticVocalHarmony = (msgId: string, durationSeconds: number) => {
    try {
      if (playingAudioId === msgId) {
        stopSyntheticVocalHarmony();
        return;
      }

      stopSyntheticVocalHarmony();
      setPlayingAudioId(msgId);
      setAudioProgress(prev => ({ ...prev, [msgId]: 0 }));

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime((soundVolume / 100) * 0.15, ctx.currentTime);
      mainGain.connect(ctx.destination);

      const baseFreq = solfeggioFreq;
      const ratios = [1, 1.2, 1.5, 1.8]; // Triad chord frequencies
      const oscs: OscillatorNode[] = [];

      ratios.forEach((ratio, index) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, ctx.currentTime);
        
        // Pitch vibrato/tremolo to enrich the aura voice note play
        if (index > 0) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 1.8 + index * 0.4;
          lfoGain.gain.value = 5;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start();
          oscs.push(lfo);
        }

        osc.connect(mainGain);
        osc.start();
        oscs.push(osc);
      });

      activeSynthAudioNodesRef.current = { oscs, gain: mainGain };

      const stepsCount = durationSeconds * 10;
      let currentStep = 0;
      const progressTimer = setInterval(() => {
        currentStep++;
        const pct = Math.min(100, (currentStep / stepsCount) * 100);
        setAudioProgress(prev => ({ ...prev, [msgId]: pct }));

        if (currentStep >= stepsCount) {
          clearInterval(progressTimer);
          stopSyntheticVocalHarmony();
        }
      }, 100);

      (progressTimer as any).msgId = msgId;
      (mainGain as any).timerId = progressTimer;

    } catch (err) {
      console.error("Vocal synthesis playback failed:", err);
    }
  };

  const stopSyntheticVocalHarmony = () => {
    if (activeSynthAudioNodesRef.current) {
      const { oscs, gain } = activeSynthAudioNodesRef.current;
      oscs.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if ((gain as any).timerId) {
        clearInterval((gain as any).timerId);
      }
      activeSynthAudioNodesRef.current = null;
    }
    setPlayingAudioId(null);
  };

  const stopWebcamAndMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setIsVideoEnabled(false);
  };

  const toggleSoundBath = () => {
    if (isSoundBathPlaying) {
      if (droneOscRef.current) {
        try { droneOscRef.current.stop(); } catch (e) {}
        droneOscRef.current = null;
      }
      if (soundBathTimerRef.current) {
        clearInterval(soundBathTimerRef.current);
        soundBathTimerRef.current = null;
      }
      setIsSoundBathPlaying(false);
    } else {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const droneOsc = ctx.createOscillator();
        const droneGain = ctx.createGain();
        droneOsc.type = 'triangle';
        // Base drone corresponds to deep sub-harmonic of solfeggio focus frequency
        droneOsc.frequency.setValueAtTime(solfeggioFreq / 4, ctx.currentTime);
        // Base drone gain responds to customized soundVolume settings
        droneGain.gain.setValueAtTime((soundVolume / 100) * 0.12, ctx.currentTime);
        droneOsc.connect(droneGain);
        droneGain.connect(ctx.destination);
        droneOsc.start();
        droneOscRef.current = droneOsc;
        droneGainRef.current = droneGain;

        const triggerBell = () => {
          const bellOsc = ctx.createOscillator();
          const bellGain = ctx.createGain();
          bellOsc.type = 'sine';
          const freqs = [solfeggioFreq * 0.5, solfeggioFreq, solfeggioFreq * 1.5, solfeggioFreq * 2];
          const chosenFreq = freqs[Math.floor(Math.random() * freqs.length)];
          bellOsc.frequency.setValueAtTime(chosenFreq, ctx.currentTime);
          
          bellGain.gain.setValueAtTime((soundVolume / 100) * 0.16, ctx.currentTime);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);
          
          bellOsc.connect(bellGain);
          bellGain.connect(ctx.destination);
          bellOsc.start();
          bellOsc.stop(ctx.currentTime + 3.5);
        };

        triggerBell();
        soundBathTimerRef.current = setInterval(triggerBell, 4500);
        setIsSoundBathPlaying(true);
      } catch (err) {
        console.error("Web Audio Sound Bath error:", err);
      }
    }
  };

  // Smooth live parameter transition during active audio session
  useEffect(() => {
    if (isSoundBathPlaying && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (droneOscRef.current) {
        droneOscRef.current.frequency.setTargetAtTime(solfeggioFreq / 4, ctx.currentTime, 0.4);
      }
      if (droneGainRef.current) {
        droneGainRef.current.gain.setTargetAtTime((soundVolume / 100) * 0.12, ctx.currentTime, 0.3);
      }
    }
  }, [solfeggioFreq, soundVolume, isSoundBathPlaying]);

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      stopWebcamAndMic();
    } else {
      try {
        setVideoCallGuidance("Accessing video sensor feed...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        // Apply to standard local video tag inside the modal next tick
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }, 150);
        setIsVideoEnabled(true);
        setVideoCallGuidance("Secure video uplink active.");
      } catch (err) {
        console.warn("Camera access denied or unavailable. Fallback to Aura Avatar active.", err);
        setVideoCallGuidance("Video device un-acquired. Immersive Aura Presence activated.");
        setIsVideoEnabled(false);
      }
    }
  };

  const handleLeaveCall = () => {
    stopWebcamAndMic();
    if (isSoundBathPlaying) {
      toggleSoundBath();
    }
    setIsLocalVideoSwapped(false);
    setShowVideoCall(false);
  };

  const startAudioCall = async () => {
    setShowAudioCall(true);
    setAudioCallGuidance("Accessing audio stream...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      localStreamRef.current = stream;
      setIsMicAccessGranted(true);
      setAudioCallGuidance("Secure vocal link established. Enjoy the resonance.");
    } catch (err) {
      console.warn("Microphone access denied or unavailable. Fallback to Aura Avatar active.", err);
      setAudioCallGuidance("Vocal access un-acquired. Immersive Aura Voice link enabled.");
      setIsMicAccessGranted(false);
    }
  };

  const handleLeaveAudioCall = () => {
    stopWebcamAndMic();
    if (isSoundBathPlaying) {
      toggleSoundBath();
    }
    setShowAudioCall(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showVideoCall || showAudioCall) {
      setHeartCoherence(Math.floor(Math.random() * 8 + 92));
      interval = setInterval(() => {
        setActiveSessionTimer(prev => prev + 1);
        setHeartCoherence(prev => {
          const delta = Math.floor(Math.random() * 5) - 2;
          return Math.max(85, Math.min(100, prev + delta));
        });
      }, 1000);
    } else {
      setActiveSessionTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showVideoCall, showAudioCall]);

  useEffect(() => {
    if (!showVideoCall && !showAudioCall) return;
    const tips = [
      "Julian suggests: Breath deep, matches the light ripple.",
      "Aura sync: Softening shoulders, centering attention.",
      "Coherence feedback: Heart rate variability is stabilizing.",
      "Bio-presence aligned. Sound bath gongs supporting your rhythm.",
      "Sanctuary focus: Letting pass transient cognitive loops.",
    ];
    let tipIdx = 0;
    const interval = setInterval(() => {
      if (showVideoCall) {
        setVideoCallGuidance(tips[tipIdx % tips.length]);
      } else if (showAudioCall) {
        setAudioCallGuidance(tips[tipIdx % tips.length]);
      }
      tipIdx++;
    }, 6000);
    return () => {
      clearInterval(interval);
    };
  }, [showVideoCall, showAudioCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (soundBathTimerRef.current) {
        clearInterval(soundBathTimerRef.current);
      }
      if (droneOscRef.current) {
        try { droneOscRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const handlePhotoUploadClick = () => {
    setShowAddOptions(false);
    photoInputRef.current?.click();
  };

  const handleDocumentUploadClick = () => {
    setShowAddOptions(false);
    documentInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        onSendMessage(`📷 Sent photo: ${file.name}`, {
          type: 'photo',
          url,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onSendMessage(`📄 Attached document: ${file.name}`, {
      type: 'document',
      url,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    });
    e.target.value = '';
  };

  // Breathing circle simulation inside the journaling overlay
  useEffect(() => {
    if (!showReflectionModal) return;

    let interval: NodeJS.Timeout;
    const paceTiming = {
      fast: { growStep: 0.08, shrinkStep: 0.08, holdTime: 1000, totalTime: 4500 },
      normal: { growStep: 0.05, shrinkStep: 0.05, holdTime: 1500, totalTime: 7000 },
      slow: { growStep: 0.03, shrinkStep: 0.03, holdTime: 2000, totalTime: 10000 }
    }[breathingPace];

    const cycle = () => {
      setIsBreathingState('In');
      // Grow
      let scale = 1.0;
      const growTimer = setInterval(() => {
        scale += paceTiming.growStep;
        if (scale >= 1.4) {
          clearInterval(growTimer);
          setIsBreathingState('Hold');
          setTimeout(() => {
            setIsBreathingState('Out');
            // Shrink
            const shrinkTimer = setInterval(() => {
              scale -= paceTiming.shrinkStep;
              if (scale <= 1.0) {
                clearInterval(shrinkTimer);
                setIsBreathingState('Pause');
              }
              setBreathingProgress(scale);
            }, 100);
          }, paceTiming.holdTime);
        }
        setBreathingProgress(scale);
      }, 100);
    };

    cycle();
    interval = setInterval(cycle, paceTiming.totalTime);

    return () => {
      clearInterval(interval);
    };
  }, [showReflectionModal, breathingPace]);

  const simulateOtherSideTypingAndReplying = () => {
    setTimeout(() => {
      setIsContactTyping(true);
      
      setTimeout(() => {
        setIsContactTyping(false);
        
        const responses = conversation.id === 'julian_m' 
          ? [
              "I completely resonate with that. Intention is the anchor that centers us through the daily hustle.",
              "Excellent observation. Have you tried doing a quick 4-7-8 breathing pacing session right now?",
              "Grounded energy is contagious. Taking this mindful pause creates a sanctuary of true focus.",
              "Let's embrace the pace. One mindful step, one conscious inhalation at a time.",
              "Stillness is the presence of clarity. I am noting down your reflection in our alignment sanctuary."
            ]
          : [
              "Vibrational harmony detected. Your biometric bio-pulse flows are stabilizing beautifully.",
              "Aura pulse frequency aligning to 528Hz. Keep breathing smoothly and deeply.",
              "I am sending an aura of pure tranquility, warm light, and centered mindfulness your way! ❤️",
              "Biometric resonance is optimal right now. Continue matching the golden light breathing expander.",
              "Let go of transient thoughts. Keep steady stillness in the heart."
            ];
            
        const chosenText = responses[Math.floor(Math.random() * responses.length)];
        
        const replyId = `msg_reply_${Date.now()}`;
        const replyMsg: Message = {
          id: replyId,
          senderId: conversation.id,
          senderName: conversation.name,
          senderAvatar: conversation.avatar,
          text: chosenText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isUser: false,
          isItalic: false
        };
        
        setLocalMessages(prev => [...prev, replyMsg]);
      }, 2200);
    }, 800);
  };

  const startVoiceRecording = async () => {
    try {
      if (playingAudioId) stopSyntheticVocalHarmony();
      
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((e) => {
        throw new Error("Microphone permission denied or sandboxed");
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordingBlobUrl(audioUrl);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("MediaRecorder failed, triggering high-fidelity simulation fallback:", err);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordingBlobUrl(null);
  };

  const sendVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    
    const finalizeVoiceMessage = (url: string | null) => {
      const mins = Math.floor(recordingSeconds / 60);
      const secs = String(recordingSeconds % 60).padStart(2, '0');
      const formattedDuration = `${mins}:${secs}`;
      const textVal = `🎤 Voice Message (${formattedDuration})`;
      
      onSendMessage(textVal, {
        type: 'document',
        url: url || `simulated_voice_auras_${Date.now()}`,
        name: `VoiceNote_${Date.now()}.wav`,
        size: `${(recordingSeconds * 12.4).toFixed(1)} KB`
      });
      
      setIsRecording(false);
      setRecordingSeconds(0);
      setRecordingBlobUrl(null);
      
      simulateOtherSideTypingAndReplying();
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          try {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          } catch (e) {}
        }
        finalizeVoiceMessage(audioUrl);
      };
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        finalizeVoiceMessage(null);
      }
    } else {
      finalizeVoiceMessage(null);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    let messageText = inputText;
    
    if (replyToMsg) {
      messageText = `[Quote: ${replyToMsg.senderName}: ${replyToMsg.text}] ${inputText}`;
      setReplyToMsg(null);
    }
    
    onSendMessage(messageText);
    setInputText('');
    
    simulateOtherSideTypingAndReplying();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const activeReflectionPrompt = `"In the midst of movement and chaos, keep stillness inside of you." What is one area of your life where you'd like to invite more stillness today?`;

  const getWallpaperClassOrStyle = (key: string) => {
    const isCustomUrl = key.startsWith('http') || key.startsWith('data:');
    
    if (isCustomUrl) {
      return {
        className: "bg-surface-container-low relative bg-cover bg-center bg-no-repeat",
        style: {
          backgroundImage: `url("${key}")`
        }
      };
    }
    
    if (key.startsWith('pic_')) {
      let url = '';
      if (key === 'pic_mist') url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
      else if (key === 'pic_clouds') url = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=80';
      else if (key === 'pic_stars') url = 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80';
      else if (key === 'pic_forest') url = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80';
      
      return {
        className: "bg-surface-container-low relative bg-cover bg-center bg-no-repeat",
        style: {
          backgroundImage: `url("${url}")`
        }
      };
    }

    switch (key) {
      case 'sage':
        return {
          className: "bg-[#e2e8e4] dark:bg-[#121915] relative",
          style: {
            backgroundImage: `radial-gradient(#9cb5a3 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }
        };
      case 'cosmic':
        return {
          className: "bg-gradient-to-b from-[#0c0a1a] via-[#060714] to-[#010103] text-stone-100 relative",
          style: {
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 1px, transparent 1px),
              radial-gradient(circle at 75% 40%, rgba(255,255,255,0.06) 1.5px, transparent 1.5px),
              radial-gradient(circle at 40% 80%, rgba(255,255,255,0.05) 1.2px, transparent 1.2px)
            `,
            backgroundSize: '240px 240px, 320px 320px, 200px 200px'
          }
        };
      case 'gold':
        return {
          className: "bg-gradient-to-tr from-[#faf5e5] to-[#f2dfb5] dark:from-[#1f1d16] dark:to-[#14120c] relative",
          style: {
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(212,163,89,0.12) 0%, transparent 70%)`
          }
        };
      case 'lavender':
        return {
          className: "bg-[#ecedf6] dark:bg-[#111018] relative",
          style: {
            backgroundImage: `
              radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.08) 0%, transparent 60%),
              radial-gradient(circle at 10% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)
            `
          }
        };
      case 'whatsapp':
        return {
          className: "bg-[#f2efe4] dark:bg-[#070d12] relative",
          style: {
            backgroundImage: `
              radial-gradient(#d8d2be 12%, transparent 12%),
              radial-gradient(#d8d2be 12%, transparent 12%)
            `,
            backgroundPosition: '0 0, 8px 8px',
            backgroundSize: '16px 16px'
          }
        };
      case 'teal':
        return {
          className: "bg-[#e1efef] dark:bg-[#0a1212] relative",
          style: {
            backgroundImage: `
              linear-gradient(45deg, rgba(20, 184, 166, 0.03) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(20, 184, 166, 0.03) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(20, 184, 166, 0.03) 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px'
          }
        };
      default:
        return {
          className: "bg-transparent",
          style: {}
        };
    }
  };

  const handleWallpaperChange = (key: string) => {
    setChatWallpaper(key);
    localStorage.setItem(`chat_wallpaper_${conversation.id}`, key);
    
    // Auto-on shadow overlay for image backgrounds to make sure contrasts are maintained instantly
    const isImage = key.startsWith('pic_') || key.startsWith('http') || key.startsWith('data:');
    if (isImage) {
      const currentDim = localStorage.getItem(`chat_wallpaper_dim_${conversation.id}`);
      if (!currentDim) {
        setChatWallpaperDim(25);
        localStorage.setItem(`chat_wallpaper_dim_${conversation.id}`, '25');
      }
    }
  };

  const handleWallpaperBlurChange = (val: number) => {
    setChatWallpaperBlur(val);
    localStorage.setItem(`chat_wallpaper_blur_${conversation.id}`, String(val));
  };

  const handleWallpaperDimChange = (val: number) => {
    setChatWallpaperDim(val);
    localStorage.setItem(`chat_wallpaper_dim_${conversation.id}`, String(val));
  };

  const handleWallpaperFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          handleWallpaperChange(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    const newRef: Reflection = {
      id: `ref_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      prompt: activeReflectionPrompt,
      response: reflectionText
    };
    onSaveReflection(newRef);
    setReflectionText('');
    setShowReflectionModal(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in relative" id="chat-conversation-canvas">
      {/* Top Header App Bar */}
      <header className="flex items-center justify-between py-4 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container-low rounded-full transition-colors"
            id="back-button-chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              {conversation.avatar ? (
                <img
                  alt={conversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                  src={conversation.avatar}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-bold text-sm">
                  {conversation.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              {conversation.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-surface rounded-full"></span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="font-headline font-bold text-base text-primary leading-tight">{conversation.name}</h1>
              <span className={`text-[10px] uppercase tracking-widest font-label ${isContactTyping ? 'text-primary font-bold animate-pulse' : 'text-on-surface-variant'}`}>
                {isContactTyping ? 'typing...' : (conversation.subLabel || (conversation.online ? 'Online' : 'Offline'))}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button 
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery('');
            }}
            className={`hover:opacity-80 transition-all p-2 rounded-full hover:bg-surface-container-low text-primary relative flex items-center justify-center cursor-pointer ${showSearch ? 'bg-primary/15' : ''}`}
            title="Search Messages"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={startAudioCall}
            className="hover:opacity-80 transition-all p-2 rounded-full hover:bg-surface-container-low text-primary relative flex items-center justify-center cursor-pointer"
            title="Start Mindful Audio Call"
          >
            <Phone className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
          </button>
          <button 
            onClick={() => {
              setShowVideoCall(true);
              setVideoCallGuidance("Syncing holographic presence...");
            }}
            className="hover:opacity-80 transition-all p-2 rounded-full hover:bg-surface-container-low text-primary relative flex items-center justify-center cursor-pointer"
            title="Start Immersive Presence Call"
          >
            <Video className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`hover:opacity-80 transition-all p-2 rounded-full relative ${showSettings ? 'bg-primary/10 text-primary scale-105' : 'hover:bg-surface-container-low'}`}
            title="Mindful Alignment Settings"
            id="chat-settings-button"
          >
            <MoreVertical className="w-5 h-5" />
            {showSettings && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* WhatsApp Message Search Bar slide-down */}
      {showSearch && (
        <div className="flex items-center gap-2 p-3 bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline-variant/10 mt-2 animate-fade-in z-10 transition-all">
          <Search className="w-4 h-4 text-outline ml-2 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within this tranquility alignment chat..."
            className="flex-grow bg-transparent border-none text-xs text-on-surface placeholder:text-outline/50 outline-none p-1 focus:ring-0"
            id="chat-message-search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 text-outline hover:text-primary transition-colors font-semibold text-xs"
            >
              Clear
            </button>
          )}
          <button 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="text-primary hover:text-primary-variant font-mono font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-xl hover:bg-surface-container-high shrink-0 transition-all"
          >
            Close
          </button>
        </div>
      )}

      {/* Alignment Settings Floating Menu Dropdown */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-surface-container-high/95 backdrop-blur-3xl border border-outline-variant/25 rounded-3xl shadow-2xl p-5 z-40 text-on-surface space-y-4 animate-fade-in" id="chat-settings-dropdown">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-mono font-bold uppercase tracking-wider text-xs text-primary">Mindful Alignment Settings</span>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-outline hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Solfeggio Focus Frequency Option */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-on-surface-variant font-semibold">Resonance Frequency</span>
              <span className="text-primary font-bold">{solfeggioFreq} Hz</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/15">
              {[432, 528, 639].map(freq => (
                <button
                  key={freq}
                  onClick={() => setSolfeggioFreq(freq)}
                  className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    solfeggioFreq === freq 
                      ? 'bg-primary text-on-primary shadow-sm' 
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {freq}Hz
                </button>
              ))}
            </div>
            <span className="text-[9px] text-outline block leading-tight">
              {solfeggioFreq === 432 && "432 Hz: Harmonic sub-frequencies to support somatic grounding and deep meditation."}
              {solfeggioFreq === 528 && "528 Hz: Solfeggio tone associated with cellular transformation and mindful renewal."}
              {solfeggioFreq === 639 && "639 Hz: Resonant sound waves aimed at fostering connection and emotional balance."}
            </span>
          </div>

          {/* Gongs Bath Volume slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-on-surface-variant font-semibold">Solfeggio Gongs Volume</span>
              <span className="text-on-surface font-bold">{soundVolume}%</span>
            </div>
            <div className="flex items-center gap-2.5 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/15">
              <VolumeX className="w-3.5 h-3.5 text-outline/60 shrink-0" />
              <input 
                type="range"
                min="0"
                max="100"
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                className="flex-grow h-1.5 bg-surface-container bg-gradient-to-r from-primary/30 to-primary accent-primary rounded-lg appearance-none cursor-pointer"
                id="gong-volume-slider"
              />
              <Volume2 className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
            </div>
          </div>

          {/* Journal breathing pacemaker pacing options */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-on-surface-variant font-semibold">Breathing companion speed</span>
              <span className="text-secondary font-bold capitalize">{breathingPace}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/15">
              {(['slow', 'normal', 'fast'] as const).map(pace => (
                <button
                  key={pace}
                  onClick={() => setBreathingPace(pace)}
                  className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    breathingPace === pace 
                      ? 'bg-secondary text-neutral-900 shadow-sm' 
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
            <span className="text-[9px] text-outline block leading-tight">
              {breathingPace === 'slow' && "Slow (10s Cosmic cycle): Advanced deep slow breathing for complete center alignment."}
              {breathingPace === 'normal' && "Normal (7s Standard cycle): Perfect rhythmic balance suited for focused journaling."}
              {breathingPace === 'fast' && "Fast (4.5s Focused Flow): Quick energizing breathing intervals to revitalize mindset."}
            </span>
          </div>

          {/* Coaching Guides Toggle */}
          <button 
            onClick={() => setShowGuidanceTips(!showGuidanceTips)}
            className="flex items-center justify-between w-full p-3 bg-surface-container-low rounded-2xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors text-left cursor-pointer"
          >
            <div className="pr-2 space-y-0.5">
              <span className="font-semibold block text-[10px] uppercase font-mono tracking-wider text-on-surface">Ambient Call Guides</span>
              <span className="text-[9px] text-outline leading-tight block">Prompts display during immersive wellness calls</span>
            </div>
            <div className={`w-8 h-5 rounded-full p-0.5 transition-colors shrink-0 ${showGuidanceTips ? 'bg-primary' : 'bg-surface-container-highest'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showGuidanceTips ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Chat Wallpaper Picker */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-on-surface-variant font-semibold">Chat Wallpaper</span>
              <span className="text-primary font-bold capitalize">
                {chatWallpaper === 'default' ? 'Default' : 
                 chatWallpaper.startsWith('pic_') ? chatWallpaper.replace('pic_', '') + ' ' :
                 chatWallpaper.startsWith('data:') ? 'Custom Upload 🖼️' :
                 chatWallpaper.startsWith('http') ? 'Custom URL 🌐' : 
                 chatWallpaper}
              </span>
            </div>
            
            {/* Presets Subsection Title */}
            <span className="text-[9px] uppercase font-mono tracking-widest text-outline block">Preset Textures & Aesthetics</span>
            <div className="grid grid-cols-4 gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/15" id="chat-wallpaper-grid">
              {/* Default transparent theme style */}
              <button
                onClick={() => handleWallpaperChange('default')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'default' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Default Clean Slate"
              >
                <div className="absolute inset-0 bg-surface dark:bg-zinc-900" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-outline text-left truncate w-full">Clean</span>
              </button>

              {/* Serene Sage */}
              <button
                onClick={() => handleWallpaperChange('sage')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'sage' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Serene Sage Theme"
              >
                <div className="absolute inset-0 bg-[#e2e8e4] dark:bg-[#121915]" style={{ backgroundImage: 'radial-gradient(#9cb5a3 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-green-800 dark:text-green-300 text-left truncate w-full">Sage</span>
              </button>

              {/* Cosmic Midnight */}
              <button
                onClick={() => handleWallpaperChange('cosmic')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'cosmic' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Cosmic Midnight Theme"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0c0a1a] to-[#010103] flex items-center justify-center">
                  <span className="text-[6px] text-stone-400 opacity-60">✨</span>
                </div>
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-stone-200 text-left truncate w-full">Cosmic</span>
              </button>

              {/* Solfeggio gold */}
              <button
                onClick={() => handleWallpaperChange('gold')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'gold' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Solfeggio Warm Golden Sun"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#faf5e5] to-[#f2dfb5] dark:from-[#1f1d16] dark:to-[#14120c]" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-amber-805 dark:text-amber-300 text-left truncate w-full">Gold</span>
              </button>

              {/* Zen Lavender */}
              <button
                onClick={() => handleWallpaperChange('lavender')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'lavender' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Zen Lavender Aura"
              >
                <div className="absolute inset-0 bg-[#ecedf6] dark:bg-[#111018]" style={{ backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)' }} />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-purple-800 dark:text-purple-300 text-left truncate w-full">Lavender</span>
              </button>

              {/* WhatsApp doodle pattern */}
              <button
                onClick={() => handleWallpaperChange('whatsapp')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'whatsapp' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Classic Tea Green Doodles"
              >
                <div className="absolute inset-0 bg-[#f2efe4] dark:bg-[#070d12]" style={{ backgroundImage: 'radial-gradient(#d8d2be 15%, transparent 15%)', backgroundSize: '8px 8px' }} />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-orange-800 dark:text-orange-300 text-left truncate w-full">Classic</span>
              </button>

              {/* Calming Teal */}
              <button
                onClick={() => handleWallpaperChange('teal')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'teal' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Mindful Teal Waves"
              >
                <div className="absolute inset-0 bg-[#e1efef] dark:bg-[#0a1212]" style={{ backgroundImage: 'linear-gradient(45deg, rgba(20, 184, 166, 0.05) 25%, transparent 25%)', backgroundSize: '10px 10px' }} />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-semibold text-teal-800 dark:text-teal-300 text-left truncate w-full">Teal</span>
              </button>
            </div>

            {/* Presets Scenics Title */}
            <span className="text-[9px] uppercase font-mono tracking-widest text-outline block pt-1">Preset Scenic Pictures</span>
            <div className="grid grid-cols-4 gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/15">
              {/* Preset Beach Scenic */}
              <button
                onClick={() => handleWallpaperChange('pic_mist')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'pic_mist' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Soothed Mist Beach"
              >
                <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=70" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-bold text-white text-left truncate w-full shadow-sm drop-shadow">Mist</span>
              </button>

              {/* Preset Clouds Scenic */}
              <button
                onClick={() => handleWallpaperChange('pic_clouds')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'pic_clouds' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Infinite Peace Clouds"
              >
                <img src="https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=120&q=70" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-bold text-white text-left truncate w-full shadow-sm drop-shadow">Clouds</span>
              </button>

              {/* Preset Nebula Scenic */}
              <button
                onClick={() => handleWallpaperChange('pic_stars')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'pic_stars' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Deep Space Stars"
              >
                <img src="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=120&q=70" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-bold text-white text-left truncate w-full shadow-sm drop-shadow">Stars</span>
              </button>

              {/* Preset Forest Scenic */}
              <button
                onClick={() => handleWallpaperChange('pic_forest')}
                className={`relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col justify-end p-1 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  chatWallpaper === 'pic_forest' ? 'border-primary shadow-md' : 'border-transparent hover:border-outline-variant'
                }`}
                title="Calming Canopy Forest"
              >
                <img src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=120&q=70" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-all" />
                <span className="relative z-10 text-[8px] font-mono leading-none tracking-tight font-bold text-white text-left truncate w-full shadow-sm drop-shadow">Forest</span>
              </button>
            </div>

            {/* Custom Image Actions Section */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => wallpaperInputRef.current?.click()}
                  className="flex-1 py-1.5 bg-surface-container-low hover:bg-surface-container-highest border border-outline-variant/20 rounded-xl text-[9px] font-mono font-bold tracking-wider text-on-surface-variant flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Upload className="w-3 h-3 text-primary" />
                  <span>Upload Pic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className={`flex-1 py-1.5 border border-outline-variant/20 rounded-xl text-[9px] font-mono font-bold tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    showCustomUrlInput ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <Link className="w-3 h-3 text-primary" />
                  <span>Paste URL</span>
                </button>
              </div>

              {/* Hidden file input for custom pictures */}
              <input 
                type="file"
                ref={wallpaperInputRef}
                onChange={handleWallpaperFileUpload}
                accept="image/*"
                className="hidden"
                id="hidden-wallpaper-file-input"
              />

              {/* Link Input area */}
              {showCustomUrlInput && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customWallpaperUrl.trim()) {
                      handleWallpaperChange(customWallpaperUrl.trim());
                      setCustomWallpaperUrl('');
                      setShowCustomUrlInput(false);
                    }
                  }}
                  className="flex gap-1.5 mt-1 animate-fade-in"
                >
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customWallpaperUrl}
                    onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                    className="flex-grow bg-surface-container-low border border-outline-variant/30 rounded-xl px-2.5 py-1 text-[10px] font-mono text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:border-primary"
                    id="chat-wallpaper-custom-url-field"
                    required
                  />
                  <button
                    type="submit"
                    className="px-2.5 bg-primary text-on-primary rounded-xl text-[9px] font-mono font-bold tracking-wider uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Set
                  </button>
                </form>
              )}
            </div>

            {/* Slider controls for dimming and blur */}
            <div className="space-y-2 pt-1.5 border-t border-outline-variant/10">
              {/* Blur Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-outline uppercase tracking-wider">
                  <span>Wallpaper Defocussed Blur</span>
                  <span className="font-semibold text-primary">{chatWallpaperBlur}px</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/10">
                  <Sliders className="w-3 h-3 text-outline/50" />
                  <input 
                    type="range"
                    min="0"
                    max="16"
                    step="1"
                    value={chatWallpaperBlur}
                    onChange={(e) => handleWallpaperBlurChange(Number(e.target.value))}
                    className="flex-grow h-1.5 bg-surface-container bg-gradient-to-r from-primary/20 to-primary accent-primary rounded-lg appearance-none cursor-pointer animate-none"
                    id="wallpaper-blur-slider"
                  />
                </div>
              </div>

              {/* Dim opacity overlay color level */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-outline uppercase tracking-wider">
                  <span>Wallpaper Tint / Contrast Dim</span>
                  <span className="font-semibold text-primary">{chatWallpaperDim}%</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/10">
                  <Sliders className="w-3 h-3 text-outline/50" />
                  <input 
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={chatWallpaperDim}
                    onChange={(e) => handleWallpaperDimChange(Number(e.target.value))}
                    className="flex-grow h-1.5 bg-surface-container bg-gradient-to-r from-primary/20 to-primary accent-primary rounded-lg appearance-none cursor-pointer animate-none"
                    id="wallpaper-dim-slider"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant/10 w-full" />

          {/* Action trigger clear message list */}
          <div className="pt-1 flex gap-2">
            <button 
              onClick={() => {
                setLocalMessages([
                  {
                    id: 'alignment-reset-' + Date.now(),
                    senderId: 'system',
                    senderName: 'System Resonator',
                    text: `Tranquility alignment has been gracefully reset. The safe-space is cleared for your next mindful session, ${userName}.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timeLabel: 'Just now',
                    isUser: false,
                    isItalic: true
                  }
                ]);
                setShowSettings(false);
              }}
              className="flex-grow py-2.5 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.99] border border-red-500/30 rounded-2xl text-red-500 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
              id="reset-alignment-history-button"
            >
              <Activity className="w-3.5 h-3.5 text-red-500" />
              <span>Reset Chat Alignment</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Canvas Wrapper with independent background layer */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {/* Background panel */}
        <div 
          className={`absolute inset-0 transition-all duration-300 pointer-events-none ${getWallpaperClassOrStyle(chatWallpaper).className}`}
          style={{
            ...getWallpaperClassOrStyle(chatWallpaper).style,
            filter: `blur(${chatWallpaperBlur}px) scale(${chatWallpaperBlur > 0 ? 1.05 : 1})`,
          }}
          id="chat-messages-background-panel"
        />
        {/* Color Contrast / Tint Overlay (Dark Overlay) */}
        <div 
          className="absolute inset-0 bg-stone-900 pointer-events-none transition-all duration-300 z-[1]" 
          style={{ opacity: chatWallpaperDim / 100 }} 
          id="chat-messages-brightness-overlay"
        />

        {/* Scrollable messages container */}
        <div 
          className="flex-grow overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar scroll-smooth relative z-10"
          id="chat-messages-scroll-area"
        >
        {/* Date indication */}
        <div className="flex justify-center">
          <span className="text-[10px] text-outline uppercase tracking-widest font-label bg-surface-container px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {/* Dynamic messages stack with WhatsApp features */}
        {(() => {
          const filteredMessages = searchQuery
            ? localMessages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
            : localMessages;

          if (filteredMessages.length === 0 && searchQuery) {
            return (
              <div className="text-center py-10 space-y-2 animate-fade-in">
                <Search className="w-8 h-8 text-outline mx-auto opacity-55" />
                <p className="text-xs text-outline font-mono">No matching peaceful messages found.</p>
              </div>
            );
          }

          return filteredMessages.map((msg, index) => {
            const isUser = msg.isUser;
            
            // Parse reply quote format if existing
            const parsed = msg.text.startsWith('[Quote: ')
              ? (() => {
                  const match = msg.text.match(/^\[Quote:\s*([^:]+):\s*([^\]]+)\]\s*(.*)$/);
                  return match 
                    ? { hasQuote: true, sender: match[1], quoteText: match[2], actualText: match[3] } 
                    : { hasQuote: false, sender: '', quoteText: '', actualText: msg.text };
                })()
              : { hasQuote: false, sender: '', quoteText: '', actualText: msg.text };

            // Check if Voice Note Message
            const isVoiceNote = parsed.actualText.startsWith('🎤 Voice Message') || (msg.attachment?.name && msg.attachment.name.endsWith('.wav'));
            
            // Extract Duration for custom playback timer
            let voiceDurationSeconds = 6;
            if (isVoiceNote) {
              const matches = parsed.actualText.match(/\((\d+):(\d+)\)/);
              if (matches) {
                voiceDurationSeconds = parseInt(matches[1], 10) * 60 + parseInt(matches[2], 10);
              }
            }

            const activeProgressPercentage = audioProgress[msg.id] || 0;
            const isThisAudioPlaying = playingAudioId === msg.id;

            return (
              <div key={msg.id || index} className="space-y-1 animate-fade-in relative group/bubble-row">
                {/* Float Actions overlay on hover (Repyl & React links) */}
                <div className={`absolute top-0 opacity-0 group-hover/bubble-row:opacity-100 transition-opacity flex items-center gap-1.5 z-20 ${isUser ? 'left-4' : 'right-4'}`}>
                  <button 
                    onClick={() => setActiveReactionPopId(activeReactionPopId === msg.id ? null : msg.id)}
                    className="w-7 h-7 bg-surface-container-high hover:bg-primary/20 hover:text-primary rounded-full flex items-center justify-center text-outline shadow-md transition-all active:scale-95"
                    title="Add reaction emoji"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setReplyToMsg(msg)}
                    className="w-7 h-7 bg-surface-container-high hover:bg-primary/20 hover:text-primary rounded-full flex items-center justify-center text-outline shadow-md transition-all active:scale-95"
                    title="Reply to message"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Hover Emoji reactions selection drawer */}
                {activeReactionPopId === msg.id && (
                  <div className={`absolute bottom-full mb-1 bg-surface-container-highest border border-outline-variant/30 px-2 py-1.5 rounded-full flex gap-1 z-30 shadow-xl animate-fade-in ${isUser ? 'right-10' : 'left-10'}`}>
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMsgReactions(prev => {
                            const list = prev[msg.id] ? [...prev[msg.id]] : [];
                            if (list.includes(emoji)) {
                              return { ...prev, [msg.id]: list.filter(e => e !== emoji) };
                            } else {
                              return { ...prev, [msg.id]: [...list, emoji] };
                            }
                          });
                          setActiveReactionPopId(null);
                        }}
                        className="w-7 h-7 hover:bg-white/10 rounded-full flex items-center justify-center text-sm transform hover:scale-125 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl shadow-[0_4px_30px_rgba(85,98,77,0.02)] border relative ${
                    isUser 
                      ? 'bg-primary text-on-primary border-primary rounded-tr-none' 
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 rounded-tl-none'
                  }`}>
                    {/* Render Reply quote card inside bubble if matched */}
                    {parsed.hasQuote && (
                      <div className={`border-l-4 p-2.5 rounded-r-xl rounded-l-md text-xs mb-3 text-left opacity-90 ${
                        isUser 
                          ? 'bg-black/15 border-secondary text-stone-200' 
                          : 'bg-surface-container-high border-primary text-on-surface'
                      }`}>
                        <p className="font-bold font-mono text-[9px] uppercase tracking-wider opacity-90">{parsed.sender}</p>
                        <p className="line-clamp-2 mt-0.5 italic opacity-85">{parsed.quoteText}</p>
                      </div>
                    )}

                    {/* Message Attachment Rendering */}
                    {msg.attachment && !isVoiceNote && (
                      <div className="mb-2.5 rounded-xl overflow-hidden max-w-sm">
                        {msg.attachment.type === 'photo' && (
                          <div className="relative rounded-lg overflow-hidden border border-outline-variant/10 bg-black/5">
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name || "Attached Photo"} 
                              className="w-full h-auto max-h-56 object-cover rounded-lg hover:scale-[1.02] transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {msg.attachment.type === 'gif' && (
                          <div className="relative rounded-lg overflow-hidden border border-outline-variant/10 bg-black/5">
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name || "Attached GIF"} 
                              className="w-full h-auto max-h-56 object-cover rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {msg.attachment.type === 'document' && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl border border-outline-variant/10 ${
                            isUser ? 'bg-black/10' : 'bg-surface-container-high/40'
                          }`}>
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-grow min-w-0 text-left">
                              <p className="text-xs font-semibold truncate text-on-surface">
                                {msg.attachment.name || 'document.pdf'}
                              </p>
                              <span className="text-[10px] text-outline">
                                {msg.attachment.size || '1.2 MB'}
                              </span>
                            </div>
                            <a 
                              href={msg.attachment.url}
                              download={msg.attachment.name || 'document'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 px-2.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-on-primary text-[10px] uppercase tracking-widest font-bold text-primary transition-all shrink-0 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Render Content */}
                    {isVoiceNote ? (
                      /* Upgraded Voice Note Message Layout */
                      <div className="flex items-center gap-3 min-w-[240px] py-1.5" id={`audio-player-id-${msg.id}`}>
                        <button
                          onClick={() => playSyntheticVocalHarmony(msg.id, voiceDurationSeconds)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isUser 
                              ? 'bg-secondary text-neutral-900 shadow-md hover:scale-105' 
                              : 'bg-primary text-on-primary hover:scale-105'
                          }`}
                        >
                          {isThisAudioPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        
                        {/* Audio Progress Line Track */}
                        <div className="flex-grow flex flex-col justify-center text-left">
                          <span className="text-[10px] uppercase font-mono tracking-widest opacity-80 mb-1">
                            {isUser ? 'Sent Mindful Audio' : 'Aura Resonance Memo'}
                          </span>
                          <div className="relative h-1 w-full bg-white/20 rounded-full mb-1 overflow-hidden">
                            <div 
                              className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-100 ${
                                isUser ? 'bg-secondary' : 'bg-primary'
                              }`}
                              style={{ width: `${activeProgressPercentage}%` }}
                            />
                          </div>
                          
                          {/* Animated Voice Audio Waves */}
                          <div className="flex gap-0.5 items-end justify-start h-3.5 opacity-80 mt-1">
                            {[12, 18, 10, 24, 8, 14, 28, 18, 12, 22, 10, 16, 26, 8, 14].map((h, i) => {
                              // If this specific segment was "passed" by playhead progress
                              const segmentFraction = (i / 15) * 100;
                              const isSoundPassed = activeProgressPercentage > segmentFraction;

                              return (
                                <span 
                                  key={i} 
                                  className={`w-0.5 rounded-full transition-all duration-300 ${isThisAudioPlaying ? 'animate-pulse' : ''} ${
                                    isSoundPassed 
                                      ? (isUser ? 'bg-secondary' : 'bg-primary') 
                                      : 'bg-white/35 dark:bg-stone-500'
                                  }`}
                                  style={{
                                    height: `${h}%`,
                                    animationDelay: `${i * 35}ms`
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Audio Call Duration */}
                        <div className="text-[10px] font-mono shrink-0 select-none flex items-center justify-center pt-2">
                          {isThisAudioPlaying 
                            ? `${Math.floor((voiceDurationSeconds * (activeProgressPercentage / 100)) / 60)}:${String(Math.floor((voiceDurationSeconds * (activeProgressPercentage / 100)) % 60)).padStart(2, '0')}`
                            : `${Math.floor(voiceDurationSeconds / 60)}:${String(voiceDurationSeconds % 60).padStart(2, '0')}`
                          }
                        </div>
                      </div>
                    ) : (
                      /* General Text Message */
                      <p className={`text-sm leading-relaxed ${msg.isItalic ? 'italic' : ''}`} id={`msg-text-${msg.id}`}>
                        {parsed.actualText}
                      </p>
                    )}

                    {/* Reactions Pill Display on Bubble */}
                    {msgReactions[msg.id] && msgReactions[msg.id].length > 0 && (
                      <div className={`absolute -bottom-2 flex items-center gap-1 bg-surface border border-outline-variant/30 rounded-full py-0.5 px-2 text-xs shadow-md z-15 ${isUser ? 'right-4' : 'left-4'}`}>
                        {Array.from(new Set(msgReactions[msg.id])).map((emoji, idx) => (
                          <span key={idx} className="scale-110">{emoji}</span>
                        ))}
                        {msgReactions[msg.id].length > 1 && (
                          <span className="text-[9px] font-mono font-bold opacity-75 ml-0.5">{msgReactions[msg.id].length}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub Timestamp & Read receipts checks ticks footer */}
                <div className={`flex items-center gap-1.5 text-[10px] text-outline font-label mt-0.5 select-none ${isUser ? 'justify-end mr-2' : 'justify-start ml-2'}`}>
                  <span>{msg.timeLabel}</span>
                  {isUser && (
                    <span className="flex items-center">
                      {(messageStatuses[msg.id] === 'sent') && (
                        <Check className="w-3.5 h-3.5 text-outline/50" />
                      )}
                      {(messageStatuses[msg.id] === 'delivered') && (
                        <CheckCheck className="w-3.5 h-3.5 text-outline/50" />
                      )}
                      {(messageStatuses[msg.id] === 'read' || !messageStatuses[msg.id]) && (
                        <CheckCheck className="w-3.5 h-3.5 text-primary" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          });
        })()}

        {/* Animated Contact Typing Bubble */}
        {isContactTyping && (
          <div className="flex justify-start space-y-1 animate-fade-in" id="typing-indicator-bubble">
            <div className="flex items-center gap-2">
              <div className="relative">
                {conversation.avatar ? (
                  <img
                    alt={conversation.name}
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant/10"
                    src={conversation.avatar}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-bold text-xs">
                    {conversation.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 p-3 px-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.01)] text-xs font-mono">
                <span className="text-primary font-bold">{conversation.name} is typing</span>
                <span className="flex gap-1 items-center justify-center ml-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Daily Reflection Card IF this is the active guide conversation */}
        {conversation.id === 'julian_m' && (
          <div className="w-full py-2 animate-fade-in" id="daily-reflection-interactive-card">
            <div className="bg-surface-container-low rounded-3xl p-6 border border-primary-fixed/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="text-primary w-4 h-4" />
                  <h3 className="font-headline font-semibold text-primary text-sm tracking-wide">Daily Reflection</h3>
                </div>
                <p className="text-on-surface-variant text-sm mb-5 leading-relaxed italic">
                  {activeReflectionPrompt}
                </p>
                <button 
                  onClick={() => setShowReflectionModal(true)}
                  className="w-full py-3 px-4 bg-surface-container-lowest hover:bg-primary-fixed/40 active:scale-[0.99] rounded-xl text-primary text-xs font-bold font-label uppercase tracking-widest transition-all flex items-center justify-center gap-2 group border border-outline-variant/10 shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
                  id="begin-reflection-button"
                >
                  Begin Reflection
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* Thread reply header preview */}
      {replyToMsg && (
        <div className="mx-6 px-4 py-3 bg-surface-container-high/90 backdrop-blur-md rounded-2xl border-l-4 border-primary flex items-center justify-between shadow-sm animate-fade-in mb-2 text-left">
          <div className="min-w-0 pr-4">
            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">
              Replying to {replyToMsg.senderName}
            </span>
            <p className="text-xs text-on-surface truncate mt-0.5 italic">
              {replyToMsg.text.startsWith('[Quote: ') ? replyToMsg.text.substring(replyToMsg.text.indexOf(']') + 1).trim() : replyToMsg.text}
            </p>
          </div>
          <button 
            onClick={() => setReplyToMsg(null)}
            className="w-6 h-6 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-outline hover:text-primary transition-all text-xs shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Input Bar Area */}
      <div className="py-4 bg-gradient-to-t from-surface via-surface to-transparent pt-6 border-t border-outline-variant/10 p-4">
        {isRecording ? (
          /* High-Fidelity Voice Note Recording Slider Panel */
          <div className="flex items-center gap-3 bg-primary/10 backdrop-blur-lg p-2 px-4 rounded-full border border-primary/25 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative animate-fade-in w-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute left-4" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 absolute left-4" />
            
            <div className="flex-grow pl-5 text-left text-xs font-mono text-primary flex items-center gap-2">
              <span className="font-bold opacity-75">Recording:</span>
              <span className="text-on-surface font-bold">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>
              
              {/* Miniature audio bounce wavebars for live visual animation */}
              <div className="flex items-center gap-0.5 h-3.5 ml-2.5">
                {[1, 2, 3, 2, 1, 3, 4, 2, 1, 3].map((val, idx) => (
                  <span 
                    key={idx} 
                    className="w-0.5 bg-primary rounded-full animate-bounce"
                    style={{
                      height: `${val * 25}%`,
                      animationDelay: `${idx * 100}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Cancel Action (bin icon) */}
              <button 
                onClick={cancelVoiceRecording}
                className="w-10 h-10 flex items-center justify-center bg-surface-container-high/80 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 transition-all rounded-full cursor-pointer shrink-0"
                title="Cancel recording"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              {/* Send voice Memo Action */}
              <button 
                onClick={sendVoiceRecording}
                className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary hover:bg-primary-variant transition-all rounded-full shadow-lg cursor-pointer shrink-0"
                title="Send voice note"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Composition Input Row with Quick Add Toolbar Contexts */
          <div className="flex items-center gap-3 bg-surface-container/70 backdrop-blur-lg p-2 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative">
            <div className="relative">
              <button 
                onClick={() => setShowAddOptions(!showAddOptions)}
                className={`w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all rounded-full hover:bg-surface-container-high/60 ${showAddOptions ? 'rotate-[135deg] text-primary bg-primary/20 scale-105' : ''}`}
                title="Add mindful elements"
              >
                <Plus className="w-5 h-5" />
              </button>

              {showAddOptions && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowAddOptions(false)}
                  />
                  <div 
                    className="absolute bottom-14 left-0 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-2 w-60 shadow-2xl animate-fade-in z-30 flex flex-col gap-1 text-on-surface"
                  >
                    <div className="text-[10px] text-outline font-label uppercase tracking-widest px-2.5 py-1.5 mb-1 border-b border-outline-variant/10">
                      Aura Quick Actions
                    </div>
                    <button
                      onClick={() => {
                        setShowReflectionModal(true);
                        setShowAddOptions(false);
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-primary shrink-0 font-bold" />
                      <span>Mindful Pause Journal</span>
                    </button>
                    <button
                      onClick={() => {
                        onSendMessage("❤️ Sending a warm aura of tranquility and light your way!");
                        setShowAddOptions(false);
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Heart className="w-4 h-4 text-secondary shrink-0 animate-pulse" />
                      <span>Send Zen Vibe ❤️</span>
                    </button>
                    <button
                      onClick={() => {
                        onSendMessage("📊 Bio-Pulse Status: Heart rate coherence is balanced today. Staying aligned and centered.");
                        setShowAddOptions(false);
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Video className="w-4 h-4 text-primary shrink-0" />
                      <span>Share Vitality Status</span>
                    </button>

                    <div className="text-[10px] text-outline font-label uppercase tracking-widest px-2.5 py-1.5 mt-1 border-t border-b border-outline-variant/10">
                      Media & Documents
                    </div>
                    <button
                      onClick={handlePhotoUploadClick}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Camera className="w-4 h-4 text-primary shrink-0" />
                      <span>Upload Local Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPhotoPresetPicker(true);
                        setShowAddOptions(false);
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Image className="w-4 h-4 text-primary shrink-0" />
                      <span>Choose Zen Scene Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowGifPicker(true);
                        setShowAddOptions(false);
                      }}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Image className="w-4 h-4 text-secondary shrink-0 animate-pulse" />
                      <span>Share Serene GIF</span>
                    </button>
                    <button
                      onClick={handleDocumentUploadClick}
                      className="flex items-center gap-2.5 w-full p-2.5 text-left hover:bg-primary/10 rounded-xl text-xs font-body text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span>Attach Document File</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-2 px-2 text-on-surface placeholder:text-outline/60 font-body outline-none"
              placeholder="Share your thoughts..."
              id="chat-text-input"
            />
            {inputText.trim() ? (
              <button 
                onClick={handleSend}
                className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full hover:opacity-95 transition-all active:scale-95 shadow-md flex-shrink-0"
                id="chat-send-button"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={startVoiceRecording}
                className="w-10 h-10 flex items-center justify-center bg-secondary text-neutral-900 rounded-full hover:opacity-95 transition-all active:scale-95 shadow-md flex-shrink-0"
                title="Record Mindful Voice Note"
                id="chat-voice-button"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reflection modal Journaling overlay */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowReflectionModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors text-outline"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal header details */}
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs uppercase font-label tracking-widest font-semibold">Reflective Sanctuary</span>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 py-2 flex-grow custom-scrollbar">
              <div>
                <h3 className="text-xl font-headline font-bold text-primary tracking-tight leading-snug">
                  {userName}'s Pause
                </h3>
                <p className="mt-2 text-sm text-outline italic leading-relaxed">
                  {activeReflectionPrompt}
                </p>
              </div>

              {/* Breathing Circle Helper */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/10">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div 
                    className="absolute bg-primary/10 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${40 * breathingProgress}px`, 
                      height: `${40 * breathingProgress}px` 
                    }}
                  />
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary z-10 shadow-sm">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-outline font-label uppercase tracking-wider block">Breathing Companion</span>
                  <span className="text-sm font-headline text-primary font-bold transition-all">
                    Breathe {isBreathingState}...
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1">
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Pour your thoughts, breathe, there is no rush..."
                  className="w-full bg-surface-container-low rounded-2xl p-4 text-sm font-body text-on-surface placeholder:text-outline/40 border-none outline-none focus:ring-1 focus:ring-primary h-36 resize-none"
                  id="reflection-response-textarea"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-outline-variant/10 flex gap-3">
              <button 
                onClick={() => setShowReflectionModal(false)}
                className="flex-1 py-3 px-4 bg-surface-container-high hover:bg-surface-dim rounded-xl text-primary text-xs font-bold font-label uppercase tracking-widest transition-colors"
              >
                Cancel Pause
              </button>
              <button 
                disabled={!reflectionText.trim()}
                onClick={handleSaveReflection}
                className="flex-1 py-3 px-4 bg-primary text-on-primary disabled:opacity-50 hover:opacity-95 rounded-xl text-xs font-bold font-label uppercase tracking-widest transition-colors shadow-sm"
                id="save-reflection-submit-button"
              >
                Log Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden standard HTML file inputs for photos and files */}
      <input 
        type="file" 
        ref={photoInputRef} 
        onChange={handlePhotoChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={documentInputRef} 
        onChange={handleDocumentChange} 
        accept=".pdf,.doc,.docx,.txt"
        className="hidden" 
      />

      {/* Preset Zen Photos Picker Modal */}
      {showPhotoPresetPicker && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-on-surface">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 flex flex-col">
            <button 
              onClick={() => setShowPhotoPresetPicker(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors text-outline"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-primary">
              <Camera className="w-4 h-4" />
              <span className="text-xs uppercase font-label tracking-widest font-semibold font-mono">Choose Zen Scene Photo</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { name: 'Quiet Garden', url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80' },
                { name: 'Sunset Serenity', url: 'https://images.unsplash.com/photo-150752428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80' },
                { name: 'Foggy Pines', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80' },
                { name: 'Cherry Blossom Zen', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&auto=format&fit=crop&q=80' },
              ].map((scene) => (
                <button
                  key={scene.url}
                  onClick={() => {
                    onSendMessage(`📷 Preset Zen Picture: ${scene.name}`, {
                      type: 'photo',
                      url: scene.url,
                      name: `${scene.name}.jpg`,
                      size: '184 KB'
                    });
                    setShowPhotoPresetPicker(false);
                  }}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-primary h-[110px]"
                >
                  <img src={scene.url} alt={scene.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">{scene.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowPhotoPresetPicker(false)}
              className="py-3 px-4 bg-surface-container-high hover:bg-surface-dim rounded-xl text-primary text-xs font-bold font-label uppercase tracking-widest transition-colors w-full font-mono"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preset Serene GIFs Picker Modal */}
      {showGifPicker && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-on-surface">
          <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-outline-variant/30 flex flex-col">
            <button 
              onClick={() => setShowGifPicker(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors text-outline"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-secondary">
              <Image className="w-4 h-4" />
              <span className="text-xs uppercase font-label tracking-widest font-semibold font-mono">Share Serene GIF</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { name: 'Calming Breathe Ball', url: 'https://media.giphy.com/media/krP2WX3xgJctgE49C7/giphy.gif' },
                { name: 'Gentle Ocean Waves', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWpydG1jZGsyZzNxMDVreGdtZXNjdmtkbms1ZGFkOTBwb2IwemVtdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/V6f9rYOkGv7Uu5b1nC/giphy.gif' },
                { name: 'Campfire Stars Loop', url: 'https://media.giphy.com/media/13HgwGoXun762A/giphy.gif' },
                { name: 'Mountain Mist Breath', url: 'https://media.giphy.com/media/Q8IYWJJyS810IA69JL/giphy.gif' },
              ].map((gif) => (
                <button
                  key={gif.url}
                  onClick={() => {
                    onSendMessage(`🌸 Zen Animated loop: ${gif.name}`, {
                      type: 'gif',
                      url: gif.url,
                      name: `${gif.name.toLowerCase().replace(/ /g, '_')}.gif`,
                      size: '412 KB'
                    });
                    setShowGifPicker(false);
                  }}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/5 flex flex-col focus:outline-none focus:ring-2 focus:ring-secondary h-[110px]"
                >
                  <img src={gif.url} alt={gif.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-semibold">{gif.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowGifPicker(false)}
              className="py-3 px-4 bg-surface-container-high hover:bg-surface-dim rounded-xl text-primary text-xs font-bold font-label uppercase tracking-widest transition-colors w-full font-mono"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Immersive Full Screen Presence Call Overlay */}
      {showVideoCall && (
        <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-2xl z-50 flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 text-white animate-fade-in font-sans">
          {/* Main Visual Stream Viewport */}
          <div className="flex-grow flex flex-col justify-between bg-neutral-900/60 rounded-3xl p-5 border border-white/5 relative overflow-hidden min-h-[350px] md:min-h-[450px]">
            {/* Background Stream View (either camera or slow gradient) */}
            {isLocalVideoSwapped && isVideoEnabled ? (
              <video 
                ref={(el) => {
                  localVideoRef.current = el;
                  if (el && localStreamRef.current) {
                    el.srcObject = localStreamRef.current;
                  }
                }}
                autoPlay 
                playsInline 
                muted 
                onClick={() => setIsLocalVideoSwapped(false)}
                className="absolute inset-x-0 inset-y-0 w-full h-full object-cover rounded-3xl cursor-pointer hover:opacity-90 transition-all z-0"
                title="Click to minimize"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(98,111,88,0.18),transparent_55%)] pointer-events-none animate-pulse duration-[6000ms] z-0" />
            )}
            
            {/* Upper Info Row */}
            <div className="flex items-center justify-between z-10 w-full">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-emerald-400">
                  {isLocalVideoSwapped ? "Your Stream Enlarged" : "Live Presence Sync active"}
                </span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 font-mono text-xs font-semibold">
                {String(Math.floor(activeSessionTimer / 60)).padStart(2, '0')}:{String(activeSessionTimer % 60).padStart(2, '0')}
              </div>
            </div>

            {/* Central Immersive Remote Participant Visualizer or Notification Overlay */}
            {!isLocalVideoSwapped ? (
              <div className="flex flex-col items-center justify-center z-10 my-auto text-center gap-6 relative">
                <div className="relative flex items-center justify-center">
                  {/* Visual breathing ring */}
                  <span className="absolute w-36 h-36 rounded-full bg-primary/20 animate-ping duration-[3500ms]" />
                  <span className="absolute w-28 h-28 rounded-full bg-secondary/15 animate-pulse duration-[2000ms]" />

                  {conversation.avatar ? (
                    <img 
                      src={conversation.avatar} 
                      alt={conversation.name} 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-2xl relative z-10 animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/20 border-4 border-white/10 shadow-2xl relative z-10 flex items-center justify-center text-primary text-xl font-bold font-headline animate-fade-in">
                      {conversation.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-headline font-semibold text-white mb-1">{conversation.name}</h2>
                  <p className="text-xs text-outline tracking-wider uppercase font-mono">{conversation.subLabel || "Wellness Companion"}</p>
                </div>

                {/* Solfeggio sound particle visualization */}
                {isSoundBathPlaying && (
                  <div className="flex gap-1 h-8 items-end justify-center transition-all">
                    {[...Array(12)].map((_, i) => (
                      <span 
                        key={i} 
                        className="w-1 bg-gradient-to-t from-primary/60 to-secondary/80 rounded-full animate-bounce"
                        style={{ 
                          height: `${Math.floor(Math.random() * 24) + 8}px`,
                          animationDelay: `${i * 120}ms`,
                          animationDuration: `${1200 + (i % 3) * 300}ms`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => setIsLocalVideoSwapped(false)}
                className="flex flex-col items-center justify-center z-10 my-auto text-center gap-3 relative bg-black/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/15 max-w-sm mx-auto cursor-pointer hover:bg-black/60 transition-colors"
              >
                <Activity className="w-8 h-8 text-secondary animate-pulse" />
                <span className="text-xs uppercase font-mono tracking-widest text-emerald-300 font-semibold">Local Stream Primary</span>
                <p className="text-[10px] text-stone-300">Self-view is maximized. Click anyway here to minimize.</p>
              </div>
            )}

            {/* Bottom Guideline Box */}
            {showGuidanceTips && (
              <div className="z-10 mt-auto bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-stone-200 text-left leading-relaxed">
                  {videoCallGuidance}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Local Feed, Soundbath Synth & Stats */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 md:gap-5 justify-between">
            {/* Visual Stream Local Viewport */}
            <div 
              onClick={() => isVideoEnabled && setIsLocalVideoSwapped(!isLocalVideoSwapped)}
              className={`bg-neutral-900/60 rounded-3xl p-4 border border-white/5 relative overflow-hidden aspect-[4/3] flex flex-col items-center justify-center transition-all ${isVideoEnabled ? 'cursor-pointer hover:border-primary/40 hover:bg-neutral-800/80' : ''}`}
              title={isVideoEnabled ? (isLocalVideoSwapped ? "Minimize your preview" : "Maximize your preview") : "Camera is inactive"}
            >
              {!isLocalVideoSwapped ? (
                isVideoEnabled ? (
                  <video 
                    ref={(el) => {
                      localVideoRef.current = el;
                      if (el && localStreamRef.current) {
                        el.srcObject = localStreamRef.current;
                      }
                    }}
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-x-0 inset-y-0 w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 flex items-center justify-center text-primary border border-white/10 animate-pulse">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-primary">Ronnie (You)</span>
                      <p className="text-xs text-outline mt-0.5">Aura Avatar Stream Only</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center flex flex-col items-center gap-2 animate-fade-in">
                  <div className="relative">
                    <span className="absolute -inset-1 rounded-full bg-secondary/10 animate-ping duration-[3000ms]" />
                    {conversation.avatar ? (
                      <img 
                        src={conversation.avatar} 
                        alt={conversation.name} 
                        className="w-12 h-12 rounded-full object-cover border border-white/20 relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 border border-white/20 relative z-10 flex items-center justify-center text-primary text-xs font-semibold">
                        {conversation.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-secondary">{conversation.name}</span>
                    <p className="text-[9px] text-outline">Wellness Companion</p>
                  </div>
                </div>
              )}
              {/* Overlay Label */}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/5 text-[9px] uppercase tracking-wider font-mono">
                {!isLocalVideoSwapped ? "Local Presence" : `${conversation.name} Corner`}
              </div>
            </div>

            {/* Bio-Coherence Vitality Status */}
            <div className="bg-neutral-900/40 rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-outline">Bio-coherence indicators</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-mono font-bold text-primary leading-none">{heartCoherence}%</span>
                  <p className="text-[10px] text-outline mt-0.5">Heart Sync Score</p>
                </div>
                <div className="flex h-6 w-16 items-center gap-0.5 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-primary/70 rounded-full"
                      style={{ 
                        height: `${Math.floor(Math.random() * 16) + 4}px`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-mono font-bold text-secondary">{Math.floor(activeSessionTimer / 8)}</span>
                  <p className="text-[10px] text-outline mt-0.5">Zen Deep Breaths</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-stone-300">Optimal (5.5s)</span>
                  <p className="text-[10px] text-outline mt-0.5">Pacing Cycle</p>
                </div>
              </div>
            </div>

            {/* Sound Bath Controls */}
            <button 
              onClick={toggleSoundBath}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                isSoundBathPlaying 
                  ? 'bg-secondary text-neutral-950 shadow-lg shadow-secondary/20 hover:scale-[1.01]' 
                  : 'bg-white/5 hover:bg-white/10 text-stone-200 border border-white/5'
              }`}
            >
              {isSoundBathPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              <span>{isSoundBathPlaying ? "Active Solfeggio Gongs" : "Muted Solfeggio Gongs"}</span>
            </button>

            {/* Bottom Call controls and hangup */}
            <div className="flex gap-3 justify-between">
              <button 
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  isMicMuted 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-stone-200'
                }`}
                title="Mute/Unmute Mic"
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button 
                onClick={toggleVideo}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  isVideoEnabled 
                    ? 'bg-primary/20 border-primary/30 text-primary' 
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-stone-200'
                }`}
                title="Enable/Disable Video Stream"
              >
                {isVideoEnabled ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button 
                onClick={handleLeaveCall}
                className="flex-[1.8] bg-red-500 hover:bg-red-600 active:scale-95 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                title="End Presence Session"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Full Screen Audio Sanctuary Call Overlay */}
      {showAudioCall && (
        <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-2xl z-50 flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 text-white animate-fade-in font-sans">
          {/* Main Sound Wave & Aura Viewport */}
          <div className="flex-grow flex flex-col justify-between bg-stone-900/40 rounded-3xl p-5 border border-white/5 relative overflow-hidden min-h-[350px] md:min-h-[450px]">
            {/* Background Moving Energy Aura for Sound Stream */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,150,129,0.12),transparent_60%)] pointer-events-none animate-pulse duration-[8000ms] z-0" />
            
            {/* Upper Status Row */}
            <div className="flex items-center justify-between z-10 w-full">
              <div className="flex items-center gap-3 bg-stone-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-primary">Mindful Voice Alignment Active</span>
              </div>
              <div className="bg-stone-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5 font-mono text-xs font-semibold text-primary-variant">
                {String(Math.floor(activeSessionTimer / 60)).padStart(2, '0')}:{String(activeSessionTimer % 60).padStart(2, '0')}
              </div>
            </div>

            {/* Central Holographic Pulsing Audio Orb */}
            <div className="flex flex-col items-center justify-center z-10 my-auto text-center gap-6 relative">
              <div className="relative flex items-center justify-center">
                {/* Microtonal breath pulsing layers */}
                <span className={`absolute w-44 h-44 rounded-full bg-primary/10 transition-transform duration-[4000ms] ease-in-out ${isMicMuted ? 'scale-90' : 'animate-ping'}`} />
                <span className="absolute w-36 h-36 rounded-full bg-secondary/10 animate-pulse duration-[3000ms]" />

                {conversation.avatar ? (
                  <img 
                    src={conversation.avatar} 
                    alt={conversation.name} 
                    className="w-28 h-28 rounded-full object-cover border-[3px] border-primary/20 shadow-[0_0_50px_rgba(139,150,129,0.15)] relative z-10 hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-primary/20 border-[3px] border-primary/20 shadow-2xl relative z-10 flex items-center justify-center text-primary text-2xl font-bold font-headline">
                    {conversation.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-primary font-mono tracking-widest uppercase font-semibold">Voice Stream Synced</span>
                <h2 className="text-2xl font-headline font-semibold text-stone-100 mt-1 mb-1">{conversation.name}</h2>
                <p className="text-xs text-outline tracking-wider uppercase font-mono">{conversation.subLabel || "Wellness Companion"}</p>
              </div>

              {/* Active Voice Waveform Visualizer */}
              <div className="flex gap-1.5 h-10 items-center justify-center mt-2 max-w-xs mx-auto px-4 py-1.5 rounded-full bg-stone-950/30 border border-white/5 backdrop-blur-sm">
                {[...Array(14)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-300 ${isMicMuted ? 'bg-stone-600 h-1' : 'bg-gradient-to-t from-primary/70 to-secondary/80 animate-bounce'}`}
                    style={{ 
                      height: isMicMuted ? '4px' : `${Math.floor(Math.random() * 24) + 6}px`,
                      animationDelay: `${i * 70}ms`,
                      animationDuration: `${800 + (i % 4) * 200}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Guidance Box */}
            {showGuidanceTips && (
              <div className="z-10 mt-auto bg-stone-950/55 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-stone-200 text-left leading-relaxed">
                  {audioCallGuidance}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Call dashboard, Soundbath Synth & Stats */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 md:gap-5 justify-between">
            {/* Static Immersive Voice Branding Box */}
            <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 flex flex-col items-center justify-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center text-primary border border-white/10">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-primary">Ronnie (You)</span>
                <p className="text-xs text-outline mt-0.5">Secure Mic Stream {isMicMuted ? "Muted" : "Active"}</p>
              </div>
            </div>

            {/* Wellness Bio-Coherence Statistics */}
            <div className="bg-stone-900/20 rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
              <span className="text-[10px] uppercase font-mono tracking-widest text-outline">Bio-resonance alignment</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-mono font-bold text-primary leading-none">{heartCoherence}%</span>
                  <p className="text-[10px] text-outline mt-0.5">Vocal Sync Score</p>
                </div>
                <div className="flex h-6 w-16 items-center gap-0.5 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-primary/50 rounded-full"
                      style={{ 
                        height: `${Math.floor(Math.random() * 16) + 4}px`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-mono font-bold text-secondary">{Math.floor(activeSessionTimer / 8)}</span>
                  <p className="text-[10px] text-outline mt-0.5">Zen Inhalations</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-stone-300 font-mono">5.5s Cycle</span>
                  <p className="text-[10px] text-outline mt-0.5">Mindful Pacing</p>
                </div>
              </div>
            </div>

            {/* Sound Bath Controls */}
            <button 
              onClick={toggleSoundBath}
              className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-mono font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                isSoundBathPlaying 
                  ? 'bg-secondary text-neutral-950 shadow-lg shadow-secondary/20 hover:scale-[1.01]' 
                  : 'bg-white/5 hover:bg-white/10 text-stone-200 border border-white/5'
              }`}
            >
              {isSoundBathPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              <span>{isSoundBathPlaying ? "Active Solfeggio Gongs" : "Muted Solfeggio Gongs"}</span>
            </button>

            {/* Bottom Call Controls & Hangup */}
            <div className="flex gap-4">
              <button 
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex-1 py-3.5 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                  isMicMuted 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 font-semibold' 
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-stone-200'
                }`}
                title="Mute/Unmute Mic"
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button 
                onClick={handleLeaveAudioCall}
                className="flex-[2.5] bg-red-500 hover:bg-red-600 active:scale-95 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                title="End Audio Presence Session"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
