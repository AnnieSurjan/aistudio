import React, { useState, useEffect } from 'react';
import { UserProfile as IUserProfile, UserRole } from '../types';
import { CreditCard, Mail, Shield, Link, CheckCircle, RotateCw, UserPlus, Send, Users, MoreHorizontal, Clock, FileText, Scale, Key, Trash2, HelpCircle, Smartphone, Plus, Building2, X } from 'lucide-react';

interface UserProfileProps {
  user: IUserProfile;
  onConnectQuickBooks?: () => void;
  onConnectXero?: () => void;
  onDisconnectQB?: () => void;
  onDisconnectXero?: () => void;
  isConnectingQB?: boolean;
  isConnectingXero?: boolean;
  onManagePlan?: () => void;
  onNavigateLegal: (view: 'terms' | 'privacy' | 'refund') => void;
}

const INITIAL_TEAM = [
  { id: 1, name: 'Sarah Finance', email: 'sarah@finance-pro.com', role: 'VIEWER', status: 'Active' },
  { id: 2, name: 'Mike Auditor', email: 'mike@external-audit.com', role: 'VIEWER', status: 'Pending' },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, onConnectQuickBooks, onConnectXero, onDisconnectQB, onDisconnectXero, isConnectingQB, isConnectingXero, onManagePlan, onNavigateLegal }) => {
  const [teamMembers, setTeamMembers] = useState(INITIAL_TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaUri, setTwoFaUri] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFaDisableCode, setTwoFaDisableCode] = useState('');

  // Entity management state
  const [entities, setEntities] = useState<any[]>([]);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const BACKEND_URL = window.location.origin;

  // Load 2FA status and entities on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/2fa/status`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setTwoFaEnabled(data.isEnabled); })
      .catch(() => {});

    fetch(`${BACKEND_URL}/api/entities`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.entities) setEntities(data.entities); })
      .catch(() => {});
  }, []);

  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/setup`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTwoFaSecret(data.secret);
      setTwoFaUri(data.otpauthUri);
      setShow2FASetup(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to setup 2FA');
    }
    setIs2FALoading(false);
  };

  const handleVerify2FA = async () => {
    setIs2FALoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/verify-setup`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecoveryCodes(data.recoveryCodes);
      setTwoFaEnabled(true);
      setTwoFaCode('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed');
    }
    setIs2FALoading(false);
  };

  const handleDisable2FA = async () => {
    if (!twoFaDisableCode) { alert('Enter your 2FA code to disable.'); return; }
    setIs2FALoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/2fa/disable`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaDisableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTwoFaEnabled(false);
      setTwoFaDisableCode('');
      setShow2FASetup(false);
      setRecoveryCodes([]);
      alert('2FA disabled successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to disable 2FA');
    }
    setIs2FALoading(false);
  };

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/entities`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntities(prev => [data.entity, ...prev]);
      setNewEntityName('');
      setShowEntityModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add entity');
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm('Delete this entity?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/entities/${id}`, { method: 'DELETE', credentials: 'include' });
      setEntities(prev => prev.filter(e => e.id !== id));
    } catch { alert('Failed to delete entity'); }
  };

  const handleSetActiveEntity = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/entities/${id}/set-active`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntities(prev => prev.map(e => ({ ...e, is_active: e.id === id })));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set active entity');
    }
  };

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
                {user.isQuickBooksConnected ? (
                    <button onClick={onDisconnectQB} className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">
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
                             {user.isXeroConnected && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center"><CheckCircle size={10} className="mr-1"/> Active</span>}
                        </div>
                        <p className="text-sm text-slate-500">{user.isXeroConnected ? `Syncing with ${user.companyName}` : 'Connect your Xero organization.'}</p>
                    </div>
                </div>
                {user.isXeroConnected ? (
                    <button onClick={onDisconnectXero} className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm">
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

      {/* Accounting Entities Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <Building2 className="mr-2 text-indigo-600" size={20}/> Accounting Entities
          </h3>
          <button onClick={() => setShowEntityModal(true)} className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} className="mr-1"/> Add Entity
          </button>
        </div>
        <div className="p-6">
          {entities.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No entities configured. Add your first accounting entity to organize scans.</p>
          ) : (
            <div className="space-y-3">
              {entities.map(entity => (
                <div key={entity.id} className={`flex items-center justify-between p-3 rounded-lg border ${entity.is_active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${entity.is_active ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                    <span className="text-slate-800 font-medium">{entity.name}</span>
                    {entity.is_active && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!entity.is_active && (
                      <button onClick={() => handleSetActiveEntity(entity.id)} className="text-xs text-indigo-600 hover:underline">Set Active</button>
                    )}
                    <button onClick={() => handleDeleteEntity(entity.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security & Legal Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Shield className="mr-2 text-green-600" size={20}/> Security & Legal Documentation
        </h3>
        <p className="text-sm text-slate-500 mb-6">Review your agreement with Dat-assist Kft. and manage your security settings.</p>

        <div className="space-y-4">
            {/* 2FA Section */}
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className={twoFaEnabled ? 'text-green-600' : 'text-slate-400'}/>
                  <span className="text-slate-700">Two-Factor Authentication</span>
                  {twoFaEnabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Enabled</span>}
                </div>
                {twoFaEnabled ? (
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Enter code" value={twoFaDisableCode} onChange={e => setTwoFaDisableCode(e.target.value)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" maxLength={6}/>
                    <button onClick={handleDisable2FA} disabled={is2FALoading}
                      className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors border border-red-200">
                      {is2FALoading ? '...' : 'Disable'}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleSetup2FA} disabled={is2FALoading}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-70">
                    <Smartphone size={14} className="mr-1.5"/> {is2FALoading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                )}
            </div>

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
      
      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Smartphone size={20} className="mr-2 text-green-600"/> Setup Two-Factor Authentication
              </h3>
              <button onClick={() => { setShow2FASetup(false); setRecoveryCodes([]); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>

            {recoveryCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm font-bold text-yellow-800 mb-2">Save Your Recovery Codes</p>
                  <p className="text-xs text-yellow-700 mb-3">These codes can be used to access your account if you lose your authenticator. Save them in a safe place. They will not be shown again.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {recoveryCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm bg-white px-3 py-1.5 rounded border border-yellow-300 text-center">{code}</div>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setShow2FASetup(false); setRecoveryCodes([]); }}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                  I've Saved These Codes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-600 mb-2">Scan this code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 inline-block">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFaUri)}`} alt="2FA QR Code" className="w-48 h-48 mx-auto"/>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">Or enter this key manually:</p>
                    <code className="text-xs bg-slate-100 px-3 py-1 rounded font-mono select-all">{twoFaSecret}</code>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enter the 6-digit code from your app</label>
                  <input type="text" maxLength={6} value={twoFaCode} onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="000000"/>
                </div>
                <button onClick={handleVerify2FA} disabled={twoFaCode.length !== 6 || is2FALoading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
                  {is2FALoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entity Creation Modal */}
      {showEntityModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Building2 size={20} className="mr-2 text-indigo-600"/> Add Accounting Entity
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entity Name</label>
                <input type="text" value={newEntityName} onChange={e => setNewEntityName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g., Acme Corp, EU Division"/>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowEntityModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleAddEntity} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Add Entity</button>
              </div>
            </div>
          </div>
        </div>
      )}

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