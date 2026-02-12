import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, Building, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: () => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleForgotPassword = () => {
    alert("If this were a real app, we would send a password reset email to the address provided.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
        // Login Flow
        onLogin();
    } else {
        // Registration Flow -> Go to Verification
        setShowVerification(true);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
      e.preventDefault();
      setIsVerifying(true);
      
      // Simulate API verification delay
      setTimeout(() => {
          setIsVerifying(false);
          // In a real app, you would validate the code against the backend here.
          // For demo, we accept any code that is 6 digits.
          if (verificationCode.length >= 4) {
              onLogin();
          } else {
              alert("Invalid code. Please enter the 6-digit code sent to your email.");
          }
      }, 1500);
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
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isVerifying}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center shadow-lg disabled:opacity-70"
                    >
                        {isVerifying ? 'Verifying...' : 'Verify Email'} 
                    </button>
                </form>

                <div className="mt-6 text-center space-y-4">
                    <button className="text-sm text-blue-600 hover:underline flex items-center justify-center mx-auto">
                        <Send size={14} className="mr-1"/> Resend Code
                    </button>
                    <button 
                        onClick={() => setShowVerification(false)} 
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
                                <input type="text" placeholder="Full Name" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                            </div>
                            <div className="relative">
                                <Building className="absolute top-3 left-3 text-slate-400" size={18}/>
                                <input type="text" placeholder="Company Name" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
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
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-slate-400" size={18}/>
                        <input type="password" placeholder="Password" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
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
                            <input type="password" placeholder="Confirm Password" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                        </div>
                    )}
                    
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-blue-500/30">
                        {isLogin ? 'Sign In' : 'Get Started'} 
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button onClick={() => { setIsLogin(!isLogin); setShowVerification(false); }} className="text-sm text-blue-600 hover:underline">
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