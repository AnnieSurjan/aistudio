import React, { useState } from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock, Database, PlayCircle, Star } from 'lucide-react';
import Logo from './Logo';
import LegalModal from './LegalModal';
import HelpCenter from './HelpCenter';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onUpgrade: (plan: string, price: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onUpgrade }) => {
  const [showLegal, setShowLegal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms');

  const openLegal = (tab: 'terms' | 'privacy') => {
      setLegalTab(tab);
      setShowLegal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation - Now Dark for High Contrast */}
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

      {/* Hero Section - Dark Theme with Grid Pattern */}
      <div className="relative overflow-hidden bg-slate-900 pt-20 pb-24 lg:pt-32 lg:pb-40">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        </div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Stop Paying Twice. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Automate Deduplication.
            </span>
          </h1>
          
          <p className="max-w-2xl text-xl text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            DupDetect connects to QuickBooks Online and uses advanced AI to identify, flag, and resolve duplicate transactions that human eyes miss.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <button 
              onClick={onGetStarted}
              className="group flex items-center justify-center space-x-2 bg-white text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-center space-x-2 bg-slate-800/50 text-white border border-slate-700 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition-all backdrop-blur-sm">
              <PlayCircle size={20} className="text-blue-400" />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="mt-12 flex items-center space-x-4 text-sm text-slate-500 animate-in fade-in zoom-in duration-1000 delay-500">
             <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs text-white font-medium">
                        {String.fromCharCode(64+i)}
                    </div>
                ))}
             </div>
             <p>Trusted by 2,000+ Accountants</p>
             <div className="flex text-yellow-500">
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
                 <Star size={14} fill="currentColor" />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Seamlessly connected */}
      <div className="bg-slate-900 border-t border-slate-800 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="p-4">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-2">$250k+</div>
                    <div className="text-slate-400 font-medium">Potential Savings Identified</div>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 mb-2">1.5k+</div>
                    <div className="text-slate-400 font-medium">Hours of Manual Work Saved</div>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-600 mb-2">99.9%</div>
                    <div className="text-slate-400 font-medium">AI Detection Accuracy</div>
                </div>
            </div>
        </div>
      </div>

      {/* Features Grid - Darker Gradient Background */}
      <div className="py-24 bg-gradient-to-b from-slate-100 via-blue-100/50 to-blue-200/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Why Accountants Choose DupDetect</h2>
                <p className="text-slate-500 mt-4 max-w-2xl mx-auto">We don't just match numbers. Our AI understands context, memos, and fuzzy vendor names.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { icon: Shield, title: "Bank-Level Security", desc: "Your financial data is encrypted and we never modify without your explicit confirmation." },
                    { icon: TrendingUp, title: "AI-Powered Detection", desc: "Finds duplicates that exact-match logic misses, like 'Home Depot' vs 'The Home Depot'." },
                    { icon: Clock, title: "Automated Schedules", desc: "Set scans to run hourly, daily, or weekly. Receive PDF reports directly to your inbox." },
                    { icon: Database, title: "Deep Integration", desc: "Seamlessly connects with QuickBooks Online via official APIs for real-time syncing." },
                    { icon: CheckCircle, title: "One-Click Resolve", desc: "Merge or delete duplicate transactions safely with automatic undo backups." },
                    { icon: ArrowRight, title: "Multi-User Roles", desc: "Grant view-only access to auditors and full control to senior accountants." }
                ].map((feature, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                            <feature.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Pricing - Continued Gradient */}
      <div className="py-24 bg-gradient-to-b from-blue-200/30 to-slate-50 border-t border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
                <p className="text-slate-500 mt-4">Choose the plan that fits your business size.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Starter */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$19</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">For micro-businesses & freelancers.</p>
                    <ul className="mt-6 space-y-4 text-sm flex-1">
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> 1 QuickBooks Account</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> <b>AI Detection Engine</b></li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Manual Scans</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Basic Email Support</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Secure PDF Reports</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> 30-Day History</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> SSL Encryption</li>
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Starter', '19')} 
                        className="mt-8 w-full py-3 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 text-slate-900 font-semibold rounded-lg transition-all"
                    >
                        Choose Starter
                    </button>
                </div>

                {/* Professional */}
                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl transform md:-translate-y-4 relative z-10 border border-slate-800 flex flex-col">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">MOST POPULAR</div>
                    <h3 className="text-lg font-semibold text-white">Professional</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-white">$49</span>
                        <span className="text-slate-400 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">For growing SMEs & firms.</p>
                    <ul className="mt-6 space-y-4 text-sm flex-1">
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> Up to 5 QuickBooks Accounts</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> <b>Advanced AI Detection</b></li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> Automated Daily Scans</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> <b>Audit Logs & Activity Tracking</b></li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> Smart Exclusion Rules</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> CSV & Excel Exports</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> Priority Chat Support</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2 shrink-0"/> Multi-User Access (3 Users)</li>
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Professional', '49')}
                        className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Choose Professional
                    </button>
                </div>

                {/* Enterprise */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:border-blue-300 hover:shadow-md transition-all flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$149</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">For large firms & auditors.</p>
                    <ul className="mt-6 space-y-4 text-sm flex-1">
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Unlimited QuickBooks Accounts</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> <b>Custom AI Detection Rules</b></li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> <b>Real-time & Scheduled Scans</b></li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Full Audit Trails & Compliance</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> Dedicated Account Manager</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> API Access & Webhooks</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> SSO & Role-Based Access</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2 shrink-0"/> White-label Reports</li>
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

      {/* Footer - Minimal & Clean */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                      <Logo variant="light" className="scale-75 origin-left" />
                      <p className="text-xs mt-2 opacity-60">
                          &copy; 2026 Dat-assist Kft. All rights reserved.
                      </p>
                  </div>
                  <div className="flex space-x-8 text-sm font-medium">
                      <button onClick={() => openLegal('terms')} className="hover:text-white transition-colors">Terms of Service</button>
                      <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
                      <button onClick={() => setShowHelp(true)} className="hover:text-white transition-colors">Contact Support</button>
                  </div>
              </div>
          </div>
      </footer>

      <LegalModal 
        isOpen={showLegal} 
        onClose={() => setShowLegal(false)} 
        initialTab={legalTab} 
      />
      <HelpCenter 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </div>
  );
};

export default LandingPage;