import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, Legend } from 'recharts';
import { ArrowUpRight, CheckCircle, AlertTriangle, Activity, Link, RotateCw, Globe, Building, DollarSign, TrendingUp } from 'lucide-react';
import { ScanResult, UserProfile } from '../types';

interface DashboardProps {
  scanHistory: ScanResult[];
  user: UserProfile;
  onConnectQuickBooks: () => void;
  isConnectingQB: boolean;
  onUpgrade?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ scanHistory, user, onConnectQuickBooks, isConnectingQB, onUpgrade }) => {
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center flex-wrap gap-3">
            Dashboard
            {user.isQuickBooksConnected && user.companyName && (
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

      {/* Connect QuickBooks Banner - Show only if not connected */}
      {!user.isQuickBooksConnected && (
        <div className="bg-slate-900 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between border border-slate-700 relative overflow-hidden">
          {/* Decorator */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          
          <div className="flex items-center space-x-4 z-10 mb-4 md:mb-0">
             <div className="w-12 h-12 bg-[#2CA01C] rounded-lg flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white font-bold text-xl">qb</span>
             </div>
             <div>
               <h3 className="text-white font-bold text-lg">Connect QuickBooks Online</h3>
               <p className="text-slate-400 text-sm">Sync your transactions to start finding duplicates automatically.</p>
             </div>
          </div>
          <button 
            onClick={onConnectQuickBooks}
            disabled={isConnectingQB}
            className="z-10 px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold shadow-md transition-all flex items-center shrink-0 disabled:opacity-70 disabled:cursor-wait"
          >
            {isConnectingQB ? (
               <>
                 <RotateCw className="animate-spin mr-2" size={18} />
                 Connecting...
               </>
            ) : (
               <>
                 <Link className="mr-2" size={18} />
                 Connect Now
               </>
            )}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                onClick={onUpgrade}
                className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition-colors"
              >
                Upgrade Plan
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
    </div>
  );
};

export default Dashboard;