import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Video, 
  MoreVertical, 
  Plus, 
  Send, 
  Sparkles, 
  X, 
  Heart, 
  Languages, 
  Image, 
  AlertTriangle, 
  Globe, 
  FileText,
  RefreshCw
} from 'lucide-react';
import { Conversation, Message, Reflection } from '../types';
import { VideoCallOverlay } from './VideoCallOverlay';

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text: string, mediaUrl?: string) => void;
  onSaveReflection: (reflection: Reflection) => void;
  userAvatar: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  onSaveReflection,
  userAvatar
}) => {
  const [inputText, setInputText] = useState('');
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isBreathingState, setIsBreathingState] = useState<'In' | 'Hold' | 'Out' | 'Pause'>('In');
  const [breathingProgress, setBreathingProgress] = useState(1); // 1 to 1.5 scale
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // States for new features
  const [showCallOverlay, setShowCallOverlay] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [isCensoredState, setIsCensoredState] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, { text: string; lang: string }>>({});
  const [renderingLanguageMenu, setRenderingLanguageMenu] = useState<string | null>(null); // messageId
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Breathing circle simulation inside the journaling overlay
  useEffect(() => {
    if (!showReflectionModal) return;

    let interval: NodeJS.Timeout;
    const cycle = () => {
      setIsBreathingState('In');
      let scale = 1.0;
      const growTimer = setInterval(() => {
        scale += 0.05;
        if (scale >= 1.4) {
          clearInterval(growTimer);
          setIsBreathingState('Hold');
          setTimeout(() => {
            setIsBreathingState('Out');
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

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, attachedMediaUrl]);

  // Handles Media File Uploading & Conversion
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadingMedia(true);
    setModerationWarning(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        if (!base64Data) return;

        // Post to full-stack mock storage
        const response = await fetch('/api/media-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type,
            data: base64Data
          })
        });

        if (response.ok) {
          const res = await response.json();
          setAttachedMediaUrl(res.mediaUrl);
        } else {
          console.error("Media upload failure response");
        }
        setUploadingMedia(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File upload error:", err);
      setUploadingMedia(false);
    }
  };

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Drag-and-Drop Handler Functions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Safe Moderation & Send Control Flow
  const handleSend = async () => {
    if (!inputText.trim() && !attachedMediaUrl) return;

    let textToSend = inputText;
    setModerationWarning(null);

    if (inputText.trim()) {
      try {
        // Run AI content moderation check before sending
        const modRes = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText })
        });

        if (modRes.ok) {
          const modData = await modRes.json();
          if (!modData.clean) {
            setModerationWarning(modData.warning || "Your message was flagged and carefully adjusted to respect sanctuary harmony.");
            setIsCensoredState(true);
            textToSend = modData.censoredText || textToSend;
            setTimeout(() => setIsCensoredState(false), 5000);
          }
        }
      } catch (err) {
        console.warn("AI content moderation skipped due to dynamic connection context", err);
      }
    }

    onSendMessage(textToSend, attachedMediaUrl || undefined);
    setInputText('');
    setAttachedMediaUrl(null);
  };

  // AI-Powered Real-Time Translation
  const translateMessage = async (msgId: string, originalText: string, targetLang: string, langName: string) => {
    setRenderingLanguageMenu(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText, targetLang })
      });

      if (res.ok) {
        const data = await res.json();
        setTranslatedMessages(prev => ({
          ...prev,
          [msgId]: {
            text: data.translation,
            lang: langName
          }
        }));
      }
    } catch (err) {
      console.error("AI Translation triggered fail error:", err);
    }
  };

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
    <div 
      className={`flex flex-col h-[calc(100vh-140px)] animate-fade-in relative transition-all duration-300 ${
        dragActive ? 'bg-primary-container-low/30 outline-dashed outline-2 outline-primary/40 rounded-3xl' : ''
      }`} 
      id="chat-conversation-canvas"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Absolute Drag Drop Overlay Indicator */}
      {dragActive && (
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 pointer-events-none rounded-3xl">
          <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce">
            <Image className="w-8 h-8" />
          </div>
          <p className="text-primary font-headline font-bold text-lg text-center">
            Drop Your Media Here to Share Instantly
          </p>
          <p className="text-outline text-xs text-center mt-1">
            Accepting images, logs, maps, and audio templates
          </p>
        </div>
      )}

      {/* Top Header App Bar */}
      <header className="flex items-center justify-between py-4 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-2">
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
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></span>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="font-headline font-bold text-base text-primary leading-tight flex items-center gap-1.5">
                {conversation.name}
              </h1>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">
                {conversation.subLabel || (conversation.online ? 'Online' : 'Offline')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Calling & Menu Control actions */}
        <div className="flex items-center gap-2 text-on-surface-variant">
          <button 
            onClick={() => setShowCallOverlay(true)}
            className="hover:opacity-85 transition-all p-2.5 rounded-full hover:bg-surface-container-low text-primary flex items-center justify-center"
            title="Start Secures Voice/Video Call"
          >
            <Video className="w-5 h-5 text-primary" />
          </button>
          <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-low">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Canvas */}
      <div className="flex-grow overflow-y-auto px-1 py-6 space-y-8 custom-scrollbar scroll-smooth">
        {/* Date indication */}
        <div className="flex justify-center select-none">
          <span className="text-[10px] text-outline uppercase tracking-widest font-label bg-surface-container px-3 py-1 rounded-full">
            Today
          </span>
        </div>

        {/* Dynamic messages stack */}
        {conversation.messages.map((msg, index) => {
          const isUser = msg.isUser;
          const msgId = msg.id || `msg_${index}`;
          const translated = translatedMessages[msgId];
          
          return (
            <div key={msgId} className="space-y-1.5 animate-fade-in group">
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl shadow-[0_4px_30px_rgba(85,98,77,0.02)] border relative ${
                  isUser 
                    ? 'bg-primary text-on-primary border-primary rounded-tr-none' 
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 rounded-tl-none'
                }`}>
                  
                  {/* Media Share Attachment Block */}
                  {(msg as any).mediaUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden max-w-full border border-black/5 shadow-sm max-h-56 bg-surface-container-high/40 flex items-center justify-center">
                      <img 
                        src={(msg as any).mediaUrl} 
                        alt="Shared media asset" 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <p className={`text-sm leading-relaxed ${msg.isItalic ? 'italic' : ''}`}>
                    {translated ? translated.text : msg.text}
                  </p>

                  {/* AI Translation Label Overlay Badge */}
                  {translated && (
                    <div className="mt-2.5 flex items-center gap-1 border-t border-black/5 pt-1.5">
                      <Globe className="w-3.5 h-3.5 opacity-80" />
                      <span className="text-[9px] font-mono tracking-wide uppercase opacity-90">
                        Translated to {translated.lang}
                      </span>
                    </div>
                  )}

                  {/* Absolute positioning of Translate Trigger action trigger */}
                  <div className={`absolute top-2 ${isUser ? '-left-10' : '-right-10'} hidden group-hover:flex items-center z-10`}>
                    <button 
                      onClick={() => setRenderingLanguageMenu(renderingLanguageMenu === msgId ? null : msgId)}
                      className="p-1.5 bg-surface-container-high rounded-full hover:bg-surface-container-highest transition-colors text-outline hover:text-primary border border-outline-variant/20 shadow-sm"
                      title="Translate with AI"
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Micro Language Picker Menu */}
                  {renderingLanguageMenu === msgId && (
                    <div className={`absolute top-10 ${isUser ? 'right-0' : 'left-0'} bg-surface-container-high border border-outline-variant rounded-xl p-1.5 shadow-xl z-20 flex flex-col gap-1 min-w-[120px] text-xs font-label`}>
                      <span className="p-1.5 text-[9px] font-mono text-outline uppercase tracking-wider text-center border-b border-outline-variant/20">TARGET LANGUAGE</span>
                      <button 
                        onClick={() => translateMessage(msgId, msg.text, "Spanish", "Spanish")}
                        className="px-2.5 py-1.5 hover:bg-primary/10 hover:text-primary rounded-md text-left transition-colors font-medium text-on-surface"
                      >
                        Español (ES)
                      </button>
                      <button 
                        onClick={() => translateMessage(msgId, msg.text, "French", "French")}
                        className="px-2.5 py-1.5 hover:bg-primary/10 hover:text-primary rounded-md text-left transition-colors font-medium text-on-surface"
                      >
                        Français (FR)
                      </button>
                      <button 
                        onClick={() => translateMessage(msgId, msg.text, "German", "German")}
                        className="px-2.5 py-1.5 hover:bg-primary/10 hover:text-primary rounded-md text-left transition-colors font-medium text-on-surface"
                      >
                        Deutsch (DE)
                      </button>
                      <button 
                        onClick={() => translateMessage(msgId, msg.text, "Japanese", "Japanese")}
                        className="px-2.5 py-1.5 hover:bg-primary/10 hover:text-primary rounded-md text-left transition-colors font-medium text-on-surface"
                      >
                        日本語 (JA)
                      </button>
                      <button 
                        onClick={() => translateMessage(msgId, msg.text, "Chinese", "Chinese")}
                        className="px-2.5 py-1.5 hover:bg-primary/10 hover:text-primary rounded-md text-left transition-colors font-medium text-on-surface"
                      >
                        中文 (ZH)
                      </button>
                    </div>
                  )}

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
              <div className="relative z-10 flex flex-col items-start">
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

      {/* Attachments status pre-view pane */}
      {attachedMediaUrl && (
        <div className="px-4 py-2 border-t border-outline-variant/10 flex items-center justify-between bg-surface-container/30 w-[95%] mx-auto rounded-2xl mb-2 animate-scale-in">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-outline-variant bg-stone-100 flex items-center justify-center">
              <img src={attachedMediaUrl} alt="Attached snippet file" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="text-[10px] text-outline block font-label uppercase">Media Attached</span>
              <span className="text-xs text-primary font-medium font-mono">Ready to emit & share</span>
            </div>
          </div>
          <button 
            onClick={() => setAttachedMediaUrl(null)}
            className="w-7 h-7 hover:bg-surface-container-high rounded-full flex items-center justify-center text-outline hover:text-red-500 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Moderation Warn Banner Overlay info */}
      {isCensoredState && moderationWarning && (
        <div className="px-5 py-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-2xl w-[95%] mx-auto mb-3 flex items-start gap-3 animate-slide-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="text-xs">
            <span className="font-bold font-mono tracking-wider text-[10px] uppercase block mb-0.5">Sanctuary Moderation Lock</span>
            <p className="leading-relaxed opacity-90">{moderationWarning}</p>
          </div>
        </div>
      )}

      {/* Message Input Bar Area */}
      <div className="py-4 bg-gradient-to-t from-surface via-surface to-transparent pt-6 border-t border-outline-variant/10">
        <div className="flex items-center gap-3 bg-surface-container/70 backdrop-blur-lg p-2 rounded-full border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          
          {/* File input and selector upload trigger */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileSelectChange} 
            className="hidden" 
            accept="image/*,video/*,audio/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-high/60 ${
              uploadingMedia ? 'animate-spin' : ''
            }`}
            title="Attach Media file (Drop file to upload)"
          >
            {uploadingMedia ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>

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
            className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full hover:opacity-95 transition-all active:scale-95 shadow-md flex-shrink-0 cursor-pointer"
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
            <div className="flex items-center gap-2 mb-2 text-primary select-none">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-xs uppercase font-label tracking-widest font-semibold">Reflective Sanctuary</span>
            </div>

            <div className="overflow-y-auto space-y-6 pr-2 py-2 flex-grow custom-scrollbar">
              <div>
                <h3 className="text-xl font-headline font-bold text-primary tracking-tight leading-snug">
                  Ronnie's Pause
                </h3>
                <p className="mt-2 text-sm text-outline italic leading-relaxed">
                  {activeReflectionPrompt}
                </p>
              </div>

              {/* Breathing Circle Helper */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/10 select-none">
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

      {/* Floating full screen secure Video Call Overlay */}
      {showCallOverlay && (
        <VideoCallOverlay 
          conversationName={conversation.name}
          conversationAvatar={conversation.avatar || "🌸"}
          onClose={() => setShowCallOverlay(false)}
        />
      )}

    </div>
  );
};
