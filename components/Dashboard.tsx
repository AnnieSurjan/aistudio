import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, CheckCircle, AlertTriangle, Activity, Link, RotateCw } from 'lucide-react';
import { ScanResult, UserProfile } from '../types';

interface DashboardProps {
  scanHistory: ScanResult[];
  user: UserProfile;
  onConnectQuickBooks: () => void;
  isConnectingQB: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ scanHistory, user, onConnectQuickBooks, isConnectingQB }) => {
  const data = scanHistory.slice(0, 7).reverse().map(s => ({
    name: s.date.slice(5),
    duplicates: s.duplicatesFound
  }));

  const totalDuplicates = scanHistory.reduce((acc, curr) => acc + curr.duplicatesFound, 0);
  const successRate = 98; // Mocked

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const pieData = [
    { name: 'Invoices', value: 400 },
    { name: 'Bills', value: 300 },
    { name: 'Payments', value: 300 },
    { name: 'Journals', value: 200 },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back! Here is your duplicate detection summary.</p>
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
              <p className="text-slate-500 text-sm font-medium">Total Duplicates Found</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalDuplicates}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-green-600 text-sm mt-4 flex items-center">
            <ArrowUpRight size={14} className="mr-1" />
            12% increase this week
          </p>
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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-medium">Pending Review</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">15</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-orange-600 text-sm mt-4 cursor-pointer hover:underline">
            Action required
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Current Plan</p>
            <h3 className="text-2xl font-bold mt-2">Professional</h3>
            <p className="text-xs text-indigo-200 mt-1">Next billing: Nov 01</p>
          </div>
          <button className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Duplicate Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#94a3b8'}} axisLine={false} />
                <YAxis tick={{fill: '#94a3b8'}} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="duplicates" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
          <div className="flex justify-center gap-4 text-sm text-slate-500">
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