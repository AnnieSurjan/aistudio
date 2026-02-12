import React, { useState } from 'react';
import { UserProfile as IUserProfile } from '../types';
import { CreditCard, Mail, Shield, Link, CheckCircle, RotateCw } from 'lucide-react';

interface UserProfileProps {
  user: IUserProfile;
  onConnectQuickBooks?: () => void;
  isConnectingQB?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onConnectQuickBooks, isConnectingQB }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>

      {/* Integration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Link className="mr-2 text-blue-600" size={20}/>
                Integrations
             </h3>
             {user.isQuickBooksConnected && (
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                    <CheckCircle size={12} className="mr-1"/> Connected
                 </span>
             )}
        </div>
        <div className="p-8">
            <div className="flex items-start md:items-center flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#2CA01C] rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-2xl">qb</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-900">QuickBooks Online</h4>
                        <p className="text-sm text-slate-500">
                            {user.isQuickBooksConnected 
                                ? `Syncing with ${user.companyName}` 
                                : 'Connect your accounting software to start scanning.'}
                        </p>
                    </div>
                </div>
                
                {user.isQuickBooksConnected ? (
                    <button className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">
                        Disconnect
                    </button>
                ) : (
                    <button 
                        onClick={onConnectQuickBooks}
                        disabled={isConnectingQB}
                        className="px-6 py-3 bg-[#2CA01C] hover:bg-[#238016] text-white rounded-lg font-bold shadow-lg shadow-green-900/10 transition-all flex items-center disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isConnectingQB && <RotateCw className="animate-spin mr-2" size={18}/>}
                        Connect to QuickBooks
                    </button>
                )}
            </div>
            {!user.isQuickBooksConnected && (
                <p className="mt-4 text-xs text-slate-400 italic bg-slate-50 p-3 rounded border border-slate-100">
                    Secure connection using OAuth 2.0. Client ID: ABiIA...JBd2
                </p>
            )}
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center space-x-6 mb-8">
           <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
              {user.name.charAt(0)}
           </div>
           <div>
              <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
              <p className="text-slate-500">{user.companyName}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Mail className="text-slate-400" size={20}/>
                    <span className="text-slate-800">{user.email}</span>
                </div>
            </div>
             <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Current Plan</label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3">
                         <CreditCard className="text-slate-400" size={20}/>
                         <span className="text-slate-800 font-medium">{user.plan} Plan</span>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:underline">Manage</button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Security Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Shield className="mr-2 text-green-600" size={20}/>
            Security & Backup
        </h3>
        <p className="text-sm text-slate-500 mb-6">Dup-Detect performs daily secure backups of your transactions before any deletion occurs.</p>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Two-Factor Authentication</span>
                <button className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-sm hover:bg-slate-300">Enable</button>
            </div>
            <div className="flex items-center justify-between py-3">
                <span className="text-slate-700">Activity Logs</span>
                <button className="text-blue-600 text-sm hover:underline">Download CSV</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;