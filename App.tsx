import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScanManager from './components/ScanManager';
import CalendarView from './components/CalendarView';
import UserProfile from './components/UserProfile';
import ChatAssistant from './components/ChatAssistant';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import { UserProfile as IUserProfile, UserRole, ScanResult } from './types';
import { MOCK_SCAN_HISTORY } from './services/mockData';
import { HelpCircle, Users } from 'lucide-react';

type ViewState = 'landing' | 'auth' | 'app';

// Backend API URL (Render service: dup-detect-api)
const BACKEND_URL = 'https://dup-detect-api.onrender.com';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [isConnectingQB, setIsConnectingQB] = useState(false);
  
  // Mock User State
  const [user, setUser] = useState<IUserProfile>({
    name: 'Alex Accountant',
    email: 'alex@finance-pro.com',
    role: UserRole.ADMIN,
    plan: 'Professional',
    companyName: 'Finance Pro LLC',
    isQuickBooksConnected: false
  });

  // Check for success query param return from Backend OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
        setUser(prev => ({ ...prev, isQuickBooksConnected: true }));
        // Clean URL
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

  const handleConnectQuickBooks = async () => {
      setIsConnectingQB(true);
      
      // Dynamic Frontend URL detection
      const currentFrontendUrl = window.location.origin; 
      
      console.log(`Connecting to backend: ${BACKEND_URL}`);
      console.log(`Redirect URI will be: ${currentFrontendUrl}/callback`);

      try {
        // REAL BACKEND CONNECTION LOGIC
        // -----------------------------
        // Try to fetch the auth URL from the backend
        const response = await fetch(`${BACKEND_URL}/auth/quickbooks?redirectUri=${encodeURIComponent(currentFrontendUrl)}`);
        
        if (!response.ok) {
            throw new Error(`Backend returned status: ${response.status}`);
        }

        const data = await response.json();
        if (data.url) {
            // Redirect the user to the QuickBooks login page
            window.location.href = data.url;
            return;
        } else {
            throw new Error("No URL returned from backend");
        }

      } catch (error) {
          console.error("Failed to initiate connection via backend:", error);
          
          // FALLBACK SIMULATION (So you can still test the UI if the backend isn't ready)
          console.log("Switching to simulation mode...");
          setTimeout(() => {
              setIsConnectingQB(false);
              setUser(prev => ({ ...prev, isQuickBooksConnected: true }));
              alert(`Simulation: Successfully connected to QuickBooks Online!\n\n(Note: Could not reach ${BACKEND_URL}. Ensure your backend server is running and CORS is enabled.)`);
          }, 2500);
      }
  };

  const handleExport = () => {
      // Mock CSV export
      const csvContent = "data:text/csv;charset=utf-8,ID,Date,Amount,Entity,Reason\nTXN-001,2023-10-25,1500.00,Acme Corp,Exact Match";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "duplicates.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // View Routing Logic
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => setCurrentView('auth')} 
        onLogin={() => setCurrentView('auth')}
      />
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

  // App View
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
                <button className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Upgrade to Enterprise</button>
             </div>
        )}
        {activeTab === 'profile' && (
            <UserProfile 
                user={user} 
                onConnectQuickBooks={handleConnectQuickBooks}
                isConnectingQB={isConnectingQB}
            />
        )}
        
        {/* Help / FAQ Modal Overlay Placeholder */}
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
      
      {/* Floating Action Buttons */}
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