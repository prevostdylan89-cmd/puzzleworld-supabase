import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { 
  Calendar, 
  Trophy,
  Heart,
  Puzzle,
  LogIn,
  Loader2,
  Zap,
  TriangleAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase, base44 } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import WishlistSection from '@/components/profile/WishlistSection';
import CollectionSection from '@/components/profile/CollectionSection';
import ExchangeSection from '@/components/profile/ExchangeSection';
import LikedPuzzlesSection from '@/components/profile/LikedPuzzlesSection';
import { CompletedPuzzlesModal, AchievementsModal, WishlistModal, CollectionModal } from '@/components/profile/StatsModal';
import BadgesModal from '@/components/profile/BadgesModal';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import LevelsProgressModal from '@/components/profile/LevelsProgressModal';
import CollectionImportSection from '@/components/profile/CollectionImportSection';
import BugReportModal from '@/components/shared/BugReportButton';
import PersonalPuzzleSection from '@/components/profile/PersonalPuzzleSection';
import SpeedPuzzleSection from '@/components/profile/SpeedPuzzleSection';
import { Crown, Camera, TriangleAlert as TA, Zap as ZapIcon } from 'lucide-react';

const BADGE_LEVELS = [
  { level: 1, badgeName: 'Novice', threshold: 1, nextThreshold: 10 },
  { level: 2, badgeName: 'Débutant', threshold: 10, nextThreshold: 20 },
  { level: 3, badgeName: 'Apprenti', threshold: 20, nextThreshold: 35 },
  { level: 4, badgeName: 'Passionné', threshold: 35, nextThreshold: 50 },
  { level: 5, badgeName: 'Expert', threshold: 50, nextThreshold: 75 },
  { level: 6, badgeName: 'Maître', threshold: 75, nextThreshold: 100 },
  { level: 7, badgeName: 'Champion', threshold: 100, nextThreshold: 150 },
  { level: 8, badgeName: 'Légende', threshold: 150, nextThreshold: 250 },
  { level: 9, badgeName: 'Mythique', threshold: 250, nextThreshold: 400 },
  { level: 10, badgeName: 'Divin', threshold: 400, nextThreshold: null },
];

export default function Profile() {
  const { t, language } = useLanguage();
  const { isGuest } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('collection');
  const [stats, setStats] = useState({
    completed: 0,
    achievements: 0,
    wishlist: 0,
    total: 0,
    followers: 0,
    following: 0,
    totalPieces: 0
  });
  const [scannedCount, setScannedCount] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Scanned count
  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from('catalog_puzzles')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.email)
      .then(({ count }) => setScannedCount(count || 0));
  }, [user?.email]);

  // Realtime stats refresh
  useEffect(() => {
    if (!user?.email) return;
    const channel = supabase
      .channel('profile-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_puzzles' }, () => {
        loadStats(user.email);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.email]);

  const loadStats = async (email) => {
    const [
      { count: completed },
      { count: wishlist },
      { count: total },
      { count: followers },
      { count: following },
      { data: completedPuzzles },
    ] = await Promise.all([
      supabase.from('user_puzzles').select('id', { count: 'exact', head: true }).eq('created_by', email).eq('status', 'done'),
      supabase.from('user_puzzles').select('id', { count: 'exact', head: true }).eq('created_by', email).eq('status', 'wishlist'),
      supabase.from('user_puzzles').select('id', { count: 'exact', head: true }).eq('created_by', email),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following', email),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('created_by', email),
      supabase.from('user_puzzles').select('puzzle_pieces').eq('created_by', email).eq('status', 'done'),
    ]);
    const totalPieces = (completedPuzzles || []).reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
    setStats(prev => ({
      ...prev,
      completed: completed || 0,
      wishlist: wishlist || 0,
      total: total || 0,
      followers: followers || 0,
      following: following || 0,
      totalPieces,
    }));
  };

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
const authUser = await base44.auth.me().catch(() => null);
      if (!authUser) { setIsLoading(false); return; }

      // Load profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('created_by', authUser.email)
        .maybeSingle();

      const enrichedUser = {
        ...authUser,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name,
        profile_photo: profile?.profile_photo || null,
        cover_photo: profile?.cover_photo || null,
        display_name: profile?.display_name || null,
        role: profile?.role || null,
        friend_code: profile?.friend_code || null,
        created_date: authUser.created_at,
      };
      setUser(enrichedUser);

      await loadStats(authUser.email);
    } catch (error) {
      console.log('User not logged in', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!user || isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-5xl mb-4">{isGuest ? '👤' : '🧩'}</div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('welcomeProfile')}</h2>
          <p className="text-white/60 mb-6">
            {isGuest ? 'Créez un compte pour accéder à votre profil, suivre vos puzzles et bien plus encore !' : t('logInToViewProfile')}
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isGuest ? 'Créer un compte / Se connecter' : t('logIn')}
          </Button>
        </motion.div>
      </div>
    );
  }

  const userInitials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const joinedDate = user.created_date
    ? formatDistanceToNow(new Date(user.created_date), { addSuffix: true, locale: language === 'fr' ? fr : enUS })
    : 'Recently';

  const newScansCount = scannedCount;
  let currentLevel = BADGE_LEVELS[0];
  let nextLevel = BADGE_LEVELS[1];
  for (let i = 0; i < BADGE_LEVELS.length; i++) {
    if (newScansCount >= BADGE_LEVELS[i].threshold) {
      currentLevel = BADGE_LEVELS[i];
      nextLevel = BADGE_LEVELS[i + 1] || null;
    }
  }
  const isMaxLevel = !nextLevel;
  const progressMin = currentLevel.threshold;
  const progressMax = nextLevel ? nextLevel.threshold : currentLevel.threshold;
  const progressValue = isMaxLevel ? 100 : Math.round(((newScansCount - progressMin) / (progressMax - progressMin)) * 100);
  const scansRemaining = nextLevel ? nextLevel.threshold - newScansCount : 0;

  const statItems = [
    { label: t('completed'), value: stats.completed, icon: Puzzle, onClick: () => setShowCompletedModal(true) },
    { label: t('achievements'), value: stats.achievements, icon: Trophy, onClick: () => setShowAchievementsModal(true) },
    { label: t('wishlist'), value: stats.wishlist, icon: Heart, onClick: () => setShowWishlistModal(true) },
  ];

  const formatPieces = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  return (
    <div className="min-h-screen pb-8">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 lg:h-64 relative overflow-hidden">
          <img
            src={user.cover_photo || "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop"}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000019] via-[#000019]/50 to-transparent" />
          <div className="absolute top-4 right-4">
            <EditProfileDialog user={user} onUpdate={loadUserData} />
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 lg:px-8 -mt-20 relative">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <Avatar className="h-32 w-32 lg:h-40 lg:w-40 ring-4 ring-[#000019] border-4 border-orange-500/30">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl lg:text-4xl">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
            </motion.div>

            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{user.display_name || user.full_name || user.email}</h1>
                    {user.role === 'admin' && (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/20">
                        <span className="text-2xl">👑</span>
                        <span className="font-bold text-sm text-purple-300">Admin</span>
                      </span>
                    )}
                  </div>
                  {user.friend_code && (
                    <p className="text-orange-400/70 text-sm font-mono">@{user.friend_code}</p>
                  )}
                </div>
                <Button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                  variant="outline"
                  className="border-white/20 text-white bg-transparent hover:bg-white/5 w-fit"
                >
                  {t('logOut')}
                </Button>
              </div>

              <p className="text-white/70 mt-3 max-w-xl">{t('welcomeToDashboard')}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1.5 text-white/50">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  {t('joined')} {joinedDate}
                </span>
                <span className="text-white/70">
                  <span className="font-semibold text-white">{stats.followers}</span> {t('followers')}
                </span>
                <span className="text-white/70">
                  <span className="font-semibold text-white">{stats.following}</span> {t('followings')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {statItems.map((stat, index) => (
              <motion.button
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={stat.onClick}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 text-center hover:border-orange-500/30 hover:bg-white/5 transition-all cursor-pointer"
              >
                <stat.icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.button>
            ))}
          </div>

          {/* Total Pièces */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">🧩</span>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{formatPieces(stats.totalPieces)}</span>
                {stats.totalPieces >= 1000 && (
                  <span className="text-white/40 text-sm">{stats.totalPieces.toLocaleString()}</span>
                )}
              </div>
              <p className="text-white/50 text-sm">{t('piecesAssembled')}</p>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-semibold text-sm">{stats.completed} puzzle{stats.completed > 1 ? 's' : ''}</div>
              <div className="text-white/30 text-xs">{t('puzzlesCompletedLabel')}</div>
            </div>
          </motion.div>

          {/* Level Progress */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setShowLevelsModal(true)}
            className="w-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-white/[0.06] rounded-2xl p-5 mt-6 hover:border-orange-500/30 transition-colors text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🧩</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold text-base">{t('level')} {currentLevel.level}</span>
                    <span className="text-white font-semibold text-base">{currentLevel.badgeName}</span>
                  </div>
                  {!isMaxLevel ? (
                    <p className="text-white/40 text-xs mt-0.5">
                      {scansRemaining} scan{scansRemaining > 1 ? 's' : ''} pour {nextLevel.badgeName}
                    </p>
                  ) : (
                    <p className="text-orange-400/70 text-xs mt-0.5">Niveau maximum atteint ! 🎉</p>
                  )}
                </div>
              </div>
              <span className="text-white/50 text-sm font-mono">
                {newScansCount} scan{newScansCount > 1 ? 's' : ''} / {isMaxLevel ? newScansCount : nextLevel.threshold}
              </span>
            </div>
            <Progress value={progressValue} className="h-2.5 bg-white/10" />
          </motion.button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 lg:px-8 mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 w-full">
            <TabsTrigger value="collection" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm">
              <Puzzle className="w-4 h-4 shrink-0" />
              <span className="ml-1.5 hidden sm:inline">{t('myCollectionTab')}</span>
              <span className="ml-1.5 sm:hidden">{t('collection')}</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm">
              <Heart className="w-4 h-4 shrink-0" />
              <span className="ml-1.5">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm">
              <span className="text-base shrink-0">🔒</span>
              <span className="ml-1.5">{t('personalTab')}</span>
            </TabsTrigger>
            <TabsTrigger value="speed" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm">
              <Zap className="w-4 h-4 shrink-0" />
              <span className="ml-1.5 hidden sm:inline">Speed</span>
              <span className="ml-1.5 sm:hidden">⚡</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            <CollectionSection user={user} />
          </TabsContent>
          <TabsContent value="wishlist" className="mt-6">
            <WishlistSection user={user} />
          </TabsContent>
          <TabsContent value="personal" className="mt-6">
            <PersonalPuzzleSection user={user} />
          </TabsContent>
          <TabsContent value="speed" className="mt-6">
            <SpeedPuzzleSection user={user} />
          </TabsContent>
        </Tabs>

        {/* Import Collection Section */}
        <div className="mt-12">
          <CollectionImportSection user={user} onImportDone={loadUserData} />
        </div>

        {/* Bug Report */}
        <div className="mt-6">
          <div className="bg-white/[0.03] border border-red-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 text-red-400" /> {t('reportIssue')}
              </h3>
              <p className="text-white/50 text-sm mt-1">{t('reportIssueSubtitle')}</p>
            </div>
            <button
              onClick={() => setShowBugReport(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium transition-all flex-shrink-0"
            >
              {t('report')}
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-6">{t('accountSettings')}</h2>
          <DeleteAccountSection />
        </div>
      </div>

      {/* Modals */}
      <CompletedPuzzlesModal open={showCompletedModal} onClose={() => setShowCompletedModal(false)} user={user} />
      <AchievementsModal open={showAchievementsModal} onClose={() => setShowAchievementsModal(false)} user={user} />
      <WishlistModal open={showWishlistModal} onClose={() => setShowWishlistModal(false)} user={user} />
      <CollectionModal open={showCollectionModal} onClose={() => setShowCollectionModal(false)} user={user} />
      <BadgesModal open={showBadgesModal} onClose={() => setShowBadgesModal(false)} user={user} />
      <BugReportModal open={showBugReport} onClose={() => setShowBugReport(false)} />
      <LevelsProgressModal open={showLevelsModal} onClose={() => setShowLevelsModal(false)} currentScans={newScansCount} currentLevel={currentLevel} />
    </div>
  );
}
