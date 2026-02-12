import React from 'react';
import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock, Database } from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onUpgrade: (plan: string, price: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onUpgrade }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo variant="dark" />
            <div className="flex items-center space-x-4">
              <button 
                onClick={onLogin}
                className="text-slate-600 hover:text-blue-600 font-medium px-3 py-2 transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white pb-16 pt-20 lg:pb-24 lg:pt-32">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Stop Paying Twice. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Automate Deduplication.
            </span>
          </h1>
          <p className="max-w-2xl text-xl text-slate-500 mb-10">
            DupDetect uses AI to scan your QuickBooks transactions, identifying duplicates before they affect your bottom line. Join thousands of accountants saving hours every week.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={onGetStarted}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
            >
              <span>Start Free Trial</span>
              <ArrowRight size={20} />
            </button>
            <button className="flex items-center justify-center space-x-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition-all">
              <span>View Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats / Value Prop Section */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="p-4">
                    <div className="text-4xl font-bold text-green-400 mb-2">$250k+</div>
                    <div className="text-slate-400 font-medium">Potential Savings Identified</div>
                    <p className="text-slate-500 text-sm mt-2">Helping startups optimize cashflow</p>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-blue-400 mb-2">1,500+</div>
                    <div className="text-slate-400 font-medium">Hours of Manual Work Saved</div>
                    <p className="text-slate-500 text-sm mt-2">Automated scanning runs 24/7</p>
                </div>
                <div className="p-4">
                    <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
                    <div className="text-slate-400 font-medium">Detection Accuracy</div>
                    <p className="text-slate-500 text-sm mt-2">Powered by Gemini AI models</p>
                </div>
            </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-50">
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
                    <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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

      {/* Pricing */}
      <div className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
                <p className="text-slate-500 mt-4">Choose the plan that fits your business size.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Starter */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                    <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$19</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">For micro-businesses & freelancers.</p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> 1 QuickBooks File</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> Manual Scans</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> Email Support</li>
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Starter', '19')} 
                        className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                        Choose Starter
                    </button>
                </div>

                {/* Professional */}
                <div className="bg-slate-900 p-8 rounded-2xl shadow-xl transform scale-105 relative z-10">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                    <h3 className="text-lg font-semibold text-white">Professional</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-white">$49</span>
                        <span className="text-slate-400 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">For growing SMEs & firms.</p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2"/> Up to 5 Files</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2"/> AI Detection Engine</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2"/> Automated Daily Scans</li>
                        <li className="flex items-center text-slate-300"><CheckCircle size={16} className="text-blue-400 mr-2"/> CSV Export</li>
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Professional', '49')}
                        className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                    >
                        Choose Pro
                    </button>
                </div>

                {/* Enterprise */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
                    <div className="mt-4 flex items-baseline">
                        <span className="text-4xl font-bold text-slate-900">$149</span>
                        <span className="text-slate-500 ml-1">/mo</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">For large firms & audit partners.</p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> Unlimited Files</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> API Access</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> Custom Integrations</li>
                        <li className="flex items-center text-slate-600"><CheckCircle size={16} className="text-green-500 mr-2"/> Priority Phone Support</li>
                    </ul>
                    <button 
                        onClick={() => onUpgrade('Enterprise', '149')}
                        className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
                    >
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <Logo variant="dark" className="mb-4 md:mb-0" />
            <div className="text-slate-500 text-sm">
                &copy; 2024 DupDetect Inc. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-slate-400 hover:text-slate-600 text-sm">Privacy Policy</a>
                <a href="#" className="text-slate-400 hover:text-slate-600 text-sm">Terms of Service</a>
                <a href="#" className="text-slate-400 hover:text-slate-600 text-sm">Support</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;