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
import { UserProfile as IUserProfile, UserRole, ScanResult } from './types';
import { MOCK_SCAN_HISTORY } from './services/mockData';
import { HelpCircle, Users, ShieldAlert, FileText } from 'lucide-react';

type ViewState = 'landing' | 'auth' | 'app';

// This is the target URL for your backend API.
// Even if this doesn't exist yet, the app will now handle it gracefully.
const PRODUCTION_BACKEND_URL = 'https://dupdetect-backend.onrender.com'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [isConnectingQB, setIsConnectingQB] = useState(false);
  
  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);

  const [user, setUser] = useState<IUserProfile>({
    name: 'Alex Accountant',
    email: 'alex@finance-pro.com',
    role: UserRole.MANAGER, 
    plan: 'Starter', // Default to starter
    companyName: 'Finance Pro LLC',
    isQuickBooksConnected: false
  });

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
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
    setActiveTab('dashboard');
  };

  // Helper to run the simulation (used in multiple places)
  const runSimulation = (reason: string) => {
      console.log(`Switching to Simulation Mode: ${reason}`);
      setTimeout(() => {
          setIsConnectingQB(false);
          setUser(prev => ({ ...prev, isQuickBooksConnected: true }));
          alert(
              `DEMO MODE ACTIVE\n\n` +
              `QuickBooks connection simulated successfully.\n` +
              `Reason: ${reason}`
          );
      }, 1500);
  };

  const handleConnectQuickBooks = async () => {
      setIsConnectingQB(true);
      
      const currentHostname = window.location.hostname;
      const isPreviewEnvironment = 
          currentHostname.includes('google') || 
          currentHostname.includes('webcontainer') || 
          currentHostname.includes('localhost');

      // 1. Immediate Simulation for Dev Environments
      if (isPreviewEnvironment) {
          runSimulation("Development Environment Detected");
          return;
      }

      // 2. Production Connection Attempt with Fallback
      const currentFrontendUrl = window.location.origin; 
      
      try {
        console.log(`Attempting to connect to backend: ${PRODUCTION_BACKEND_URL}`);
        
        // Short timeout - if backend is sleeping or doesn't exist, fail fast to demo mode
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/auth/quickbooks?redirectUri=${encodeURIComponent(currentFrontendUrl)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000) 
        });
        
        if (!response.ok) {
             throw new Error(`Backend Error ${response.status}`);
        }

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error("Invalid response from backend");
        }

      } catch (error) {
          // 3. Fallback to Simulation on Production Error
          // This allows the site to work on Render even without a deployed backend
          console.warn("Backend unreachable, falling back to demo:", error);
          runSimulation("Backend Not Connected (Live Demo Mode)");
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
        {activeTab === 'scan' && <ScanManager onExport={handleExport} />}
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
                            {[
                                { time: '2023-11-10 14:32', user: 'Alex Accountant', action: 'Login', details: 'Successful login from IP 192.168.1.1' },
                                { time: '2023-11-10 14:35', user: 'Alex Accountant', action: 'Scan Run', details: 'Manual scan initiated' },
                                { time: '2023-11-10 14:40', user: 'Alex Accountant', action: 'Delete Group', details: 'Resolved duplicate group GRP-102 (3 txns)' },
                                { time: '2023-11-09 09:15', user: 'System', action: 'Auto-Backup', details: 'Daily backup completed' },
                            ].map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-600 text-sm font-mono">{log.time}</td>
                                    <td className="px-6 py-3 text-slate-800 text-sm font-medium">{log.user}</td>
                                    <td className="px-6 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action.includes('Delete') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 text-sm">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'profile' && (
            <UserProfile 
                user={user} 
                onConnectQuickBooks={handleConnectQuickBooks}
                isConnectingQB={isConnectingQB}
            />
        )}
        
        {showHelp && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <HelpCircle className="mr-2 text-blue-600"/> Help & FAQ
                    </h3>
                    <div className="space-y-3">
                        <details className="cursor-pointer group bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <summary className="font-medium text-slate-800 list-none flex justify-between items-center">
                                How does detection work?
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">We scan date, amount, vendor, and memo fields. We also look for close matches (fuzzy logic) within $1.00 difference to catch tax variances.</p>
                        </details>
                        <details className="cursor-pointer group bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <summary className="font-medium text-slate-800 list-none flex justify-between items-center">
                                Is deletion permanent?
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">No. We create a secure backup before resolving any group. You can Undo actions directly from the Scan page history.</p>
                        </details>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 rounded-lg text-white font-medium transition-colors">Close</button>
                </div>
            </div>
        )}

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
        title="Help & FAQ"
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

export default App;