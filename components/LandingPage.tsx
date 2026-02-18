import React from 'react';
import { ArrowRight, PlayCircle, Zap, Check } from 'lucide-react';
import Logo from './Logo';
import HelpCenter from './HelpCenter';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onUpgrade: (plan: string, price: string) => void;
  onStartDemo: () => void;
  onNavigateLegal: (view: 'terms' | 'privacy' | 'refund') => void;
}

const PLAN_FEATURES = {
  'Starter': [
    '1 Accounting Entity (QB or Xero)',
    'Weekly Automated Scans',
    'Basic AI Duplicate Detection',
    'Email Support',
    'Secure Cloud Backup'
  ],
  'Professional': [
    'Up to 5 Accounting Entities',
    'Daily Automated Scans',
    'Advanced AI & Fuzzy Matching',
    'Audit Logs & Team Access',
    'Priority Email Support',
    'Custom Exclusion Rules'
  ],
  'Enterprise': [
    'Unlimited Accounting Entities',
    'Real-time Monitoring',
    'Custom AI Model Training',
    'Unlimited Team Members',
    'Dedicated Account Manager',
    'API Access for Workflows'
  ]
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onUpgrade, onStartDemo, onNavigateLegal }) => {
  const [showHelp, setShowHelp] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo variant="light" />
            <div className="flex items-center space-x-6">
              <button 
                onClick={onLogin}
                className="text-slate-300 hover:text-white font-medium px-4 py-2 transition-colors text-lg"
              >
                Log in
              </button>
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-500/40 text-lg flex items-center"
              >
                Get Started <ArrowRight size={20} className="ml-2"/>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden bg-slate-900 pt-20 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
          <button 
            onClick={onGetStarted}
            className="inline-flex items-center px-5 py-2 rounded-full bg-blue-600/10 border-2 border-blue-500/30 text-blue-400 text-sm font-bold mb-8 animate-neon-pulse transition-all duration-700 hover:bg-blue-600/20 hover:border-blue-400/50 active:scale-95 cursor-pointer"
            title="Start your 7-day free trial"
          >
            <Zap size={16} className="mr-2 fill-current" /> 7-day free detection trial
          </button>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Stop Paying Twice. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Automate Deduplication.
            </span>
          </h1>
          
          <div className="max-w-3xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="text-2xl md:text-3xl text-slate-300 leading-relaxed mb-6">
              Dup-Detect connects to <strong>QuickBooks Online & Xero</strong> to identify duplicate transactions. <span className="text-blue-400 font-semibold">Try it free for 7 days!</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <button 
              onClick={onGetStarted}
              className="group flex items-center justify-center space-x-2 bg-white text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <span>Start Free Detection Trial</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onStartDemo}
              className="flex items-center justify-center space-x-2 bg-slate-800/50 text-white border border-slate-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition-all backdrop-blur-sm hover:border-blue-500/50"
            >
              <PlayCircle size={20} className="text-blue-400" />
              <span>Watch Live Demo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="py-24 bg-gradient-to-b from-blue-200/30 to-slate-50 border-t border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
                <p className="text-slate-500 mt-4">7-day free detection trial included with every registration.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Starter Plan */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$19</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        {PLAN_FEATURES['Starter'].map((feature, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-600">
                                <Check size={16} className="text-green-500 mr-2 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Starter', '19')} 
                        className="mt-8 w-full py-3 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 text-slate-900 font-semibold rounded-lg transition-all"
                    >
                        Choose Starter
                    </button>
                </div>

                {/* Professional Plan */}
                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl transform md:-translate-y-4 relative z-10 border border-slate-800 flex flex-col">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">BEST VALUE</div>
                    <h3 className="text-lg font-semibold text-white">Professional</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-white">$49</span>
                        <span className="text-slate-400 ml-1">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        {PLAN_FEATURES['Professional'].map((feature, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-300">
                                <Check size={16} className="text-blue-400 mr-2 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Professional', '49')}
                        className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Choose Professional
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$149</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <ul className="mt-8 space-y-4 flex-1">
                        {PLAN_FEATURES['Enterprise'].map((feature, i) => (
                            <li key={i} className="flex items-start text-sm text-slate-600">
                                <Check size={16} className="text-green-500 mr-2 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Enterprise', '149')}
                        className="mt-8 w-full py-3 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 text-slate-900 font-semibold rounded-lg transition-all"
                    >
                        Choose Enterprise
                    </button>
                </div>
            </div>
        </div>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                      <Logo variant="light" className="scale-75 origin-left" />
                      <p className="text-xs mt-2 opacity-60">
                          &copy; 2026 Dat-assist Ltd. All rights reserved.
                      </p>
                  </div>
                  <div className="flex space-x-8 text-sm font-medium">
                      <button onClick={() => onNavigateLegal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
                      <button onClick={() => onNavigateLegal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                      <button onClick={() => onNavigateLegal('refund')} className="hover:text-white transition-colors">Refund Policy</button>
                      <button onClick={() => setShowHelp(true)} className="hover:text-white transition-colors">Contact Support</button>
                  </div>
              </div>
          </div>
      </footer>

      <HelpCenter 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
};

export default LandingPage;