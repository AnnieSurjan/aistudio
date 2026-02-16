import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ShieldCheck, Building, ArrowLeft, Send, Loader2, CheckSquare, AlertCircle } from 'lucide-react';
import Logo from './Logo';

// Backend URLs - try same origin first (works on any domain), then fallbacks
const BACKEND_URLS = [
  window.location.origin,
  'http://localhost:3001',
];

interface AuthProps {
  onLogin: (user?: { name: string; email: string; companyName: string }) => void;
  onBack: () => void;
}

async function callBackend(path: string, body: object): Promise<{ ok: boolean; data: any }> {
  for (const baseUrl of BACKEND_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch {
      continue;
    }
  }
  return { ok: false, data: { error: 'Backend not reachable' } };
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Captcha State
  const [isHuman, setIsHuman] = useState(false);
  const [isCheckingHuman, setIsCheckingHuman] = useState(false);

  // Reset captcha and errors when switching modes
  useEffect(() => {
    setIsHuman(false);
    setIsCheckingHuman(false);
    setErrorMsg('');
  }, [isLogin]);

  const handleForgotPassword = () => {
    alert("If this were a real app, we would send a password reset email to the address provided.");
  };

  const handleCaptchaClick = () => {
      if (isHuman || isCheckingHuman) return;
      setIsCheckingHuman(true);
      setTimeout(() => {
          setIsCheckingHuman(false);
          setIsHuman(true);
      }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHuman) return;
    setErrorMsg('');
    setIsLoading(true);

    if (isLogin) {
      // --- Login ---
      const { ok, data } = await callBackend('/auth/login', { email, password });
      setIsLoading(false);

      if (ok && data.user) {
        if (data.token) localStorage.setItem('auth_token', data.token);
        onLogin(data.user);
      } else {
        setErrorMsg(data.error || 'Login failed');
      }
    } else {
      // --- Registration ---
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const { ok, data } = await callBackend('/auth/register', {
        email, password, name, companyName,
      });
      setIsLoading(false);

      if (ok) {
        setShowVerification(true);
      } else {
        setErrorMsg(data.error || 'Registration failed');
      }
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const { ok, data } = await callBackend('/auth/verify-email', { email, code: verificationCode });
    setIsLoading(false);

    if (ok && data.user) {
      if (data.token) localStorage.setItem('auth_token', data.token);
      onLogin(data.user);
    } else {
      setErrorMsg(data.error || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    setErrorMsg('');
    setIsLoading(true);

    const { ok, data } = await callBackend('/auth/resend-code', { email });
    setIsLoading(false);

    if (ok) {
      setErrorMsg('');
      alert('New verification code sent!');
    } else {
      setErrorMsg(data.error || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2"/>
        Back to Home
      </button>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transition-all duration-300">
        <div className="p-8 pb-0 flex flex-col items-center">
           <Logo variant="dark" className="scale-125 mb-2" />
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-700">{errorMsg}</span>
          </div>
        )}

        {/* Verification View */}
        {showVerification ? (
            <div className="p-8 pt-6 animate-in fade-in slide-in-from-right duration-300">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Check your inbox</h2>
                    <p className="text-sm text-slate-500 mt-2">
                        We sent a verification code to <br/>
                        <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">Verification Code</label>
                        <input
                            type="text"
                            placeholder="123456"
                            className="w-full text-center text-2xl tracking-widest py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            maxLength={6}
                            required
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center shadow-lg disabled:opacity-70"
                    >
                        {isLoading ? <><Loader2 size={18} className="animate-spin mr-2" /> Verifying...</> : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-4">
                    <button
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:underline flex items-center justify-center mx-auto disabled:opacity-50"
                    >
                        <Send size={14} className="mr-1"/> Resend Code
                    </button>
                    <button
                        onClick={() => { setShowVerification(false); setErrorMsg(''); }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                    >
                        Entered wrong email? Go back
                    </button>
                </div>
            </div>
        ) : (
            /* Login / Register View */
            <div className="p-8 pt-6 animate-in fade-in slide-in-from-left duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
                    {isLogin ? 'Secure Login' : 'Create Account'}
                </h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <div className="relative">
                                <User className="absolute top-3 left-3 text-slate-400" size={18}/>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                            <div className="relative">
                                <Building className="absolute top-3 left-3 text-slate-400" size={18}/>
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    autoComplete="organization"
                                />
                            </div>
                        </>
                    )}
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 text-slate-400" size={18}/>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            name="email"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-slate-400" size={18}/>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            name="password"
                        />
                    </div>

                    {isLogin && (
                        <div className="flex justify-end">
                            <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                Forgot your password?
                            </button>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="relative">
                            <Lock className="absolute top-3 left-3 text-slate-400" size={18}/>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {/* Robot Verification */}
                    <div
                        onClick={handleCaptchaClick}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${isHuman ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 flex items-center justify-center rounded border ${isHuman ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                                {isCheckingHuman ? (
                                    <Loader2 size={16} className="animate-spin text-slate-500" />
                                ) : isHuman ? (
                                    <CheckSquare size={16} className="text-white" />
                                ) : (
                                    <div className="w-full h-full" />
                                )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">I am not a robot</span>
                        </div>
                        <ShieldCheck size={20} className={isHuman ? "text-green-500" : "text-slate-300"} />
                    </div>

                    <button
                        type="submit"
                        disabled={!isHuman || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isLoading ? (
                          <><Loader2 size={18} className="animate-spin mr-2" /> {isLogin ? 'Signing in...' : 'Creating account...'}</>
                        ) : (
                          isLogin ? 'Sign In' : 'Get Started'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setShowVerification(false); setErrorMsg(''); }} className="text-sm text-blue-600 hover:underline">
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        )}

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center items-center space-x-2 text-slate-500 text-xs">
            <ShieldCheck size={14}/>
            <span>Bank-level security & encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
