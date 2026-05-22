import React, { useState } from 'react';
import { Flower, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { UserSettings } from '../types';

interface AuthViewProps {
  onAuthSuccess: (userName: string) => void;
  defaultName: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, defaultName }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(defaultName);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please complete all credential fields.');
      return;
    }

    if (!isLogin && !name) {
      setErrorMsg('Please provide your name or nickname to label your sanctuary.');
      return;
    }

    setIsLoading(true);
    
    // Simulate premium server-side transition timer
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess(isLogin ? name : name);
    }, 1200);
  };

  const fillDemoCredentials = () => {
    setEmail('ronnie@clockit.io');
    setPassword('centeredposture2026');
    setName('Ronnie');
  };

  return (
    <div className="min-h-screen bg-clockit-gradient flex items-center justify-center p-6" id="auth-parent-screen">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl -mr-32 -mb-32"></div>

      <div className="w-full max-w-md bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/25 rounded-3xl p-8 shadow-[0_12px_40px_rgba(85,98,77,0.06)] relative z-10 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/15 rounded-full mb-4 text-primary relative group">
            <Flower className="w-8 h-8 group-hover:rotate-45 transition-transform duration-500 text-primary animate-pulse" />
            <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-25"></span>
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Clockit</h1>
          <p className="mt-2 text-xs text-on-surface-variant font-body max-w-[280px] mx-auto leading-relaxed">
            Your mindful wellness sanctuary. Align your daily diurnal posture with stillness.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl mb-8 border border-outline-variant/10">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest font-label rounded-xl transition-all ${
              isLogin
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/10'
                : 'text-outline hover:text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest font-label rounded-xl transition-all ${
              !isLogin
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/10'
                : 'text-outline hover:text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Error Indicator */}
        {errorMsg && (
          <div className="bg-error-container/30 border border-error/20 text-on-error-container p-3.5 rounded-2xl text-xs font-medium text-center mb-6 animate-fade-in flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0 animate-ping"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-outline font-label uppercase tracking-widest block px-1">Your Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Ronnie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/15 hover:border-outline-variant/40 rounded-xl py-3 pl-11 pr-4 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-outline font-label uppercase tracking-widest block px-1 font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="email"
                placeholder="ronnie@clockit.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/15 hover:border-outline-variant/40 rounded-xl py-3 pl-11 pr-4 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-outline font-label uppercase tracking-widest block px-1">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/15 hover:border-outline-variant/40 rounded-xl py-3 pl-11 pr-12 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-[11px] text-outline font-body flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> End-to-end quiet encryption
              </span>
              <button 
                type="button" 
                onClick={() => setErrorMsg('An email reset link has been directed to your client.')}
                className="text-primary hover:underline font-semibold font-label"
              >
                Forgot?
              </button>
            </div>
          )}

          {/* Core Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:opacity-95 text-on-primary font-bold py-3.5 px-6 rounded-2xl text-xs font-label uppercase tracking-widest transition-all duration-200 mt-6 shadow-[0_4px_16px_rgba(85,98,77,0.15)] hover:shadow-[0_6px_20px_rgba(85,98,77,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                Centering...
              </span>
            ) : (
              <>
                <span>{isLogin ? "Enter Sanctuary" : "Initialize Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo login shortcuts to streamline user testing */}
        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
          <p className="text-[11px] text-outline mb-3 font-semibold uppercase tracking-wider">Test Sanctuary Instantly</p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-full text-xs font-bold text-primary font-label transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autofill Ronnie's Demo Key</span>
          </button>
        </div>

      </div>
    </div>
  );
};
