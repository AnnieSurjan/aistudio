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
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import RefundPage from './components/RefundPage';
import { UserProfile as IUserProfile, UserRole, ScanResult, AuditLogEntry, DuplicateGroup } from './types';
import { MOCK_SCAN_HISTORY } from './services/mockData';

type ViewState = 'landing' | 'auth' | 'app' | 'terms' | 'privacy' | 'refund';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
    { id: '1', time: '2023-11-10 14:32', user: 'Alex Accountant', action: 'Login', details: 'Successful login', type: 'info' },
];

const DEFAULT_USER: IUserProfile = {
    name: 'Alex Accountant',
    email: 'alex@finance-pro.com',
    role: UserRole.MANAGER, 
    plan: 'Starter', 
    companyName: '',
    isQuickBooksConnected: false,
    isXeroConnected: false,
    isTrial: true 
};

const App: React.FC = () => {
  // Router logika: URL path alapján inicializálunk
  const getInitialView = (): ViewState => {
    try {
      const path = window.location.pathname.replace('/', '');
      if (['terms', 'privacy', 'refund'].includes(path)) return path as ViewState;
      const savedView = localStorage.getItem('dupdetect_view');
      return (savedView as ViewState) || 'landing';
    } catch (e) {
      return 'landing';
    }
  };

  const [currentView, setCurrentView] = useState<ViewState>(getInitialView);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('dupdetect_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(MOCK_SCAN_HISTORY);

  const [user, setUser] = useState<IUserProfile>(() => {
      try {
          const savedUser = localStorage.getItem('dupdetect_user');
          if (savedUser && savedUser !== 'undefined') {
            return JSON.parse(savedUser);
          }
      } catch (e) {
          console.error("Error parsing user from localStorage", e);
      }
      return DEFAULT_USER;
  });

  // URL frissítése és nézet váltása
  const navigateTo = (view: ViewState) => {
    const path = view === 'landing' ? '/' : `/${view}`;
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  // Böngésző vissza gomb kezelése
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => { 
    try {
      localStorage.setItem('dupdetect_user', JSON.stringify(user)); 
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('dupdetect_view', currentView);
      localStorage.setItem('dupdetect_auth', String(isAuthenticated));
    } catch (e) {}
  }, [currentView, isAuthenticated]);

  const handleAddAuditLog = (action: string, details: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') => {
      const newLog: AuditLogEntry = {
          id: Date.now().toString(),
          time: new Date().toLocaleString(),
          user: user.name, action, details, type
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleScanComplete = (results: DuplicateGroup[]) => {
      const newScan: ScanResult = {
          id: `SC-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split('T')[0],
          duplicatesFound: results.length,
          status: 'Completed'
      };
      setScanHistory(prev => [newScan, ...prev]);
  };

  const handleLogin = (data?: { name: string; email: string; companyName: string }) => {
    if (data) {
        setUser(prev => ({
            ...prev,
            name: data.name,
            email: data.email,
            companyName: data.companyName || prev.companyName,
            isTrial: true 
        }));
    }
    setIsAuthenticated(true);
    navigateTo('app');
    handleAddAuditLog('Login', 'User logged in successfully', 'info');
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    navigateTo('landing');
    setActiveTab('dashboard');
    setUser(DEFAULT_USER);
    try {
      localStorage.removeItem('dupdetect_auth');
      localStorage.removeItem('dupdetect_view');
      localStorage.removeItem('dupdetect_user');
    } catch (e) {}
  };

  const handleUpgradeClick = (plan: string, price: string) => {
      setSelectedPlan({ name: plan, price: price });
      setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
      if (selectedPlan) {
          setUser(prev => ({ 
              ...prev, 
              plan: selectedPlan.name as 'Starter' | 'Professional' | 'Enterprise',
              isTrial: false 
          }));
          handleAddAuditLog('Upgrade', `Plan upgraded to ${selectedPlan.name}`, 'success');
          setShowPaymentModal(false);
          if (['landing', 'terms', 'privacy', 'refund'].includes(currentView)) navigateTo('auth');
      }
  };

  // Full Page Legal Navigation
  if (currentView === 'terms') return <TermsPage onBack={() => navigateTo('landing')} />;
  if (currentView === 'privacy') return <PrivacyPage onBack={() => navigateTo('landing')} />;
  if (currentView === 'refund') return <RefundPage onBack={() => navigateTo('landing')} />;

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage 
            onGetStarted={() => navigateTo('auth')} 
            onLogin={() => navigateTo('auth')}
            onUpgrade={handleUpgradeClick}
            onStartDemo={() => { handleLogin(); setActiveTab('scan'); }}
            onNavigateLegal={(view: 'terms' | 'privacy' | 'refund') => navigateTo(view)}
        />
        {showPaymentModal && selectedPlan && (
            <PaymentGateway 
                planName={selectedPlan.name} price={selectedPlan.price}
                onClose={() => setShowPaymentModal(false)} onSuccess={handlePaymentSuccess}
            />
        )}
      </>
    );
  }

  if (currentView === 'auth') {
    return <Auth onLogin={handleLogin} onBack={() => navigateTo('landing')} />;
  }

  return (
    <div className="font-sans text-slate-900 bg-slate-50 min-h-screen">
      <Layout 
        activeTab={activeTab} setActiveTab={setActiveTab} user={user}
        onLogout={handleLogout} onShowHelp={() => setShowHelp(true)}
      >
        {activeTab === 'dashboard' && (
            <Dashboard 
                scanHistory={scanHistory} user={user}
                onConnectQuickBooks={() => {}} onConnectXero={() => {}}
                isConnectingQB={false} isConnectingXero={false}
                onUpgrade={() => handleUpgradeClick('Professional', '49')}
            />
        )}
        {activeTab === 'scan' && (
            <ScanManager 
                onExport={() => {}} user={user}
                onAddAuditLog={handleAddAuditLog}
                onScanComplete={handleScanComplete}
                onUpgrade={() => handleUpgradeClick('Professional', '49')}
            />
        )}
        {activeTab === 'history' && <CalendarView history={scanHistory} />}
        {activeTab === 'profile' && (
            <UserProfile 
                user={user} onManagePlan={() => handleUpgradeClick('Professional', '49')}
                onNavigateLegal={(view: 'terms' | 'privacy' | 'refund') => navigateTo(view)}
            />
        )}
        <HelpCenter isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </Layout>
      {showPaymentModal && selectedPlan && (
        <PaymentGateway 
            planName={selectedPlan.name} price={selectedPlan.price}
            onClose={() => setShowPaymentModal(false)} onSuccess={handlePaymentSuccess}
        />
      )}
      <ChatAssistant />
    </div>
  );
};

export default App;