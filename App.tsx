import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScanManager from './components/ScanManager';
import CalendarView from './components/CalendarView';
import UserProfile from './components/UserProfile';
import ChatAssistant from './components/ChatAssistant';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import PaymentGateway from './components/PaymentGateway';
import HelpCenter from './components/HelpCenter';
import { UserProfile as IUserProfile, UserRole, ScanResult, AuditLogEntry } from './types';
import { MOCK_SCAN_HISTORY } from './services/mockData';
import { HelpCircle, Users, ShieldAlert, FileText, ArrowDown } from 'lucide-react';

type ViewState = 'landing' | 'auth' | 'app';

// Backend API URL: try localhost:3001 first (dev server), then Render, then same origin
const BACKEND_URLS = [
  'http://localhost:3001',
  'https://dupdetect-frontend.onrender.com',
  window.location.origin,
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
    { id: '1', time: '2023-11-10 14:32', user: 'Alex Accountant', action: 'Login', details: 'Successful login from IP 192.168.1.1', type: 'info' },
    { id: '2', time: '2023-11-09 09:15', user: 'System', action: 'Auto-Backup', details: 'Daily backup completed', type: 'info' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [isConnectingQB, setIsConnectingQB] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const [user, setUser] = useState<IUserProfile>({
    name: 'Alex Accountant',
    email: 'alex@finance-pro.com',
    role: UserRole.MANAGER, 
    plan: 'Starter', // Default to starter
    companyName: 'Finance Pro LLC',
    isQuickBooksConnected: false
  });

  const handleAddAuditLog = (action: string, details: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') => {
      const newLog: AuditLogEntry = {
          id: Date.now().toString(),
          time: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          user: user.name,
          action,
          details,
          type
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
        setUser(prev => ({ ...prev, isQuickBooksConnected: true }));
        setIsAuthenticated(true); 
        setCurrentView('app');    
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('app');
    // Add login log
    const log: AuditLogEntry = {
          id: Date.now().toString(),
          time: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          user: 'Alex Accountant', // Mock
          action: 'Login',
          details: 'User logged in successfully',
          type: 'info'
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
    setActiveTab('dashboard');
  };

  // Helper to run the simulation (used in fallback scenarios)
  const runSimulation = (reason: string) => {
      console.log(`Switching to Simulation Mode: ${reason}`);
      setTimeout(() => {
          setIsConnectingQB(false);
          setUser(prev => ({ ...prev, isQuickBooksConnected: true }));
          handleAddAuditLog('Connection', 'QuickBooks Online connected (Simulation)', 'success');
          alert(
              `Note: Backend connection failed, so we switched to DEMO MODE.\n\n` +
              `Reason: ${reason}`
          );
      }, 1500);
  };

  const handleConnectQuickBooks = async () => {
      setIsConnectingQB(true);

      const currentFrontendUrl = window.location.origin;

      // Try each backend URL in order, fall back to simulation if none work
      for (const backendUrl of BACKEND_URLS) {
        try {
          console.log(`Attempting to connect to backend: ${backendUrl}`);

          const response = await fetch(`${backendUrl}/auth/quickbooks?redirectUri=${encodeURIComponent(currentFrontendUrl)}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(5000)
          });

          if (!response.ok) {
               throw new Error(`Backend Error ${response.status}`);
          }

          const data = await response.json();
          if (data.url) {
              window.location.href = data.url;
              return;
          } else {
              throw new Error("Invalid response from backend");
          }

        } catch (error) {
            console.warn(`Backend at ${backendUrl} unreachable:`, error);
        }
      }

      // All backends failed - fall back to simulation
      runSimulation("Backend Not Connected (Live Demo Mode)");
  };

  const handleDisconnectQuickBooks = () => {
      const confirmed = window.confirm('Are you sure you want to disconnect QuickBooks? You will need to reconnect to run scans.');
      if (!confirmed) return;
      setUser(prev => ({ ...prev, isQuickBooksConnected: false }));
      handleAddAuditLog('Disconnection', 'QuickBooks Online disconnected', 'warning');
  };

  const handleExport = () => {
      const csvContent = "data:text/csv;charset=utf-8,ID,Date,Amount,Entity,Reason\nTXN-001,2023-10-25,1500.00,Acme Corp,Exact Match";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "duplicates.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      handleAddAuditLog('Export', 'Duplicate transactions exported to CSV', 'info');
  };

  // Payment Handlers
  const handleUpgradeClick = (plan: string, price: string) => {
      setSelectedPlan({ name: plan, price: price });
      setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
      if (selectedPlan) {
          // Update user plan
          setUser(prev => ({ 
              ...prev, 
              plan: selectedPlan.name as 'Starter' | 'Professional' | 'Enterprise' 
          }));
          handleAddAuditLog('Upgrade', `Plan upgraded to ${selectedPlan.name}`, 'success');
          setShowPaymentModal(false);
          // If we were on landing page, move to app or show success
          if (currentView === 'landing') {
              setCurrentView('auth'); // Or direct to app if already logged in logic existed
          }
      }
  };

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage 
            onGetStarted={() => setCurrentView('auth')} 
            onLogin={() => setCurrentView('auth')}
            onUpgrade={handleUpgradeClick}
        />
        {showPaymentModal && selectedPlan && (
            <PaymentGateway 
                planName={selectedPlan.name}
                price={selectedPlan.price}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        )}
      </>
    );
  }

  if (currentView === 'auth') {
    return (
      <Auth 
        onLogin={handleLogin} 
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={handleLogout}
        onShowHelp={() => setShowHelp(true)}
      >
        {activeTab === 'dashboard' && (
            <Dashboard 
                scanHistory={MOCK_SCAN_HISTORY} 
                user={user}
                onConnectQuickBooks={handleConnectQuickBooks}
                isConnectingQB={isConnectingQB}
                onUpgrade={() => handleUpgradeClick('Professional', '49')}
            />
        )}
        {activeTab === 'scan' && (
            <ScanManager 
                onExport={handleExport} 
                user={user}
                onAddAuditLog={handleAddAuditLog}
            />
        )}
        {activeTab === 'history' && <CalendarView history={MOCK_SCAN_HISTORY} />}
        
        {activeTab === 'users' && (
             <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm mt-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Users className="w-8 h-8" /> 
                </div>
                <h3 className="text-lg font-semibold text-slate-700">User Management</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">Manage team roles, permissions, and audit logs. This feature is available in the Enterprise plan.</p>
                <button 
                    onClick={() => handleUpgradeClick('Enterprise', '149')}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                    Upgrade to Enterprise
                </button>
             </div>
        )}

        {activeTab === 'audit' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Audit Logs</h2>
                        <p className="text-slate-500">Track all sensitive actions performed within the application.</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                        <FileText size={16} className="mr-1"/> Export Logs
                    </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Timestamp</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-sm">User</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Action</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-sm">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-600 text-sm font-mono">{log.time}</td>
                                    <td className="px-6 py-3 text-slate-800 text-sm font-medium">{log.user}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            log.type === 'danger' ? 'bg-red-100 text-red-700' : 
                                            log.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                                            log.type === 'success' ? 'bg-green-100 text-green-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-sm">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {auditLogs.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No logs available.</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'profile' && (
            <UserProfile
                user={user}
                onConnectQuickBooks={handleConnectQuickBooks}
                onDisconnectQuickBooks={handleDisconnectQuickBooks}
                isConnectingQB={isConnectingQB}
                onManagePlan={() => {
                   if (user.plan === 'Starter') {
                       handleUpgradeClick('Professional', '49');
                   } else if (user.plan === 'Professional') {
                       handleUpgradeClick('Enterprise', '149');
                   } else {
                       const portal = window.confirm("You are on the highest tier. Open Customer Billing Portal?");
                       if(portal) handleAddAuditLog('Billing', 'User accessed billing portal', 'info');
                   }
                }}
            />
        )}
        
        {/* Help Center Component */}
        <HelpCenter 
            isOpen={showHelp} 
            onClose={() => setShowHelp(false)} 
        />

      </Layout>
      
      {/* Global Payment Modal - can be triggered from anywhere */}
      {showPaymentModal && selectedPlan && (
        <PaymentGateway 
            planName={selectedPlan.name}
            price={selectedPlan.price}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
        />
      )}

      <ChatAssistant />
      <button 
        onClick={() => setShowHelp(true)}
        className="fixed bottom-24 right-6 w-10 h-10 bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-700 z-40 transition-colors border border-slate-700"
        title="Help & Support"
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

export default App;