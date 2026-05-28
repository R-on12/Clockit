import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, MoreVertical, Plus, Send, Sparkles, X, Heart, FileText, Image, Camera, Paperclip, Download, Mic, MicOff, VideoOff, PhoneOff, Activity, Volume2, VolumeX } from 'lucide-react';
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

  // Aura interactive video call & soundbath streams states
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isLocalVideoSwapped, setIsLocalVideoSwapped] = useState(false);
  const [isSoundBathPlaying, setIsSoundBathPlaying] = useState(false);
  const [activeSessionTimer, setActiveSessionTimer] = useState(0);
  const [heartCoherence, setHeartCoherence] = useState(94);
  const [videoCallGuidance, setVideoCallGuidance] = useState("Establishing secure holographic link...");

  useEffect(() => {
    if (showVideoCall && isVideoEnabled && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [showVideoCall, isVideoEnabled, isLocalVideoSwapped]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const soundBathTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        droneOsc.frequency.setValueAtTime(136.1, ctx.currentTime);
        droneGain.gain.setValueAtTime(0.08, ctx.currentTime);
        droneOsc.connect(droneGain);
        droneGain.connect(ctx.destination);
        droneOsc.start();
        droneOscRef.current = droneOsc;

        const triggerBell = () => {
          const bellOsc = ctx.createOscillator();
          const bellGain = ctx.createGain();
          bellOsc.type = 'sine';
          const freqs = [396, 417, 432, 528, 639];
          const chosenFreq = freqs[Math.floor(Math.random() * freqs.length)];
          bellOsc.frequency.setValueAtTime(chosenFreq, ctx.currentTime);
          
          bellGain.gain.setValueAtTime(0.12, ctx.currentTime);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showVideoCall) {
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
  }, [showVideoCall]);

  useEffect(() => {
    if (!showVideoCall) return;
    const tips = [
      "Julian suggests: Breath deep, matches the light ripple.",
      "Aura sync: Softening shoulders, centering attention.",
      "Coherence feedback: Heart rate variability is stabilizing.",
      "Bio-presence aligned. Sound bath gongs supporting your rhythm.",
      "Sanctuary focus: Letting pass transient cognitive loops.",
    ];
    let tipIdx = 0;
    const interval = setInterval(() => {
      setVideoCallGuidance(tips[tipIdx % tips.length]);
      tipIdx++;
    }, 6000);
    return () => {
      clearInterval(interval);
    };
  }, [showVideoCall]);

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
    const cycle = () => {
      setIsBreathingState('In');
      // Grow
      let scale = 1.0;
      const growTimer = setInterval(() => {
        scale += 0.05;
        if (scale >= 1.4) {
          clearInterval(growTimer);
          setIsBreathingState('Hold');
          setTimeout(() => {
            setIsBreathingState('Out');
            // Shrink
            const shrinkTimer = setInterval(() => {
              scale -= 0.05;
              if (scale <= 1.0) {
                clearInterval(shrinkTimer);
                setIsBreathingState('Pause');
              }
              setBreathingProgress(scale);
            }, 100);
          }, 1500);
        }
        setBreathingProgress(scale);
      }, 100);
    };

    cycle();
    interval = setInterval(cycle, 7000);

    return () => {
      clearInterval(interval);
    };
  }, [showReflectionModal]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const activeReflectionPrompt = `"In the midst of movement and chaos, keep stillness inside of you." What is one area of your life where you'd like to invite more stillness today?`;

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
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">
                {conversation.subLabel || (conversation.online ? 'Online' : 'Offline')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant">
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
          <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-low">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Canvas */}
      <div className="flex-grow overflow-y-auto px-1 py-6 space-y-8 custom-scrollbar scroll-smooth">
        {/* Date indication */}
        <div className="flex justify-center">
          <span className="text-[10px] text-outline uppercase tracking-widest font-label bg-surface-container px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {/* Dynamic messages stack */}
        {conversation.messages.map((msg, index) => {
          const isUser = msg.isUser;
          
          return (
            <div key={msg.id || index} className="space-y-1 animate-fade-in">
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-[0_4px_30px_rgba(85,98,77,0.02)] border ${
                  isUser 
                    ? 'bg-primary text-on-primary border-primary rounded-tr-none' 
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 rounded-tl-none'
                }`}>
                  {/* Message Attachment Rendering */}
                  {msg.attachment && (
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
                        <div className="flex items-center gap-3 p-3 bg-surface-container-high/40 rounded-xl border border-outline-variant/10">
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

                  <p className={`text-sm leading-relaxed ${msg.isItalic ? 'italic' : ''}`}>
                    {msg.text}
                  </p>
                </div>
              </div>
              <div className={`flex text-[10px] text-outline font-label ${isUser ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
                {msg.timeLabel}
              </div>
            </div>
          );
        })}

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

      {/* Message Input Bar Area */}
      <div className="py-4 bg-gradient-to-t from-surface via-surface to-transparent pt-6 border-t border-outline-variant/10">
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
          <button 
            onClick={handleSend}
            className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full hover:opacity-95 transition-all active:scale-95 shadow-md flex-shrink-0"
            id="chat-send-button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
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
            <div className="z-10 mt-auto bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-stone-200 text-left leading-relaxed">
                {videoCallGuidance}
              </p>
            </div>
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
    </div>
  );
};
