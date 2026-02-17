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
import ErrorBoundary from './components/ErrorBoundary';
import { UserProfile as IUserProfile, UserRole, ScanResult, AuditLogEntry } from './types';
import { MOCK_SCAN_HISTORY } from './services/mockData';
import { HelpCircle, Users, ShieldAlert, FileText, ArrowDown } from 'lucide-react';

type ViewState = 'landing' | 'auth' | 'app';

// Backend API URL - uses same origin since frontend and backend are served together
const PRODUCTION_BACKEND_URL = window.location.origin;

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [isConnectingQB, setIsConnectingQB] = useState(false);
  const [isConnectingXero, setIsConnectingXero] = useState(false);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Scan History State (fetched from backend)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(MOCK_SCAN_HISTORY);

  const [user, setUser] = useState<IUserProfile>({
    name: 'Alex Accountant',
    email: 'alex@finance-pro.com',
    role: UserRole.MANAGER,
    plan: 'Starter',
    companyName: '',
    isQuickBooksConnected: false,
    isXeroConnected: false
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

  // Session restoration: check JWT on mount
  useEffect(() => {
    const restoreSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');

      // Handle OAuth redirects first
      if (status === 'success') {
        setUser(prev => ({ ...prev, isQuickBooksConnected: true, companyName: 'QuickBooks Sandbox' }));
        setIsAuthenticated(true);
        setCurrentView('app');
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsRestoringSession(false);
        return;
      }
      if (status === 'xero_success') {
        setUser(prev => ({ ...prev, isXeroConnected: true, xeroOrgName: 'Xero Organisation' }));
        setIsAuthenticated(true);
        setCurrentView('app');
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsRestoringSession(false);
        return;
      }

      // Try to restore session from JWT
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const restored = data.user;
          setUser(prev => ({
            ...prev,
            name: restored.name || prev.name,
            email: restored.email || prev.email,
            companyName: restored.companyName || prev.companyName,
            isQuickBooksConnected: restored.isQuickBooksConnected || false,
            isXeroConnected: restored.isXeroConnected || false,
          }));
          setIsAuthenticated(true);
          setCurrentView('app');
          fetchSubscriptionStatus();
        } else {
          // Token invalid/expired - clear it
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.log('[Session] Could not restore session:', err);
      }
      setIsRestoringSession(false);
    };

    restoreSession();
  }, []);

  const handleLogin = (loginUser?: { name: string; email: string; companyName: string }) => {
    if (loginUser) {
      setUser(prev => ({
        ...prev,
        name: loginUser.name || prev.name,
        email: loginUser.email || prev.email,
        companyName: loginUser.companyName || prev.companyName,
      }));
    }
    setIsAuthenticated(true);
    setCurrentView('app');
    const log: AuditLogEntry = {
          id: Date.now().toString(),
          time: new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          user: loginUser?.name || 'User',
          action: 'Login',
          details: 'User logged in successfully',
          type: 'info'
    };
    setAuditLogs(prev => [log, ...prev]);
    fetchSubscriptionStatus();
  };

  const handleStartDemo = () => {
      setUser({
          name: 'Demo User',
          email: 'demo@dupdetect.com',
          role: UserRole.ADMIN,
          plan: 'Professional',
          companyName: 'Demo Corp Ltd.',
          isQuickBooksConnected: true,
          isXeroConnected: true
      });
      setIsAuthenticated(true);
      setCurrentView('app');
      setActiveTab('scan');

      handleAddAuditLog('Demo', 'Started interactive demo mode', 'info');
      alert("Welcome to the Interactive Demo! \n\nWe have pre-loaded a sample company and connected it to both QuickBooks and Xero. \n\nClick 'Run New Scan' to see the AI in action.");
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setCurrentView('landing');
    setActiveTab('dashboard');
  };

  const handleDisconnectQB = () => {
    setUser(prev => ({ ...prev, isQuickBooksConnected: false }));
    handleAddAuditLog('Disconnection', 'QuickBooks disconnected', 'warning');
  };

  const handleDisconnectXero = () => {
    setUser(prev => ({ ...prev, isXeroConnected: false }));
    handleAddAuditLog('Disconnection', 'Xero disconnected', 'warning');
  };

  const handleConnectQuickBooks = async () => {
      setIsConnectingQB(true);
      const currentFrontendUrl = window.location.origin;

      try {
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/auth/quickbooks?redirectUri=${encodeURIComponent(currentFrontendUrl)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });

        if (!response.ok) throw new Error(`Backend Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error("Invalid response from backend: No redirect URL found.");
        }
      } catch (error) {
          console.error("Connection failed:", error);
          alert("Could not connect to the backend server. Please ensure your backend is running and accessible.");
          setIsConnectingQB(false);
      }
  };

  const handleConnectXero = async () => {
      setIsConnectingXero(true);
      const currentFrontendUrl = window.location.origin;

      try {
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/auth/xero?redirectUri=${encodeURIComponent(currentFrontendUrl)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });

        if (!response.ok) throw new Error(`Backend Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error("Invalid response from backend: No redirect URL found.");
        }
      } catch (error) {
          console.error("Xero connection failed:", error);
          alert("Could not connect to the backend server for Xero. Please ensure your backend is running and accessible.");
          setIsConnectingXero(false);
      }
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

  const handleExportAuditLogs = () => {
    if (auditLogs.length === 0) { alert("No logs to export."); return; }
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'Type'];
    const rows = auditLogs.map(log => [
      `"${log.time}"`, `"${log.user}"`, `"${log.action}"`, `"${log.details}"`, log.type
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleAddAuditLog('Export', `Exported ${auditLogs.length} audit log entries`, 'info');
  };

  // Payment Handlers
  const handleUpgradeClick = (plan: string, price: string) => {
      setSelectedPlan({ name: plan, price: price });
      setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
      if (selectedPlan) {
          setUser(prev => ({ ...prev, plan: selectedPlan.name as 'Starter' | 'Professional' | 'Enterprise' }));
          handleAddAuditLog('Upgrade', `Plan upgraded to ${selectedPlan.name} via Paddle`, 'success');
          setShowPaymentModal(false);
          if (currentView === 'landing') setCurrentView('auth');
      }
  };

  const fetchSubscriptionStatus = async () => {
      try {
          const token = localStorage.getItem('auth_token');
          if (!token) return;
          const response = await fetch(`${PRODUCTION_BACKEND_URL}/api/paddle/subscription`, {
              headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
              const data = await response.json();
              if (data.plan && data.plan !== 'Starter') {
                  setUser(prev => ({ ...prev, plan: data.plan }));
              }
          }
      } catch (err) {
          console.log('[Subscription] Could not fetch subscription status:', err);
      }
  };

  // Show loading during session restore
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
            onGetStarted={() => setCurrentView('auth')}
            onLogin={() => setCurrentView('auth')}
            onUpgrade={handleUpgradeClick}
            onStartDemo={handleStartDemo}
        />
        {showPaymentModal && selectedPlan && (
            <PaymentGateway
                planName={selectedPlan.name}
                price={selectedPlan.price}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                userEmail={user.email}
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
    <ErrorBoundary>
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
                scanHistory={scanHistory}
                user={user}
                onConnectQuickBooks={handleConnectQuickBooks}
                onConnectXero={handleConnectXero}
                isConnectingQB={isConnectingQB}
                isConnectingXero={isConnectingXero}
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
        {activeTab === 'history' && <CalendarView history={scanHistory} />}

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
                    <button onClick={handleExportAuditLogs} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
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
                onConnectXero={handleConnectXero}
                onDisconnectQB={handleDisconnectQB}
                onDisconnectXero={handleDisconnectXero}
                isConnectingQB={isConnectingQB}
                isConnectingXero={isConnectingXero}
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
    </ErrorBoundary>
  );
};

export default App;
