import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Search, Users, Settings, LogOut, Calendar, Menu, ClipboardList, Bell, X, HelpCircle, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserProfile, UserRole, AppNotification } from '../types';
import Logo from './Logo';

const PRODUCTION_BACKEND_URL = window.location.origin;

const FALLBACK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', title: 'Scan Completed', message: 'Daily scan found 3 potential duplicates.', type: 'warning', isRead: false, time: '2m ago' },
  { id: '2', title: 'Backup Successful', message: 'Your transaction data has been backed up securely.', type: 'success', isRead: false, time: '1h ago' },
  { id: '3', title: 'System Update', message: 'Dup-Detect has been updated to v2.1.', type: 'info', isRead: true, time: '1d ago' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onLogout: () => void;
  onShowHelp?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout, onShowHelp }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) { setNotifications(FALLBACK_NOTIFICATIONS); return; }
        const response = await fetch(`${PRODUCTION_BACKEND_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && data.notifications.length > 0) {
            setNotifications(data.notifications.map((n: any) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              type: n.type || 'info',
              isRead: n.is_read,
              time: timeAgo(n.created_at),
            })));
          } else {
            setNotifications(FALLBACK_NOTIFICATIONS);
          }
        } else {
          setNotifications(FALLBACK_NOTIFICATIONS);
        }
      } catch {
        setNotifications(FALLBACK_NOTIFICATIONS);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${PRODUCTION_BACKEND_URL}/api/notifications/mark-all-read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${PRODUCTION_BACKEND_URL}/api/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id }),
        });
      }
    } catch { /* silent */ }
  };

  // Menu items definition with role-based visibility
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scan & Resolve', icon: Search },
    { id: 'history', label: 'Scan History', icon: Calendar },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users,
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'audit', 
      label: 'Audit Logs', 
      icon: ClipboardList,
      roles: [UserRole.ADMIN, UserRole.MANAGER] 
    },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'profile', label: 'My Profile', icon: Settings },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar - Dark Mode */}
      <aside 
        className={`fixed md:relative z-40 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 transform 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className={`p-6 border-b border-slate-800 flex items-center h-20 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {isSidebarCollapsed ? (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl hover:opacity-90 transition-opacity"
              >
                  D
              </button>
          ) : (
              <button onClick={() => setActiveTab('dashboard')} className="hover:opacity-90 transition-opacity text-left">
                  <Logo variant="light" />
              </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          {!isSidebarCollapsed && <p className="px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 animate-in fade-in">Main Menu</p>}
          <ul className="space-y-1 px-3">
            {visibleMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'help' && onShowHelp) {
                        onShowHelp();
                    } else {
                        setActiveTab(item.id);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                    ${activeTab === item.id && item.id !== 'help'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <item.icon size={20} className={`shrink-0 ${activeTab === item.id && item.id !== 'help' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                  
                  {isSidebarCollapsed && (
                      <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                          {item.label}
                      </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col gap-2">
           {/* Unpin/Collapse Button - Above Profile */}
           <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-2"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
           >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <PanelLeftClose size={20} />}
                {!isSidebarCollapsed && <span className="ml-2 text-sm">Collapse Menu</span>}
           </button>

          <div 
            onClick={() => {
                setActiveTab('profile');
                setMobileMenuOpen(false);
            }}
            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Go to My Profile"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:ring-2 ring-blue-500 transition-all shrink-0">
              {user.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-200 transition-colors">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize truncate">{user.role.toLowerCase()}</p>
                </div>
            )}
          </div>
          
          <button 
            onClick={onLogout}
            className={`w-full flex items-center space-x-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-300 py-2.5 rounded-lg transition-all text-sm font-medium border border-slate-700 hover:border-red-900/50 ${isSidebarCollapsed ? 'justify-center' : 'justify-center'}`}
            title="Sign Out"
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header overlay for sidebar */}
      {mobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all">
        {/* Header (Mobile & Desktop Utilities) */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 z-20 shrink-0 shadow-sm">
            <div className="flex items-center md:hidden">
                <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600 mr-3">
                    <Menu size={24} />
                </button>
                <button onClick={() => setActiveTab('dashboard')}>
                    <Logo variant="dark" className="scale-75 origin-left" />
                </button>
            </div>

            {/* Desktop Header Title (hidden on mobile to save space) */}
            <div className="hidden md:block">
                <h2 className="text-2xl font-bold text-slate-800 capitalize">
                    {menuItems.find(i => i.id === activeTab)?.label || 'Dup-Detect'}
                </h2>
            </div>

            {/* Right Side Icons (Notifications) */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <span className="font-semibold text-sm text-slate-800">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all read</button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
                                    ) : (
                                        notifications.map(note => (
                                            <button 
                                                key={note.id} 
                                                onClick={() => handleNotificationClick(note.id)}
                                                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!note.isRead ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-medium ${note.type === 'warning' ? 'text-orange-700' : note.type === 'success' ? 'text-green-700' : 'text-slate-800'}`}>
                                                        {note.title}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{note.time}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">{note.message}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>

        {/* Scrollable Content with Darker Soft Gradient Background */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-br from-slate-100 via-blue-100/40 to-indigo-100/40 relative scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
      
    </div>
  );
};

export default Layout;