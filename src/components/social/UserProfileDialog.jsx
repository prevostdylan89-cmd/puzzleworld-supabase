import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Puzzle, Trophy, Users, Heart } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';

async function fetchUserPublicStats(targetEmail) {
  const [
    { count: completed },
    { count: achievements },
    { count: wishlist },
    { count: friends },
    { data: profile },
    { data: completedItems },
    { data: userBadgeRow },
  ] = await Promise.all([
    supabase.from('user_puzzles').select('id', { count: 'exact', head: true }).eq('created_by', targetEmail).eq('status', 'done'),
    supabase.from('achievements').select('id', { count: 'exact', head: true }).eq('created_by', targetEmail),
    supabase.from('user_puzzles').select('id', { count: 'exact', head: true }).eq('created_by', targetEmail).eq('status', 'wishlist'),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).or(`requester_email.eq.${targetEmail},addressee_email.eq.${targetEmail}`).eq('status', 'accepted'),
    supabase.from('user_profiles').select('display_name, profile_photo, friend_code').eq('created_by', targetEmail).limit(1),
    supabase.from('user_puzzles').select('puzzle_pieces').eq('created_by', targetEmail).eq('status', 'done'),
    supabase.from('user_badges').select('badge_name').eq('created_by', targetEmail).eq('is_visible', true).limit(1),
  ]);

  const totalPieces = (completedItems || []).reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
  const profileRow = profile?.[0] || {};

  const { count: scansCount } = await supabase
    .from('puzzle_catalog')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', targetEmail);
  const scans = scansCount || 0;
  const BADGE_LEVELS = [
    { level: 1, title: 'Novice', emoji: '🌱' }, { level: 2, title: 'Débutant', emoji: '🔲' },
    { level: 3, title: 'Apprenti', emoji: '🔍' }, { level: 4, title: 'Passionné', emoji: '🧩' },
    { level: 5, title: 'Expert', emoji: '🎨' }, { level: 6, title: 'Maître', emoji: '⚡' },
    { level: 7, title: 'Champion', emoji: '💎' }, { level: 8, title: 'Légende', emoji: '🏆' },
    { level: 9, title: 'Mythique', emoji: '✨' }, { level: 10, title: 'Divin', emoji: '👑' },
  ];
  let level = BADGE_LEVELS[0];
  if (scans >= 400) level = BADGE_LEVELS[9];
  else if (scans >= 250) level = BADGE_LEVELS[8];
  else if (scans >= 150) level = BADGE_LEVELS[7];
  else if (scans >= 100) level = BADGE_LEVELS[6];
  else if (scans >= 75) level = BADGE_LEVELS[5];
  else if (scans >= 50) level = BADGE_LEVELS[4];
  else if (scans >= 35) level = BADGE_LEVELS[3];
  else if (scans >= 20) level = BADGE_LEVELS[2];
  else if (scans >= 10) level = BADGE_LEVELS[1];

  let badgeIcon = null;
  if (userBadgeRow?.[0]?.badge_name) {
    const { data: badgeData } = await supabase.from('badges').select('icon').eq('name', userBadgeRow[0].badge_name).limit(1);
    badgeIcon = badgeData?.[0]?.icon || null;
  }

  return {
    displayName: profileRow.display_name || targetEmail?.split('@')[0],
    profilePhoto: profileRow.profile_photo || null,
    friendCode: profileRow.friend_code || null,
    completed: completed || 0,
    achievements: achievements || 0,
    wishlist: wishlist || 0,
    friends: friends || 0,
    totalPieces,
    level,
    badgeIcon,
  };
}

export default function UserProfileDialog({ userEmail, authorName, onClose }) {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setProfileData(null);
    setFriendStatus('none');
    loadData();
  }, [userEmail]);

  const loadData = async () => {
    try {
      const { data: { user: loggedUser } } = await supabase.auth.getUser();
      setCurrentUser(loggedUser);

      if (!userEmail) { setLoading(false); return; }

      const stats = await fetchUserPublicStats(userEmail);
      setProfileData(stats);

      if (loggedUser) {
        const [sentCheck, receivedCheck] = await Promise.all([
          supabase.from('friendships').select('id, status').eq('created_by', loggedUser.email).eq('friend_email', userEmail),
          supabase.from('friendships').select('id, status').eq('created_by', userEmail).eq('friend_email', loggedUser.email),
        ]);
        if (sentCheck.data?.length > 0) {
          setFriendStatus(sentCheck.data[0].status === 'accepted' ? 'friend' : 'pending');
        } else if (receivedCheck.data?.length > 0) {
          setFriendStatus(receivedCheck.data[0].status === 'accepted' ? 'friend' : 'received');
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.stopPropagation();
    if (!currentUser) { toast.error('Connectez-vous pour ajouter un ami'); return; }
    if (friendStatus !== 'none') return;
    try {
      const { error } = await supabase.from('friendships').insert({
        created_by: currentUser.email,
        requester_email: currentUser.email,
        addressee_email: userEmail,
        status: 'pending',
      });
      if (error) throw error;
      setFriendStatus('pending');
      toast.success("Demande d'ami envoyée !");
    } catch {
      toast.error("Erreur lors de l'envoi de la demande");
    }
  };

  const displayName = profileData?.displayName || authorName || userEmail?.split('@')[0] || '??';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isOwnProfile = currentUser && currentUser.email === userEmail;
  const formatPieces = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="relative h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-t-2xl">
          <button onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5" style={{ marginTop: '-40px' }}>
          <div className="flex items-end justify-between mb-3">
            <Avatar className="h-16 w-16 ring-4 ring-[#0a0a2e] border-2 border-orange-500/30 flex-shrink-0">
              {profileData?.profilePhoto ? (
                <img src={profileData.profilePhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xl">{initials}</AvatarFallback>
              )}
            </Avatar>
            {!isOwnProfile && (
              <div className="flex items-center gap-2 mb-1">
                <Button
                  onClick={handleAddFriend}
                  size="sm"
                  disabled={friendStatus !== 'none'}
                  className={`rounded-lg text-xs h-8 ${
                    friendStatus === 'friend'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : friendStatus === 'pending'
                      ? 'bg-white/10 text-white/50 cursor-default'
                      : friendStatus === 'received'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {friendStatus === 'friend'
                    ? '✅ Amis'
                    : friendStatus === 'pending'
                    ? 'Demande envoyée'
                    : friendStatus === 'received'
                    ? 'Demande reçue'
                    : 'Ajouter en ami'}
                </Button>
              </div>
            )}
          </div>
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{displayName}</h2>
              {profileData?.badgeIcon && <span className="text-lg">{profileData.badgeIcon}</span>}
              {profileData?.level && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                  {profileData.level.emoji} Niveau {profileData.level.level}
                </span>
              )}
            </div>
            {profileData?.friendCode && <p className="text-orange-400/60 text-xs mt-0.5 font-mono">@{profileData.friendCode}</p>}
            {profileData?.level && <p className="text-white/30 text-xs">{profileData.level.title}</p>}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-white/20 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Puzzle className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{profileData?.completed ?? 0}</div>
                <div className="text-[11px] text-white/50">{t('completed')}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <span className="text-lg block mb-1">🧩</span>
                <div className="text-lg font-bold text-white">{formatPieces(profileData?.totalPieces ?? 0)}</div>
                <div className="text-[11px] text-white/50">Pièces posées</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Trophy className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{profileData?.achievements ?? 0}</div>
                <div className="text-[11px] text-white/50">{t('achievements')}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{profileData?.wishlist ?? 0}</div>
                <div className="text-[11px] text-white/50">{t('wishlist')}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{profileData?.friends ?? 0}</div>
                <div className="text-[11px] text-white/50">Amis</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
