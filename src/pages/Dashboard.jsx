import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Home, Grid3X3, Users, Calendar, User, Settings, Gamepad2, Eye, BookOpen, Menu, X, Bug, Trophy, Shield, Award, RotateCcw } from 'lucide-react';

// Import sections
import DashboardHome from '@/components/dashboard/sections/DashboardHome';
import DashboardMyCollection from '@/components/dashboard/sections/DashboardMyCollection';
import DashboardSocial from '@/components/dashboard/sections/DashboardSocial';
import DashboardEvents from '@/components/dashboard/sections/DashboardEvents';
import DashboardProfile from '@/components/dashboard/sections/DashboardProfile';
import DashboardSettings from '@/components/dashboard/sections/DashboardSettings';
import DashboardOnline from '@/components/dashboard/sections/DashboardOnline';
import DashboardPendingPuzzles from '@/components/dashboard/sections/DashboardPendingPuzzles';
import DashboardPageVisibility from '@/components/dashboard/sections/DashboardPageVisibility';
import DashboardBlog from '@/components/dashboard/sections/DashboardBlog';
import DashboardBugReports from '@/components/dashboard/sections/DashboardBugReports';
import DashboardTopPuzzles from '@/components/dashboard/sections/DashboardTopPuzzles';
import DashboardModeration from '@/components/dashboard/sections/DashboardModeration';
import DashboardRestore from '@/components/dashboard/sections/DashboardRestore';
import DashboardBadges from '@/components/dashboard/sections/DashboardBadges';
import DashboardSync from '@/components/dashboard/sections/DashboardSync';

const SECTIONS = [
  { id: 'home', label: 'Accueil', icon: Home, component: DashboardHome },
  { id: 'toppuzzles', label: 'Top Puzzles', icon: Trophy, component: DashboardTopPuzzles },
  { id: 'mycollection', label: 'Ma Collection', icon: Grid3X3, component: DashboardMyCollection },
  { id: 'pending', label: 'En attente', icon: Grid3X3, component: DashboardPendingPuzzles },
  { id: 'social', label: 'Social', icon: Users, component: DashboardSocial },
  { id: 'events', label: 'Événements', icon: Calendar, component: DashboardEvents },
  { id: 'online', label: 'En Ligne', icon: Gamepad2, component: DashboardOnline },
  { id: 'profile', label: 'Utilisateurs', icon: User, component: DashboardProfile },
  { id: 'visibility', label: 'Pages', icon: Eye, component: DashboardPageVisibility },
  { id: 'blog', label: 'Blog', icon: BookOpen, component: DashboardBlog },
  { id: 'bugreports', label: 'Signalements', icon: Bug, component: DashboardBugReports },
  { id: 'moderation', label: 'Modération IA', icon: Shield, component: DashboardModeration },
  { id: 'restore', label: 'Restauration', icon: RotateCcw, component: DashboardRestore },
  { id: 'badges', label: 'Badges', icon: Award, component: DashboardBadges },
  { id: 'sync', label: 'Synchronisation', icon: Settings, component: DashboardSync },
  { id: 'settings', label: 'Paramètres', icon: Settings, component: DashboardSettings },
];

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') {
        setIsAdmin(true);
      } else {
        toast.error('Accès réservé aux administrateurs');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000019]">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const ActiveComponent = SECTIONS.find(s => s.id === activeSection)?.component;

  const NavItems = () => (
    <nav className="px-3 pb-6">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => { setActiveSection(section.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
              isActive
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#000019] flex overflow-x-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 bg-[#0a0a2e] border-r border-white/[0.06] fixed h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-2">Dashboard Admin</h1>
          <p className="text-white/50 text-xs">Gestion de la plateforme</p>
        </div>
        <NavItems />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#0a0a2e] border-r border-white/[0.06] overflow-y-auto z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Dashboard Admin</h1>
            <p className="text-white/50 text-xs">Gestion de la plateforme</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavItems />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 min-w-0 p-4 lg:p-8 overflow-x-hidden w-full">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold">{SECTIONS.find(s => s.id === activeSection)?.label}</span>
        </div>
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
}