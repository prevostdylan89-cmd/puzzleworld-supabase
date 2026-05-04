import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Grid3X3, 
  User, 
  Gamepad2,
  Puzzle,
  LogOut,
  Languages,
  Scan,
  Settings,
  BookOpen,
  Menu,
  X as XIcon,
  Calendar,
  ArrowLeft,
  Globe,
  TriangleAlert
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ScanPuzzleModal from '@/components/scan/ScanPuzzleModal';
import FloatingChat from '@/components/messages/FloatingChat';
import MaintenancePage from '@/components/shared/MaintenancePage';
import UsernameGuard from '@/components/onboarding/UsernameGuard';
import PullToRefresh from '@/components/shared/PullToRefresh';
import BugReportModal from '@/components/shared/BugReportButton';
import FriendRequestNotification from '@/components/notifications/FriendRequestNotification';
import { useAuth } from '@/lib/AuthContext';

function LayoutContent({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const { exitGuestMode } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [showScanModal, setShowScanModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [pageSettings, setPageSettings] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    base44.functions.invoke('publicData', { type: 'pageSettings' })
      .then(res => setPageSettings(res.data?.data || []))
      .catch(() => {});
  }, []);

  const [tabHistory, setTabHistory] = useState({
    Home: ['Home'],
    Social: ['Social'],
    Collection: ['Collection']
  });

  const bottomNavItems = [
    { name: t('collection'), icon: Grid3X3, page: 'Collection' },
    { name: 'Scan', icon: Scan, page: 'scan', isScan: true },
    { name: t('profile'), icon: User, page: 'Profile' },
  ];

  const sidebarMenuItems = [
    { name: t('home'), icon: Home, page: 'Home' },
    { name: t('social'), icon: Globe, page: 'Social' },
    { name: 'Events', icon: Calendar, page: 'Events' },
    { name: t('online'), icon: Gamepad2, page: 'OnlinePuzzles' },
    { name: t('profile'), icon: User, page: 'Profile' },
    { name: t('friends'), icon: Users, page: 'Friends' },
    { name: 'Blog', icon: BookOpen, page: 'Blog' },
  ];

  const desktopNavItems = [
    { name: t('home'), icon: Home, page: 'Home', hasHistory: true },
    { name: t('social'), icon: Globe, page: 'Social', hasHistory: true },
    { name: t('collection'), icon: Grid3X3, page: 'Collection', hasHistory: true },
    { name: t('online'), icon: Gamepad2, page: 'OnlinePuzzles' },
    { name: 'Events', icon: Puzzle, page: 'Events' },
    { name: t('profile'), icon: User, page: 'Profile' },
    { name: t('friends'), icon: Users, page: 'Friends' },
    { name: 'Blog', icon: BookOpen, page: 'Blog' },
  ];

  const adminNavItems = user?.role === 'admin' 
    ? [{ name: 'Admin', icon: Settings, page: 'Dashboard' }]
    : [];

  const handleNavClick = (item) => {
    if (!item.hasHistory) return;
    const currentTab = item.page;
    const history = tabHistory[currentTab] || [currentTab];
    const isCurrentTab = currentPageName === currentTab || history.includes(currentPageName);
    if (isCurrentTab && currentPageName === history[history.length - 1]) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isCurrentTab) {
      setTabHistory(prev => ({ ...prev, [currentTab]: [currentTab] }));
    } else {
      const currentRootTab = Object.keys(tabHistory).find(tab => tabHistory[tab].includes(currentPageName));
      if (currentRootTab) {
        setTabHistory(prev => ({
          ...prev,
          [currentRootTab]: [...prev[currentRootTab].filter(p => p !== currentPageName), currentPageName]
        }));
      }
    }
  };

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (!user) return;
    // Initial fetch
    base44.entities.DirectMessage.filter({ receiver_email: user.email, is_read: false })
      .then(msgs => setUnreadMessagesCount(new Set(msgs.map(m => m.conversation_id)).size))
      .catch(() => {});
    // Real-time subscription for updates
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      // Only re-fetch on create/update events to avoid unnecessary calls
      if (event.type === 'create' || event.type === 'update') {
        base44.entities.DirectMessage.filter({ receiver_email: user.email, is_read: false })
          .then(msgs => setUnreadMessagesCount(new Set(msgs.map(m => m.conversation_id)).size))
          .catch(() => {});
      }
    });
    return () => unsub();
  }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const handleLogout = () => { base44.auth.logout(); };

  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[#000019] text-white">
      <style>{`
        :root {
          --background: 0 0% 5%;
          --foreground: 0 0% 100%;
          --card: 0 0% 8%;
          --card-foreground: 0 0% 100%;
          --primary: 24 100% 50%;
          --primary-foreground: 0 0% 100%;
          --muted: 240 10% 15%;
          --muted-foreground: 240 5% 65%;
          --accent: 240 30% 20%;
          --accent-foreground: 0 0% 100%;
          --border: 240 10% 15%;
        }
        @media (prefers-color-scheme: light) {
          :root {
            --background: 0 0% 100%;
            --foreground: 0 0% 5%;
            --card: 0 0% 98%;
            --card-foreground: 0 0% 5%;
            --muted: 240 10% 95%;
            --muted-foreground: 240 5% 45%;
            --accent: 240 10% 90%;
            --accent-foreground: 0 0% 5%;
            --border: 240 10% 90%;
          }
        }
        html, body {
          overscroll-behavior: none;
          -webkit-tap-highlight-color: transparent;
        }
        button, a, [role="button"], nav, header {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        .select-text {
          user-select: text;
          -webkit-user-select: text;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 107, 53, 0.3) transparent;
        }
        *::-webkit-scrollbar { width: 6px; height: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255, 107, 53, 0.3); border-radius: 3px; }
        *::-webkit-scrollbar-thumb:hover { background: rgba(255, 107, 53, 0.5); }
      `}</style>

      {/* Desktop Header */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 h-16 bg-[#000019]/90 backdrop-blur-xl border-b border-white/[0.06] z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" alt="PuzzleWorld" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              PuzzleWorld
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {[...desktopNavItems, ...adminNavItems].map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  onClick={(e) => {
                    if (item.hasHistory) {
                      e.preventDefault();
                      handleNavClick(item);
                      navigate(createPageUrl(item.page));
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-orange-500/10 text-orange-400' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'group-hover:text-orange-400'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.page === 'Friends' && unreadMessagesCount > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavDesktop"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {/* Bug Report Button */}
            <button
              onClick={() => setShowBugReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-medium border border-red-500/20 hover:border-red-500/40"
            >
              <TriangleAlert className="w-3.5 h-3.5" />
              {t('report')}
            </button>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5">
                  <Languages className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                <DropdownMenuItem 
                  onClick={() => setLanguage('fr')}
                  className={`text-white cursor-pointer ${language === 'fr' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'}`}
                >
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage('en')}
                  className={`text-white cursor-pointer ${language === 'en' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'}`}
                >
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                      {user.profile_photo ? (
                        <img src={user.profile_photo} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                          {userInitials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{user.full_name || user.email}</span>
                      {user.current_badge_icon && (
                        <span className="text-lg">{user.current_badge_icon}</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="cursor-pointer text-white hover:bg-white/10">
                      <User className="w-4 h-4 mr-2" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-white/10 hover:text-red-300">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={exitGuestMode}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
              >
                {t('logIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#000019]/95 backdrop-blur-xl border-b border-white/[0.06] z-50">
        <div className="flex items-center justify-between px-4 h-14">
          {['Home', 'Social', 'Collection', 'Profile', 'Events', 'Friends', 'Messages', 'OnlinePuzzles', 'Dashboard'].includes(currentPageName) ? (
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/15 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button 
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center active:bg-white/15 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
          )}

          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" alt="PuzzleWorld" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-base">PuzzleWorld</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to={createPageUrl('Profile')}>
                <div className="w-11 h-11 flex items-center justify-center">
                  <Avatar className="h-9 w-9 ring-2 ring-orange-500/20 cursor-pointer">
                    {user.profile_photo ? (
                      <img src={user.profile_photo} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                        {userInitials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </Link>
            ) : (
              <Button
                onClick={exitGuestMode}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs px-3 h-8"
              >
                {t('logIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#000019] border-r border-white/10 z-[70] flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
              {/* Menu Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" alt="PuzzleWorld" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">PuzzleWorld</h2>
                    {user && (
                      <p className="text-xs text-white/50">{user.full_name || user.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <XIcon className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-2">
                {sidebarMenuItems.map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isActive 
                          ? 'bg-orange-500/10 text-orange-400 border-r-2 border-orange-400' 
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.page === 'Friends' && unreadMessagesCount > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {user?.role === 'admin' && (
                  <>
                    <div className="h-px bg-white/10 my-2 mx-4" />
                    <Link
                      to={createPageUrl('Dashboard')}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        currentPageName === 'Dashboard'
                          ? 'bg-orange-500/10 text-orange-400 border-r-2 border-orange-400' 
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="font-medium">Admin</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Menu Footer */}
              <div className="p-4 border-t border-white/10 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${language === 'fr' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    <span>🇫🇷</span>
                    <span className="text-sm font-medium">Français</span>
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${language === 'en' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    <span>🇬🇧</span>
                    <span className="text-sm font-medium">English</span>
                  </button>
                </div>

                <button
                  onClick={() => { setShowBugReport(true); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400"
                >
                  <TriangleAlert className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('reportIssue')}</span>
                </button>

                {user && (
                  <button
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('logOut')}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#000019]/95 backdrop-blur-xl border-t border-white/[0.06] z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {bottomNavItems.map((item) => {
            if (item.isScan) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowScanModal(true)}
                  className="flex flex-col items-center gap-1 -mt-4"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Scan className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-orange-400">Scan</span>
                </button>
              );
            }

            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
                  isActive ? 'text-orange-400' : 'text-white/50 active:text-white/70'
                }`}
              >
                <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main id="pull-scroll-container" className="min-h-screen lg:pb-6 overflow-y-auto" style={{ paddingTop: '3.5rem', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <PullToRefresh>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {(() => {
                const pageSetting = pageSettings.find(s => s.page_name === currentPageName);
                if (pageSetting && pageSetting.is_active === false) {
                  return <MaintenancePage message={pageSetting.maintenance_message} />;
                }
                return children;
              })()}
            </motion.div>
          </AnimatePresence>
        </PullToRefresh>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0a2e] border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" alt="PuzzleWorld" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-lg text-white">PuzzleWorld</span>
              </div>
              <p className="text-white/50 text-sm">{t('footerTagline')}</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/puzzle__world__?igsh=NGI5cHJoOXpuZHQ5" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <span className="text-white/70">📷</span>
                </a>
                <a href="https://www.tiktok.com/@puzzleworld58?_r=1&_t=ZN-93ubJQIrj3m" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <span className="text-white/70">🎵</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('Collection')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">Collection</Link></li>
                <li><Link to={createPageUrl('Social')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">Social</Link></li>
                <li><Link to={createPageUrl('Events')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">Events</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('FAQ')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">FAQ</Link></li>
                <li><Link to={createPageUrl('Contact')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">Contact</Link></li>
                <li><Link to={createPageUrl('Aide')} className="text-white/50 hover:text-orange-400 text-sm transition-colors">Aide</Link></li>
              </ul>
            </div>

            <div></div>
          </div>

          <div className="pt-8 border-t border-white/[0.06]">
            <div className="text-center mb-4">
              <p className="text-white/40 text-sm">{t('footerCopyright')}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/30">
              <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-orange-400 transition-colors">
                {t('privacyPolicyLabel')}
              </Link>
              <span>•</span>
              <Link to={createPageUrl('Terms')} className="hover:text-orange-400 transition-colors">
                {t('termsLabel')}
              </Link>
              <span>•</span>
              <a href="mailto:questionpuzzleworld@outlook.fr" className="hover:text-orange-400 transition-colors">
                Contact
              </a>
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-white/30 italic">
                {t('amazonDisclaimer')}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <ScanPuzzleModal open={showScanModal} onClose={() => setShowScanModal(false)} />
      <FloatingChat />
      <UsernameGuard />
      <BugReportModal open={showBugReport} onClose={() => setShowBugReport(false)} />
      <FriendRequestNotification />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}