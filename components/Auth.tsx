import React, { useState } from 'react';
import { Lock, Mail, User, ShieldCheck, Building, ArrowLeft } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: () => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleForgotPassword = () => {
    alert("If this were a real app, we would send a password reset email to the address provided.");
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

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 pb-0 flex flex-col items-center">
           <Logo variant="dark" className="scale-125 mb-2" />
        </div>
        
        <div className="p-8 pt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
                {isLogin ? 'Secure Login' : 'Create Account'}
            </h2>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
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
                    <input type="email" placeholder="Email Address" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
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
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                </button>
            </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center items-center space-x-2 text-slate-500 text-xs">
            <ShieldCheck size={14}/>
            <span>Bank-level security & encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;