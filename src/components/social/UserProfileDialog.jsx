import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Puzzle, Trophy, UserPlus, UserCheck, Users, Heart } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';

export default function UserProfileDialog({ userEmail, authorName, onClose }) {
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none' | 'pending' | 'friend'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setProfileData(null);
    setIsFollowing(false);
    loadData();
  }, [userEmail]);

  const loadData = async () => {
    try {
      const loggedUser = await base44.auth.me().catch(() => null);
      setCurrentUser(loggedUser);

      if (!userEmail) {
        console.error('UserProfileDialog: userEmail is missing');
        setLoading(false);
        return;
      }

      // Call backend function with service role to bypass RLS
      const res = await base44.functions.invoke('getUserPublicStats', { targetEmail: userEmail });
      setProfileData(res.data);

      if (loggedUser) {
        const [followCheck, sentCheck, receivedCheck] = await Promise.all([
          base44.entities.Follow.filter({ follower_email: loggedUser.email, following_email: userEmail }),
          base44.entities.Friendship.filter({ requester_email: loggedUser.email, addressee_email: userEmail }),
          base44.entities.Friendship.filter({ requester_email: userEmail, addressee_email: loggedUser.email }),
        ]);
        setIsFollowing(followCheck.length > 0);
        if (sentCheck.length > 0) {
          setFriendStatus(sentCheck[0].status === 'accepted' ? 'friend' : 'pending');
        } else if (receivedCheck.length > 0) {
          setFriendStatus(receivedCheck[0].status === 'accepted' ? 'friend' : 'received');
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
    if (!currentUser) { toast.error(t('loginToFollow')); return; }
    if (friendStatus !== 'none') return;
    try {
      await base44.entities.Friendship.create({
        requester_email: currentUser.email,
        addressee_email: userEmail,
        status: 'pending',
      });
      setFriendStatus('pending');
      toast.success('Demande d\'ami envoyée !');
    } catch {
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!currentUser) { toast.error(t('loginToFollow')); return; }
    const prev = isFollowing;
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? t('unfollowed') : t('followedUser'));
    try {
      if (prev) {
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: userEmail,
        });
        if (follows.length > 0) await base44.entities.Follow.delete(follows[0].id);
      } else {
        await base44.entities.Follow.create({
          follower_email: currentUser.email,
          following_email: userEmail,
        });
      }
    } catch {
      setIsFollowing(prev);
      toast.error(t('followUpdateFailed'));
    }
  };

  const displayName = profileData?.displayName || authorName || userEmail?.split('@')[0] || '??';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isOwnProfile = currentUser && currentUser.email === userEmail;

  const formatPieces = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header banner */}
        <div className="relative h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-t-2xl">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-5" style={{ marginTop: '-40px' }}>
          {/* Avatar + follow button */}
          <div className="flex items-end justify-between mb-3">
            <Avatar className="h-16 w-16 ring-4 ring-[#0a0a2e] border-2 border-orange-500/30 flex-shrink-0">
              {profileData?.profilePhoto ? (
                <img src={profileData.profilePhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xl">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {!isOwnProfile && (
              <div className="flex items-center gap-2 mb-1">
                <Button
                  onClick={handleFollow}
                  size="sm"
                  className={`rounded-lg text-xs h-8 ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isFollowing
                    ? <><UserCheck className="w-3 h-3 mr-1" />{t('following2')}</>
                    : <><UserPlus className="w-3 h-3 mr-1" />{t('follow')}</>
                  }
                </Button>
                <Button
                  onClick={handleAddFriend}
                  size="sm"
                  disabled={friendStatus !== 'none'}
                  className={`rounded-lg text-xs h-8 ${
                    friendStatus === 'friend'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : friendStatus === 'pending'
                      ? 'bg-white/10 text-white/50'
                      : friendStatus === 'received'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Users className="w-3 h-3 mr-1" />
                  {friendStatus === 'friend' ? 'Amis' : friendStatus === 'pending' ? 'En attente' : friendStatus === 'received' ? 'Reçue' : 'Ajouter'}
                </Button>
              </div>
            )}
          </div>

          {/* Name + level badge */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">{displayName}</h2>
              {profileData?.badgeIcon && (
                <span className="text-lg">{profileData.badgeIcon}</span>
              )}
              {profileData?.level && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
                  {profileData.level.emoji} Niveau {profileData.level.level}
                </span>
              )}
            </div>
            {profileData?.friendCode && (
              <p className="text-orange-400/60 text-xs mt-0.5 font-mono">@{profileData.friendCode}</p>
            )}
            {profileData?.level && (
              <p className="text-white/30 text-xs">{profileData.level.title}</p>
            )}
          </div>

          {/* Stats */}
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