import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, MoreVertical, Plus, Send, Sparkles, X, Heart, FileText, Image, Camera, Paperclip, Download } from 'lucide-react';
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
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          <button className="hover:opacity-80 transition-opacity p-2 rounded-full hover:bg-surface-container-low">
            <Video className="w-5 h-5" />
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
    </div>
  );
};
