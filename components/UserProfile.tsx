import React, { useState } from 'react';
import { UserProfile as IUserProfile, UserRole } from '../types';
import { CreditCard, Mail, Shield, Link, CheckCircle, RotateCw, UserPlus, Send, Users, MoreHorizontal, Clock, FileText, Scale, Download, Image as ImageIcon } from 'lucide-react';
import LegalModal from './LegalModal';

interface UserProfileProps {
  user: IUserProfile;
  onConnectQuickBooks?: () => void;
  onConnectXero?: () => void;
  isConnectingQB?: boolean;
  isConnectingXero?: boolean;
  onManagePlan?: () => void;
}

// Mock data for existing team members
const MOCK_TEAM = [
  { id: 1, name: 'Sarah Finance', email: 'sarah@finance-pro.com', role: 'VIEWER', status: 'Active' },
  { id: 2, name: 'Mike Auditor', email: 'mike@external-audit.com', role: 'VIEWER', status: 'Pending' },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, onConnectQuickBooks, onConnectXero, isConnectingQB, isConnectingXero, onManagePlan }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  // Legal Modal State
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy'>('terms');

  // Check if user has permission to invite (Admin or Manager)
  const canInvite = user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteStatus('sending');
    
    // Simulate API call
    setTimeout(() => {
        setInviteStatus('success');
        setInviteEmail('');
        // Reset status after 3 seconds
        setTimeout(() => setInviteStatus('idle'), 3000);
    }, 1500);
  };
  
  const openLegal = (tab: 'terms' | 'privacy') => {
      setLegalTab(tab);
      setShowLegal(true);
  };

  const handleDownloadLogo = (variant: 'dark' | 'light') => {
    // Constructing a high-quality SVG programmatically matches the Logo component design
    const textColor1 = variant === 'dark' ? '#0f172a' : '#ffffff'; 
    const textColor2 = variant === 'dark' ? '#1e293b' : '#cbd5e1'; 
    const subColor = variant === 'dark' ? '#64748b' : '#94a3b8';
    const bgFill = variant === 'dark' ? 'none' : '#0f172a'; // Add dark background if light variant requested

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="600" height="160">
        ${variant === 'light' ? `<rect width="300" height="80" fill="${bgFill}" rx="10"/>` : ''}
        
        <!-- Logo Icon Group -->
        <g transform="translate(15, 15)">
            <!-- Blue Background -->
            <rect width="50" height="50" rx="12" fill="#2563eb" />
            <!-- File Icon Outline -->
            <path d="M18 12 H26 L34 20 V38 A2 2 0 0 1 32 40 H18 A2 2 0 0 1 16 38 V14 A2 2 0 0 1 18 12" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M26 12 V20 H34" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="20" y1="26" x2="30" y2="26" stroke="white" stroke-width="2.5" stroke-linecap="round" />
            <line x1="20" y1="32" x2="30" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round" />
            
            <!-- Search Bubble BG -->
            <circle cx="48" cy="48" r="14" fill="white" />
            <circle cx="48" cy="48" r="10" fill="#eff6ff" />
            <!-- Search Icon -->
            <circle cx="46" cy="46" r="4" stroke="#2563eb" stroke-width="2" fill="none"/>
            <line x1="49" y1="49" x2="52" y2="52" stroke="#2563eb" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- Text Group -->
        <g transform="translate(80, 50)">
             <text font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="${textColor1}">Dup</text>
             <text x="62" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="${textColor2}">-</text>
             <text x="75" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="#2563eb">Detect</text>
             
             <!-- Subtitle -->
             <text x="2" y="20" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="${subColor}" letter-spacing="2" text-transform="uppercase">Accounting Security</text>
        </g>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dup-detect-logo-${variant}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-800">Account Settings</h2>

      {/* Integration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Link className="mr-2 text-blue-600" size={20}/>
                Integrations
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
                             {user.isQuickBooksConnected && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                                    <CheckCircle size={10} className="mr-1"/> Active
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">
                            {user.isQuickBooksConnected 
                                ? `Syncing with ${user.companyName}` 
                                : 'Connect your QuickBooks account.'}
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
                        className="px-6 py-2.5 bg-[#2CA01C] hover:bg-[#238016] text-white rounded-lg font-bold shadow-lg shadow-green-900/10 transition-all flex items-center disabled:opacity-70 disabled:cursor-wait text-sm"
                    >
                        {isConnectingQB && <RotateCw className="animate-spin mr-2" size={16}/>}
                        Connect
                    </button>
                )}
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
                             {user.isXeroConnected && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                                    <CheckCircle size={10} className="mr-1"/> Active
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">
                            {user.isXeroConnected 
                                ? `Syncing with ${user.companyName}` 
                                : 'Connect your Xero organization.'}
                        </p>
                    </div>
                </div>
                
                {user.isXeroConnected ? (
                    <button className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">
                        Disconnect
                    </button>
                ) : (
                    <button 
                        onClick={onConnectXero}
                        disabled={isConnectingXero}
                        className="px-6 py-2.5 bg-[#00b7e2] hover:bg-[#009ec3] text-white rounded-lg font-bold shadow-lg shadow-cyan-900/10 transition-all flex items-center disabled:opacity-70 disabled:cursor-wait text-sm"
                    >
                        {isConnectingXero && <RotateCw className="animate-spin mr-2" size={16}/>}
                        Connect
                    </button>
                )}
            </div>
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
                    <button 
                        onClick={onManagePlan}
                        className="text-blue-600 text-sm font-medium hover:underline"
                    >
                        Manage
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Team Invitation Section (Restricted to Admin/Manager) */}
      {canInvite && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Users className="mr-2 text-indigo-600" size={20}/>
                    Team Management
                </h3>
                <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    {user.role} Access
                </span>
            </div>
            
            <div className="p-8">
                {/* Invite Form */}
                <div className="mb-8">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                        <UserPlus size={16} className="mr-2"/> 
                        Invite New User
                    </h4>
                    <form onSubmit={handleSendInvite} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex-1 w-full">
                            <input 
                                type="email" 
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="colleague@company.com" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select 
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value={UserRole.VIEWER}>Viewer</option>
                                <option value={UserRole.MANAGER}>Manager</option>
                                {user.role === UserRole.ADMIN && <option value={UserRole.ADMIN}>Admin</option>}
                            </select>
                        </div>
                        <button 
                            type="submit"
                            disabled={inviteStatus === 'sending' || inviteStatus === 'success'}
                            className={`px-6 py-2 rounded-lg font-medium text-white flex items-center justify-center transition-all min-w-[140px] ${
                                inviteStatus === 'success' 
                                ? 'bg-green-600' 
                                : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                        >
                            {inviteStatus === 'sending' ? (
                                <RotateCw className="animate-spin" size={18} />
                            ) : inviteStatus === 'success' ? (
                                <>
                                    <CheckCircle size={18} className="mr-2"/> Sent!
                                </>
                            ) : (
                                <>
                                    <Send size={18} className="mr-2"/> Invite
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Team List */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Active Members</h4>
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Current User */}
                                <tr className="bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{user.name} (You)</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{user.role}</td>
                                    <td className="px-4 py-3"><span className="text-green-600 font-medium text-xs px-2 py-1 bg-green-50 rounded-full">Active</span></td>
                                    <td className="px-4 py-3 text-right text-slate-400 disabled cursor-not-allowed"><MoreHorizontal size={16} className="ml-auto"/></td>
                                </tr>
                                
                                {/* Mock Users */}
                                {MOCK_TEAM.map(member => (
                                    <tr key={member.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs mr-3">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{member.role}</td>
                                        <td className="px-4 py-3">
                                            {member.status === 'Active' ? (
                                                <span className="text-green-600 font-medium text-xs px-2 py-1 bg-green-50 rounded-full">Active</span>
                                            ) : (
                                                <span className="text-orange-600 font-medium text-xs px-2 py-1 bg-orange-50 rounded-full flex items-center w-fit">
                                                    <Clock size={10} className="mr-1"/> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal size={16} className="ml-auto"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Brand Assets Section (NEW) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <ImageIcon className="mr-2 text-purple-600" size={20}/>
            Brand Assets & Media Kit
        </h3>
        <p className="text-sm text-slate-500 mb-6">
            Download official Dup-Detect logos for your internal documentation or presentations.
            These vector files (SVG) are scalable to any size.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Logo */}
            <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors">
                 <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-white rounded border border-slate-100 flex items-center justify-center">
                         <FileText className="text-blue-600" size={24}/>
                     </div>
                     <div>
                         <div className="font-bold text-slate-800 text-sm">Standard Logo</div>
                         <div className="text-xs text-slate-400">Dark text, Transparent BG</div>
                     </div>
                 </div>
                 <button 
                    onClick={() => handleDownloadLogo('dark')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download SVG"
                 >
                     <Download size={20} />
                 </button>
            </div>

            {/* Dark Mode Logo */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-blue-500 transition-colors">
                 <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
                         <FileText className="text-white" size={24}/>
                     </div>
                     <div>
                         <div className="font-bold text-white text-sm">Dark Mode Logo</div>
                         <div className="text-xs text-slate-400">Light text, Dark BG</div>
                     </div>
                 </div>
                 <button 
                    onClick={() => handleDownloadLogo('light')}
                    className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Download SVG"
                 >
                     <Download size={20} />
                 </button>
            </div>
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Shield className="mr-2 text-green-600" size={20}/>
            Security & Compliance
        </h3>
        <p className="text-sm text-slate-500 mb-6">Dup-Detect performs daily secure backups. Review our legal terms regarding data handling below.</p>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Two-Factor Authentication</span>
                <button className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-sm hover:bg-slate-300">Enable</button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-slate-700">Activity Logs</span>
                <button className="text-blue-600 text-sm hover:underline">Download CSV</button>
            </div>
             <div className="flex items-center justify-between py-3">
                <span className="text-slate-700">Legal Documents</span>
                <div className="space-x-4">
                    <button onClick={() => openLegal('terms')} className="text-blue-600 text-sm hover:underline flex items-center inline-flex">
                        <FileText size={14} className="mr-1"/> Terms
                    </button>
                     <button onClick={() => openLegal('privacy')} className="text-blue-600 text-sm hover:underline flex items-center inline-flex">
                        <Scale size={14} className="mr-1"/> Privacy
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Legal Modal */}
      <LegalModal 
        isOpen={showLegal}
        onClose={() => setShowLegal(false)}
        initialTab={legalTab}
      />
    </div>
  );
};

export default UserProfile;