import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Sprout, BarChart3, Link2, Clock, FileText, Bot, Settings,
  Sun, Moon, Globe, LogOut, Menu, X, ChevronLeft, User, IndianRupee,
  ShoppingCart, Inbox, TrendingUp, MessageCircle
} from 'lucide-react';

const getNavItems = (role?: string) => {
  const common = [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard' },
  ];

  const farmerItems = [
    { icon: Sprout, label: 'cards.cropPlanning.title', path: '/crop-planning' },
    { icon: Clock, label: 'cards.shelfLife.title', path: '/shelf-life' },
    { icon: Inbox, label: 'buyerRequests.title', path: '/buyer-requests' },
    { icon: IndianRupee, label: 'dashboardPage.expenses', path: '/expenses' },
    { icon: FileText, label: 'cards.govSchemes.title', path: '/government-schemes' },
    { icon: Bot, label: 'cards.chatbot.title', path: '/chatbot' },
    { icon: MessageCircle, label: 'farmerTalk.title', path: '/farmer-talk' },
    { icon: TrendingUp, label: 'analytics.title', path: '/data-analyst' },
  ];

  const buyerItems = [
    { icon: ShoppingCart, label: 'marketplace.title', path: '/marketplace' },
  ];

  const sharedItems = [
    { icon: Settings, label: 'settings.title', path: '/settings' },
  ];

  if (role === 'buyer') return [...common, ...buyerItems, ...sharedItems];
  return [...common, ...farmerItems, ...sharedItems]; // farmer is default
};

// Map paths to page title translation keys
const pageTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/crop-planning': 'crop.title',
  '/shelf-life': 'shelf.title',
  '/government-schemes': 'schemes.title',
  '/expenses': 'dashboardPage.expenses',
  '/chatbot': 'chat.title',
  '/settings': 'settings.title',
  '/marketplace': 'marketplace.title',
  '/buyer-requests': 'buyerRequests.title',
  '/data-analyst': 'analytics.title',
  '/farmer-talk': 'farmerTalk.title',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  setMobileOpen: (v: boolean) => void;
  user: any;
  currentPath: string;
  t: any;
  notificationCount: number;
}

const SidebarContent = ({ 
  collapsed, setCollapsed, isMobile = false, setMobileOpen, user, currentPath, t, notificationCount 
}: SidebarProps) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
      <img src="/logo.png" alt="AgroVision Logo" className="w-9 h-9 rounded-xl object-contain shrink-0" />
      {(!collapsed || isMobile) && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="font-display font-bold text-lg text-sidebar-foreground whitespace-nowrap overflow-hidden"
        >
          AgroVision
        </motion.span>
      )}
    </div>

    {/* Nav items */}
    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
      {getNavItems(user?.role).map((item) => {
        const isActive = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors relative group
              ${isActive
                ? 'text-primary'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              }`}
          >
            {/* Active Background Bubble */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-bg"
                className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            
            {/* Hover Background (for inactive items) */}
            {!isActive && (
              <div className="absolute inset-0 bg-sidebar-accent/50 rounded-xl opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            )}

            {/* Left Indicator Line (glowing) */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-indicator"
                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-3 w-full">
              <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {(!collapsed || isMobile) && (
                <span className="truncate flex-1 font-semibold tracking-wide">{t(item.label)}</span>
              )}

              {/* Notification Badge */}
              {notificationCount > 0 && (
                (item.path === '/buyer-requests' && user?.role !== 'buyer') ||
                (item.path === '/marketplace' && user?.role === 'buyer')
              ) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center justify-center bg-destructive text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 shadow-sm relative z-20 
                    ${collapsed && !isMobile ? 'absolute -top-1 -right-1' : ''}`}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>

    {/* Collapse toggle (desktop only) */}
    {!isMobile && (
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all text-sm"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>{t('nav.collapse')}</span>}
        </button>
      </div>
    )}
  </div>
);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const userData = localStorage.getItem('agrovision_user');
      const token = userData ? JSON.parse(userData).token : null;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/marketplace/notifications/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s
    return () => clearInterval(interval);
  }, [user?._id]);

  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || 'nav.dashboard';

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
    setLangOpen(false);
  };

  const sidebarProps = {
    collapsed, setCollapsed, mobileOpen, setMobileOpen, user, currentPath, t, notificationCount
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
        className="hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] shrink-0 h-screen sticky top-0 overflow-hidden"
      >
        <SidebarContent {...sidebarProps} />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <div key="mobile-sidebar-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar border-r border-sidebar-border shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] z-50 lg:hidden"
            >
              <SidebarContent {...sidebarProps} isMobile />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">
              {t(pageTitle)}
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Globe className="w-[18px] h-[18px]" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-36 rounded-xl bg-card shadow-elevated border border-border p-1.5 z-50"
                  >
                    {[['en', 'English'], ['hi', 'हिंदी'], ['mr', 'मराठी']].map(([code, label]) => (
                      <button
                        key={code}
                        onClick={() => changeLang(code)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${i18n.language === code
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-foreground hover:bg-accent/50'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-border mx-1 hidden md:block" />

            {/* User */}
            {user && (
              <Link
                to="/settings"
                className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground max-w-[100px] truncate">{user.name}</span>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
