import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, Legend } from 'recharts';
import { ArrowUpRight, CheckCircle, AlertTriangle, Activity, Link, RotateCw, Globe, Building, DollarSign, TrendingUp, X, Zap, Shield, Check, Star, ChevronRight, LayoutList } from 'lucide-react';
import { ScanResult, UserProfile } from '../types';

interface DashboardProps {
  scanHistory: ScanResult[];
  user: UserProfile;
  onConnectQuickBooks: () => void;
  onConnectXero: () => void;
  isConnectingQB: boolean;
  isConnectingXero: boolean;
  onUpgrade?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ scanHistory, user, onConnectQuickBooks, onConnectXero, isConnectingQB, isConnectingXero, onUpgrade }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [dismissOnboarding, setDismissOnboarding] = useState(false);

  const data = scanHistory.slice(0, 7).reverse().map(s => ({
    name: s.date.slice(5),
    duplicates: s.duplicatesFound
  }));

  const totalDuplicates = scanHistory.reduce((acc, curr) => acc + curr.duplicatesFound, 0);
  // Calculate mock savings: approx $150 per duplicate on average (time + potential error cost)
  const totalSavings = totalDuplicates * 150 + 1250; 
  const successRate = 98; // Mocked

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const pieData = [
    { name: 'Invoices', value: 400 },
    { name: 'Bills', value: 300 },
    { name: 'Payments', value: 300 },
    { name: 'Journals', value: 200 },
  ];

  // Mock Savings Data for the new Composed Chart
  const savingsData = [
      { month: 'May', saved: 1200, count: 8 },
      { month: 'Jun', saved: 1850, count: 12 },
      { month: 'Jul', saved: 3200, count: 18 },
      { month: 'Aug', saved: 2900, count: 15 },
      { month: 'Sep', saved: 4100, count: 22 },
      { month: 'Oct', saved: 5600, count: 28 },
  ];

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = () => {
    setShowUpgradeModal(false);
    if (onUpgrade) onUpgrade();
  };

  // Calculate Onboarding Progress
  const steps = [
      { id: 1, label: 'Create Account', completed: true },
      { id: 2, label: 'Connect Accounting Software', completed: user.isQuickBooksConnected || user.isXeroConnected },
      { id: 3, label: 'Run First Scan', completed: scanHistory.length > 0 },
      { id: 4, label: 'Upgrade to Professional', completed: user.plan !== 'Starter' }
  ];
  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const nextStep = steps.find(s => !s.completed);

  return (
    <div className="space-y-6 relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center flex-wrap gap-3">
            Dashboard
            {(user.isQuickBooksConnected || user.isXeroConnected) && user.companyName && (
                <>
                    <span className="text-slate-300 font-light hidden sm:inline">/</span>
                    <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-lg border border-blue-100 font-medium animate-in fade-in slide-in-from-left-2">
                        <Building size={18} className="mr-2 opacity-75" />
                        {user.companyName}
                    </span>
                </>
            )}
        </h2>
        <p className="text-slate-500 mt-2">Welcome back, <span className="font-semibold text-slate-700">{user.name}</span>! Here is your duplicate detection summary.</p>
      </div>

      {/* Onboarding / Setup Progress Widget */}
      {!dismissOnboarding && progressPercentage < 100 && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-6 animate-in slide-in-from-top-4 duration-500">
              <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center">
                              <LayoutList className="mr-2 text-blue-600" size={20}/>
                              Setup Progress
                          </h3>
                          <span className="text-sm font-bold text-blue-600">{Math.round(progressPercentage)}% Complete</span>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                          {steps.map((step, idx) => (
                              <div key={step.id} className={`flex items-center text-xs px-2 py-1 rounded-md border ${step.completed ? 'bg-green-50 border-green-200 text-green-700' : idx === completedSteps ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold ring-2 ring-blue-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                  {step.completed ? <CheckCircle size={12} className="mr-1.5"/> : <span className="w-3 h-3 rounded-full border border-current mr-1.5 flex items-center justify-center text-[8px]">{step.id}</span>}
                                  {step.label}
                              </div>
                          ))}
                      </div>
                  </div>

                  {nextStep && (
                      <div className="flex items-center bg-white p-3 rounded-lg border border-blue-100 shadow-sm md:ml-4 w-full md:w-auto">
                          <div className="mr-3">
                              <p className="text-xs text-slate-500 uppercase font-bold">Next Step</p>
                              <p className="text-sm font-semibold text-slate-800">{nextStep.label}</p>
                          </div>
                          <button 
                             onClick={() => {
                                 // Logic to navigate or trigger action based on nextStep
                                 if (nextStep.id === 2 && !user.isQuickBooksConnected) onConnectQuickBooks();
                                 else if (nextStep.id === 4 && onUpgrade) onUpgrade();
                             }}
                             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                          >
                              <ChevronRight size={18} />
                          </button>
                      </div>
                  )}
                  
                  <button onClick={() => setDismissOnboarding(true)} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500">
                      <X size={16} />
                  </button>
              </div>
          </div>
      )}

      {/* Connection Banners - Show if not connected */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!user.isQuickBooksConnected && (
            <div className="bg-slate-900 rounded-xl p-6 shadow-lg flex flex-col items-start justify-between border border-slate-700 relative overflow-hidden h-full">
              {/* Decorator */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2CA01C] rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
              
              <div className="flex items-center space-x-4 z-10 mb-4">
                 <div className="w-10 h-10 bg-[#2CA01C] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-white font-bold text-lg">qb</span>
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-lg">QuickBooks Online</h3>
                   <p className="text-slate-400 text-xs">Sync your QBO data.</p>
                 </div>
              </div>
              <button 
                onClick={onConnectQuickBooks}
                disabled={isConnectingQB}
                className="z-10 w-full px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-wait text-sm"
              >
                {isConnectingQB ? (
                   <><RotateCw className="animate-spin mr-2" size={16} /> Connecting...</>
                ) : (
                   <><Link className="mr-2" size={16} /> Connect</>
                )}
              </button>
            </div>
          )}

          {!user.isXeroConnected && (
            <div className="bg-slate-900 rounded-xl p-6 shadow-lg flex flex-col items-start justify-between border border-slate-700 relative overflow-hidden h-full">
              {/* Decorator */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b7e2] rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
              
              <div className="flex items-center space-x-4 z-10 mb-4">
                 <div className="w-10 h-10 bg-[#00b7e2] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-white font-bold text-lg">X</span>
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-lg">Xero</h3>
                   <p className="text-slate-400 text-xs">Connect your Xero org.</p>
                 </div>
              </div>
              <button 
                onClick={onConnectXero}
                disabled={isConnectingXero}
                className="z-10 w-full px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-wait text-sm"
              >
                {isConnectingXero ? (
                   <><RotateCw className="animate-spin mr-2" size={16} /> Connecting...</>
                ) : (
                   <><Link className="mr-2" size={16} /> Connect</>
                )}
              </button>
            </div>
          )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Duplicates</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalDuplicates}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-green-600 text-sm mt-4 flex items-center">
            <ArrowUpRight size={14} className="mr-1" />
            12 detected today
          </p>
        </div>

        {/* Estimated Savings Card (New) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Estimated Savings</p>
                    <h3 className="text-3xl font-bold text-emerald-600 mt-2">${totalSavings.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DollarSign size={20} />
                </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">Based on potential duplicate value</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Scan Success Rate</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{successRate}%</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">Last 30 days</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Current Plan</p>
            <h3 className="text-2xl font-bold mt-2">{user.plan}</h3>
            <p className="text-xs text-indigo-200 mt-1">Next billing: Nov 01</p>
          </div>
          {user.plan !== 'Enterprise' && (
              <button 
                onClick={handleUpgradeClick}
                className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={14} fill="currentColor" /> Upgrade Plan
              </button>
          )}
        </div>
      </div>

      {/* Financial Impact Chart (New) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Financial Impact Analysis</h3>
                <p className="text-slate-500 text-sm">Money saved vs. duplicates resolved over time.</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg flex items-center text-sm font-semibold">
                <TrendingUp size={16} className="mr-2"/>
                High Impact
            </div>
        </div>
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={savingsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke="#10B981" 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(val) => `$${val}`}
                        tick={{fill: '#059669', fontSize: 12}}
                    />
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke="#3B82F6" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{fill: '#2563eb', fontSize: 12}}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any, name: any) => {
                            if (name === 'Amount Saved ($)') return [`$${value}`, name];
                            return [value, name];
                        }}
                    />
                    <Legend iconType="circle" />
                    <Bar yAxisId="right" dataKey="count" name="Duplicates Resolved" fill="#3B82F6" barSize={30} radius={[4, 4, 0, 0]} />
                    <Area type="monotone" yAxisId="left" dataKey="saved" name="Amount Saved ($)" stroke="#10B981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={3} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Existing Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Detections</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#94a3b8'}} axisLine={false} />
                <YAxis tick={{fill: '#94a3b8'}} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="duplicates" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Duplicates by Type</h3>
          <div className="h-64 flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-slate-500 flex-wrap">
             {pieData.map((d, i) => (
                <div key={i} className="flex items-center">
                   <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                   {d.name}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Upgrade Details Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row">
               {/* Close Button */}
               <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 p-1 bg-white/50 rounded-full"
               >
                   <X size={24} />
               </button>

               {/* Left: Value Proposition */}
               <div className="bg-slate-900 text-white p-8 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-600 rounded-full blur-[60px] opacity-40"></div>
                   
                   <div className="relative z-10">
                       <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-blue-900/50">
                           <Zap size={24} fill="white" />
                       </div>
                       <h2 className="text-2xl font-bold mb-2">Unlock Pro Power</h2>
                       <p className="text-slate-300 text-sm leading-relaxed">
                           Take control of your finances with automated daily scans, multi-user access, and advanced AI insights.
                       </p>
                   </div>

                   <div className="relative z-10 mt-8">
                       <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                           <Star size={16} fill="currentColor"/>
                           <Star size={16} fill="currentColor"/>
                           <Star size={16} fill="currentColor"/>
                           <Star size={16} fill="currentColor"/>
                           <Star size={16} fill="currentColor"/>
                       </div>
                       <p className="text-xs text-slate-400">"Dup-Detect Professional saved us 15 hours a month!"</p>
                   </div>
               </div>

               {/* Right: Plan Comparison */}
               <div className="p-8 md:w-3/5 bg-white">
                   <h3 className="text-xl font-bold text-slate-800 mb-6">Why Upgrade to Professional?</h3>
                   
                   <div className="space-y-4 mb-8">
                       <div className="flex items-start">
                           <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                               <Check size={14} className="text-green-600" strokeWidth={3}/>
                           </div>
                           <div>
                               <h4 className="font-semibold text-slate-800 text-sm">5 Accounting Files</h4>
                               <p className="text-xs text-slate-500">Manage multiple entities (QB or Xero).</p>
                           </div>
                       </div>
                       <div className="flex items-start">
                           <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                               <Check size={14} className="text-green-600" strokeWidth={3}/>
                           </div>
                           <div>
                               <h4 className="font-semibold text-slate-800 text-sm">Automated Daily Scans</h4>
                               <p className="text-xs text-slate-500">Set it and forget it. We'll email you results.</p>
                           </div>
                       </div>
                       <div className="flex items-start">
                           <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                               <Check size={14} className="text-green-600" strokeWidth={3}/>
                           </div>
                           <div>
                               <h4 className="font-semibold text-slate-800 text-sm">Advanced AI Analysis</h4>
                               <p className="text-xs text-slate-500">Detect fuzzy matches and complex duplicates.</p>
                           </div>
                       </div>
                       <div className="flex items-start">
                           <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                               <Check size={14} className="text-green-600" strokeWidth={3}/>
                           </div>
                           <div>
                               <h4 className="font-semibold text-slate-800 text-sm">Audit Logs & Team Access</h4>
                               <p className="text-xs text-slate-500">Track who did what and invite 2 team members.</p>
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                       <div>
                           <span className="block text-xs text-slate-500 uppercase font-bold">Price</span>
                           <div className="flex items-baseline">
                               <span className="text-3xl font-bold text-slate-900">$49</span>
                               <span className="text-sm text-slate-500">/mo</span>
                           </div>
                       </div>
                       <button 
                           onClick={confirmUpgrade}
                           className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1"
                       >
                           Upgrade Now
                       </button>
                   </div>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;