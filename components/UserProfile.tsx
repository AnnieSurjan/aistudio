import React, { useState } from 'react';
import { UserProfile as IUserProfile, UserRole } from '../types';
import { CreditCard, Mail, Shield, Link, CheckCircle, RotateCw, UserPlus, Send, Users, MoreHorizontal, Clock, FileText, Scale, Key, Trash2, HelpCircle } from 'lucide-react';

interface UserProfileProps {
  user: IUserProfile;
  onConnectQuickBooks?: () => void;
  onConnectXero?: () => void;
  isConnectingQB?: boolean;
  isConnectingXero?: boolean;
  onManagePlan?: () => void;
  onNavigateLegal: (view: 'terms' | 'privacy' | 'refund') => void;
}

const INITIAL_TEAM = [
  { id: 1, name: 'Sarah Finance', email: 'sarah@finance-pro.com', role: 'VIEWER', status: 'Active' },
  { id: 2, name: 'Mike Auditor', email: 'mike@external-audit.com', role: 'VIEWER', status: 'Pending' },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, onConnectQuickBooks, onConnectXero, isConnectingQB, isConnectingXero, onManagePlan, onNavigateLegal }) => {
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const canInvite = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteStatus('sending');
    setTimeout(() => {
        const newUser = { id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail, role: inviteRole, status: 'Pending' };
        setTeamMembers(prev => [...prev, newUser]);
        setInviteStatus('success');
        setInviteEmail('');
        setTimeout(() => setInviteStatus('idle'), 3000);
    }, 1500);
  };
  
  const handleRemoveUser = (id: number) => {
      if (window.confirm("Are you sure you want to remove this user?")) {
          setTeamMembers(prev => prev.filter(m => m.id !== id));
      }
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          alert("New passwords do not match.");
          return;
      }
      setIsChangingPassword(true);
      setTimeout(() => {
          setIsChangingPassword(false);
          setShowPasswordModal(false);
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          alert("Password changed successfully.");
      }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>

      {/* Integration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Link className="mr-2 text-blue-600" size={20}/> Integrations
             </h3>
        </div>
        <div className="p-8 space-y-6">
            {/* QuickBooks Row */}
            <div className="flex items-start md:items-center flex-col md:flex-row justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#2CA01C] rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xl">qb</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-900">QuickBooks Online</h4>
                             {user.isQuickBooksConnected && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center"><CheckCircle size={10} className="mr-1"/> Active</span>}
                        </div>
                        <p className="text-sm text-slate-500">{user.isQuickBooksConnected ? `Syncing with ${user.companyName}` : 'Connect your QuickBooks account.'}</p>
                    </div>
                </div>
                {user.isQuickBooksConnected ? <button className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">Disconnect</button> : <button onClick={onConnectQuickBooks} disabled={isConnectingQB} className="px-6 py-2.5 bg-[#2CA01C] hover:bg-[#238016] text-white rounded-lg font-bold shadow-lg shadow-green-900/10 transition-all flex items-center disabled:opacity-70 disabled:cursor-wait text-sm">{isConnectingQB && <RotateCw className="animate-spin mr-2" size={16}/>} Connect</button>}
            </div>

            {/* Xero Row */}
            <div className="flex items-start md:items-center flex-col md:flex-row justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#00b7e2] rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xl">X</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h4 className="text-lg font-semibold text-slate-900">Xero</h4>
                             {user.isXeroConnected && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center"><CheckCircle size={10} className="mr-1"/> Active</span>}
                        </div>
                        <p className="text-sm text-slate-500">{user.isXeroConnected ? `Syncing with ${user.companyName}` : 'Connect your Xero organization.'}</p>
                    </div>
                </div>
                {user.isXeroConnected ? <button className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">Disconnect</button> : <button onClick={onConnectXero} disabled={isConnectingXero} className="px-6 py-2.5 bg-[#00b7e2] hover:bg-[#009ec3] text-white rounded-lg font-bold shadow-lg shadow-cyan-900/10 transition-all flex items-center disabled:opacity-70 disabled:cursor-wait text-sm">{isConnectingXero && <RotateCw className="animate-spin mr-2" size={16}/>} Connect</button>}
            </div>
        </div>
      </div>

      {/* Security & Legal Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Shield className="mr-2 text-green-600" size={20}/> Security & Legal Documentation
        </h3>
        <p className="text-sm text-slate-500 mb-6">Review your agreement with Dat-assist Kft. and manage your security settings.</p>
        
        <div className="space-y-4">
             <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Password</span>
                <button onClick={() => setShowPasswordModal(true)} className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm transition-colors">
                    <Key size={14} className="mr-1.5"/> Change Password
                </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Terms of Service</span>
                <button onClick={() => onNavigateLegal('terms')} className="text-blue-600 text-sm hover:underline flex items-center">
                    <FileText size={14} className="mr-1"/> View Agreement
                </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Privacy & GDPR Policy</span>
                <button onClick={() => onNavigateLegal('privacy')} className="text-blue-600 text-sm hover:underline flex items-center">
                    <Scale size={14} className="mr-1"/> View Policy
                </button>
            </div>
             <div className="flex items-center justify-between py-3">
                <span className="text-slate-700">Refund Policy</span>
                <button onClick={() => onNavigateLegal('refund')} className="text-blue-600 text-sm hover:underline flex items-center">
                    <HelpCircle size={14} className="mr-1"/> Billing Terms
                </button>
            </div>
        </div>
      </div>
      
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input type="password" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input type="password" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input type="password" required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                         <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                         <button type="submit" disabled={isChangingPassword} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">{isChangingPassword ? 'Updating...' : 'Update Password'}</button>
                    </div>
                </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;