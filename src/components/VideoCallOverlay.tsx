import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Shield, RefreshCw, Volume2 } from 'lucide-react';

interface VideoCallOverlayProps {
  conversationName: string;
  conversationAvatar: string;
  onClose: () => void;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  conversationName,
  conversationAvatar,
  onClose
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Get real screen/webcam camera stream for genuine user frame
  useEffect(() => {
    async function startCamera() {
      if (!isVideoOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 320, facingMode: 'user' },
          audio: true
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera permission denied or not available; showing placeholder avatar:", err);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoOn]);

  // 2. Connect delay simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallState('connected');
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  // 3. Increment call duration if connected
  useEffect(() => {
    if (callState !== 'connected') return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
      // Simulate micro audio volume spikes
      setAudioLevel(Math.floor(Math.random() * 80) + 20);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    setCallState('ended');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-between p-6 overflow-hidden animate-fade-in text-white font-sans">
      
      {/* Background abstract circles for high-quality ambient glassmorphism */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header telemetry HUD bar */}
      <header className="w-full max-w-lg flex items-center justify-between z-10 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] tracking-widest font-mono font-medium text-emerald-300">SECURE P2P HANDSHAKE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] tracking-widest font-mono text-stone-300">HD 4K</span>
        </div>
      </header>

      {/* Main Calling Stage View */}
      <main className="flex-1 w-full max-w-lg flex flex-col items-center justify-center relative z-10">
        
        {/* Remote participant main avatar & calling state */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            {/* Pulsating ring overlay during connecting */}
            {callState === 'connecting' && (
              <>
                <div className="absolute -inset-4 rounded-full border border-primary/40 animate-ping opacity-60"></div>
                <div className="absolute -inset-8 rounded-full border border-primary/20 animate-ping opacity-30"></div>
              </>
            )}
            
            <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${callState === 'connected' ? 'border-primary' : 'border-neutral-700'} shadow-2xl transition-all duration-500`}>
              <img 
                src={conversationAvatar} 
                alt={conversationName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {callState === 'connected' && (
              <div className="absolute bottom-1 right-1 bg-primary text-stone-950 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-md">
                <Volume2 className="w-3.5 h-3.5" />
                <span>LIVE</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">{conversationName}</h2>
            <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">
              {callState === 'connecting' && 'INITIALIZING SIGNAL LINES...'}
              {callState === 'connected' && `ONLINE • ${formatTime(callDuration)}`}
              {callState === 'ended' && 'DISCONNECTING SECURE SESSION...'}
            </p>
          </div>
        </div>

        {/* Floating Local Real Camera Feed PIP inside circular frames */}
        {isVideoOn && callState === 'connected' && (
          <div className="absolute bottom-4 right-4 w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-stone-900 animate-scale-in">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-1 left-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-[8px] font-mono tracking-wider opacity-90 text-white">YOU</span>
            </div>
          </div>
        )}

        {/* Micro audio frequency bar indicators simulating remote volume */}
        {callState === 'connected' && (
          <div className="mt-8 flex items-center gap-1 justify-center h-4 w-40">
            {Array.from({ length: 15 }).map((_, i) => {
              const height = callState === 'connected' ? `${Math.max(4, audioLevel * (1 - Math.abs(7 - i) / 8) * 0.15)}px` : '4px';
              return (
                <span 
                  key={i} 
                  className="w-1 bg-primary rounded-full transition-all duration-200"
                  style={{ height }}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Control Actions Panel */}
      <footer className="w-full max-w-lg z-10 bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md flex items-center justify-around">
        
        {/* Mute button */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${
            isMuted ? 'bg-amber-400 text-stone-950' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End call button */}
        <button 
          onClick={handleHangUp}
          className="w-16 h-16 bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center rounded-full transition-all shadow-lg hover:shadow-red-500/30"
          title="Hang Up Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        {/* Video off button */}
        <button 
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${
            !isVideoOn ? 'bg-amber-400 text-stone-950' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

      </footer>

    </div>
  );
};
