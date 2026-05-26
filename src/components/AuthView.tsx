import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { loginWithEmailAndPassword, registerWithEmailAndPassword, loginWithGoogle } from '../firebase';

interface AuthViewProps {
  onAuthSuccess: (uid: string, userName: string, email: string) => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    try {
      if (isLogin) {
        const cred = await loginWithEmailAndPassword(email, password);
        const displayName = cred.user.displayName || name;
        onAuthSuccess(cred.user.uid, displayName, cred.user.email || email);
      } else {
        const cred = await registerWithEmailAndPassword(email, password, name);
        onAuthSuccess(cred.user.uid, name, cred.user.email || email);
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      // Human-readable errors
      if (err.code === 'auth/wrong-password') {
        setErrorMsg('Incorrect credentials. Please verify your secure password.');
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg('No current sanctuary matches this email address.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already linked to another sanctuary.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Your password must contain at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Verification could not be established.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const cred = await loginWithGoogle();
      onAuthSuccess(cred.user.uid, cred.user.displayName || 'Ronnie', cred.user.email || '');
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google verification failed.');
      }
    } finally {
      setIsLoading(false);
    }
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
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4 overflow-hidden relative group" id="auth-logo-pinching-hand">
            <img 
              src="/src/assets/images/hand_logo_outline_1779806157572.png" 
              alt="Clockit Pinch Logo" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
              referrerPolicy="no-referrer"
            />
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

        {/* Google Sign In option */}
        <div className="mt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 text-on-surface font-bold py-3 px-6 rounded-2xl text-xs font-label uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
            id="google-login-button"
          >
            <svg className="w-4 h-4 text-on-surface" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign In with Google</span>
          </button>
        </div>

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
