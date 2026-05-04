import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  Edit3,
  Grid3X3,
  Trophy,
  Heart,
  Clock,
  Puzzle,
  Star,
  LogIn,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import AchievementBadge from '@/components/shared/AchievementBadge';
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
import { Crown, Camera, TriangleAlert, Zap } from 'lucide-react';



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
  const [achievements, setAchievements] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [showLevelsModal, setShowLevelsModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Load scanned count (puzzles added to community catalog by this user)
  useEffect(() => {
    if (!user) return;
    base44.entities.PuzzleCatalog.filter({ created_by: user.email })
      .then(items => setScannedCount(items.length))
      .catch(() => {});
  }, [user]);

  // Abonnement temps réel aux changements de UserPuzzle et Wishlist
  useEffect(() => {
    if (!user) return;
    let puzzleDebounceTimer = null;
    let wishlistDebounceTimer = null;

    const unsubscribeUserPuzzle = base44.entities.UserPuzzle.subscribe(() => {
      clearTimeout(puzzleDebounceTimer);
      puzzleDebounceTimer = setTimeout(async () => {
        const completedPuzzles = await base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'done' });
        const totalPieces = completedPuzzles.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
        setStats(prev => ({ ...prev, completed: completedPuzzles.length, totalPieces }));
      }, 2000);
    });
    const unsubscribeWishlist = base44.entities.Wishlist.subscribe(() => {
      clearTimeout(wishlistDebounceTimer);
      wishlistDebounceTimer = setTimeout(async () => {
        const [old, upw] = await Promise.all([
          base44.entities.Wishlist.filter({ created_by: user.email }),
          base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'wishlist' }),
        ]);
        const seen = new Set();
        let count = 0;
        for (const item of [...upw, ...old]) {
          const key = item.puzzle_name?.toLowerCase().trim();
          if (!key || seen.has(key)) continue;
          seen.add(key); count++;
        }
        setStats(prev => ({ ...prev, wishlist: count }));
      }, 2000);
    });
    return () => {
      clearTimeout(puzzleDebounceTimer);
      clearTimeout(wishlistDebounceTimer);
      unsubscribeUserPuzzle();
      unsubscribeWishlist();
    };
  }, [user]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Sync user profile to UserProfile entity
      await base44.functions.invoke('syncUserProfile', {});
      
      // Update user level based on scanned puzzles
      await base44.functions.invoke('updateUserLevelFromScans', { userEmail: currentUser.email });
      
      // Load stats
      const [completedPuzzles, userAchievements, oldWishlist, userPuzzleWishlist, followers, following, allUserPuzzles] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: currentUser.email, status: 'done' }),
        base44.entities.Achievement.filter({ created_by: currentUser.email }),
        base44.entities.Wishlist.filter({ created_by: currentUser.email }),
        base44.entities.UserPuzzle.filter({ created_by: currentUser.email, status: 'wishlist' }),
        base44.entities.Follow.filter({ following_email: currentUser.email }),
        base44.entities.Follow.filter({ follower_email: currentUser.email }),
        base44.entities.UserPuzzle.filter({ created_by: currentUser.email })
      ]);
      // Dedup wishlist by puzzle_name
      const wishlistSeen = new Set();
      const wishlistItems = [];
      for (const item of [...userPuzzleWishlist, ...oldWishlist]) {
        const key = item.puzzle_name?.toLowerCase().trim();
        if (!key || wishlistSeen.has(key)) continue;
        wishlistSeen.add(key);
        wishlistItems.push(item);
      }

      const totalPieces = completedPuzzles.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);

      setStats({
        completed: completedPuzzles.length,
        achievements: userAchievements.length,
        wishlist: wishlistItems.length,
        total: allUserPuzzles.length,
        followers: followers.length,
        following: following.length,
        totalPieces
      });

      setAchievements(userAchievements);
      
      // Load current badge from the database
      const userBadges = await base44.entities.UserBadge.filter({
        created_by: currentUser.email,
        is_active: true,
      });
      
      if (userBadges.length > 0) {
        const activeBadge = userBadges[0];
        const badges = await base44.entities.Badge.filter({ name: activeBadge.badge_name });
        if (badges.length > 0) {
          setCurrentBadge(badges[0]);
        }
      }
    } catch (error) {
      console.log('User not logged in');
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
            onClick={() => base44.auth.redirectToLogin()}
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

  // Badge-based levels with scan thresholds
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
        <div className="h-48 lg:h-64 relative overflow-hidden group">
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
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
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

            {/* User Info */}
            <div className="flex-1 pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{user.display_name || user.full_name || user.email}</h1>
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-500/20">
                        <span className="text-2xl">👑</span>
                        <span className="font-bold text-sm text-purple-300">Admin</span>
                      </span>
                    ) : currentBadge && (
                      <button
                        onClick={() => setShowBadgesModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${currentBadge.color}20`,
                          borderColor: `${currentBadge.color}50`
                        }}
                      >
                        <span className="text-2xl">{currentBadge.icon || '🏆'}</span>
                        <span className="font-semibold text-sm" style={{ color: currentBadge.color }}>
                          {currentBadge.name}
                        </span>
                      </button>
                    )}
                  </div>
                  {user.friend_code && (
                    <p className="text-orange-400/70 text-sm font-mono">@{user.friend_code}</p>
                  )}
                </div>
                <Button 
                  onClick={() => base44.auth.logout()}
                  variant="outline" 
                  className="border-white/20 text-white bg-transparent hover:bg-white/5 w-fit"
                >
                  {t('logOut')}
                </Button>
              </div>
              
              <p className="text-white/70 mt-3 max-w-xl">
                {t('welcomeToDashboard')}
              </p>

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
                 <div className="text-3xl">{currentBadge?.icon || '🧩'}</div>
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="text-orange-400 font-bold text-base">{t('level')} {currentLevel.level}</span>
                     <span className="text-white font-semibold text-base">{currentLevel.badgeName}</span>
                   </div>
                   {!isMaxLevel && (
                     <p className="text-white/40 text-xs mt-0.5">
                       {scansRemaining} scan{scansRemaining > 1 ? 's' : ''} pour {nextLevel.badgeName}
                     </p>
                   )}
                   {isMaxLevel && (
                     <p className="text-orange-400/70 text-xs mt-0.5">Niveau maximum atteint ! 🎉</p>
                   )}
                 </div>
               </div>
               <span className="text-white/50 text-sm font-mono">
                 {newScansCount} scan{newScansCount > 1 ? 's' : ''} / {isMaxLevel ? newScansCount : nextLevel.threshold}
               </span>
             </div>
             <Progress 
               value={progressValue}
               className="h-2.5 bg-white/10"
             />
           </motion.button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 lg:px-8 mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 w-full">
            <TabsTrigger 
              value="collection" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <Puzzle className="w-4 h-4 shrink-0" />
              <span className="ml-1.5 hidden sm:inline">{t('myCollectionTab')}</span>
              <span className="ml-1.5 sm:hidden">{t('collection')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="wishlist" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span className="ml-1.5">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
              <span className="text-base shrink-0">🔒</span>
              <span className="ml-1.5 hidden sm:inline">{t('personalTab')}</span>
              <span className="ml-1.5 sm:hidden">{t('personalTab')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="speed" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 text-xs sm:text-sm"
            >
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

        {/* My Events Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-400" />
            {t('myEvents')}
          </h2>
          <MyEventsSection user={user} />
        </div>

        {/* Import Collection Section */}
        <div className="mt-12">
          <CollectionImportSection user={user} onImportDone={loadUserData} />
        </div>

        {/* Bug Report Section */}
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

        {/* Delete Account Section */}
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

function MyEventsSection({ user }) {
  const { t } = useLanguage();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserEvents();
  }, [user]);

  const loadUserEvents = async () => {
    try {
      // Get user's event participations
      const participations = await base44.entities.EventParticipant.filter({
        user_email: user.email
      });

      if (participations.length === 0) {
        setRegisteredEvents([]);
        setLoading(false);
        return;
      }

      // Get event details for each participation
      const eventIds = participations.map(p => p.event_id);
      const allEvents = await base44.entities.Event.list();
      const userEvents = allEvents.filter(event => eventIds.includes(event.id));

      // Sort by date
      userEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

      setRegisteredEvents(userEvents);
    } catch (error) {
      console.error('Error loading user events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (registeredEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
        <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">{t('noEvents')}</p>
        <p className="text-white/30 text-sm mt-2">{t('registerForEventsHint')}</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = registeredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const pastEvents = registeredEvents.filter(event => {
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  return (
    <div className="space-y-8">
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">{t('upcomingEvents')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} onUnregister={loadUserEvents} />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white/70 mb-4">{t('pastEventsLabel')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onUnregister }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const isPast = eventDate && eventDate < new Date();

  const handleUnregister = async (e) => {
    e.stopPropagation();
    
    if (!confirm(t('unregisterConfirm'))) {
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Find and delete participation
      const participations = await base44.entities.EventParticipant.filter({
        event_id: event.id,
        user_email: user.email
      });

      if (participations.length > 0) {
        await base44.entities.EventParticipant.delete(participations[0].id);
        
        // Update participant count
        await base44.entities.Event.update(event.id, {
          current_participants: Math.max(0, event.current_participants - 1)
        });

        if (onUnregister) {
          onUnregister();
        }
      }
    } catch (error) {
      console.error('Error unregistering:', error);
      alert(t('unregisterError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all">
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h4 className="text-white font-semibold mb-2 line-clamp-1">{event.title}</h4>
        {eventDate && (
          <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>
              {format(eventDate, 'dd MMM yyyy', { locale: language === 'fr' ? fr : enUS })}
              {event.event_time && ` • ${event.event_time}`}
            </span>
          </div>
        )}
        {isPast ? (
          <span className="inline-block text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
              {t('eventEnded')}
            </span>
        ) : (
          <Button
            onClick={handleUnregister}
            disabled={loading}
            size="sm"
            variant="outline"
            className="w-full border-red-500/30 text-red-400 bg-transparent hover:bg-red-500/10 hover:text-red-300"
          >
            {loading ? t('unregistering') : t('unregisterFromEvent')}
          </Button>
        )}
      </div>
    </div>
  );
}