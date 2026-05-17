import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { 
  Calendar, 
  Trophy,
  Heart,
  Puzzle,
  LogIn,
  Loader2,
  Zap,
  TriangleAlert,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Send,
  ArrowLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
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

// ─── Composant Amis intégré ───────────────────────────────────────────────────
function FriendsTab({ user, t }) {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('friends');
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);


  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (selectedFriend && user) {
      loadMessages(selectedFriend.email);
      intervalRef.current = setInterval(() => loadMessages(selectedFriend.email), 8000);
      return () => clearInterval(intervalRef.current);
    }
  }, [selectedFriend, user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [{ data: friendshipsData }, { data: usersData }] = await Promise.all([
        supabase.from('friendships').select('*').or(`requester_email.eq.${user.email},addressee_email.eq.${user.email}`),
        supabase.from('user_profiles').select('*').neq('created_by', user.email)
      ]);
      const acceptedFriends = await Promise.all(
        (friendshipsData || []).filter(
          f => f.status === 'accepted' && (f.requester_email === user.email || f.addressee_email === user.email)
        ).map(async f => {
          const friendEmail = f.requester_email === user.email ? f.addressee_email : f.requester_email;
          const { data: p } = await supabase.from('user_profiles').select('display_name, profile_photo, friend_code').eq('created_by', friendEmail).maybeSingle();
          return {
            email: friendEmail,
            name: p?.display_name || f.addressee_name || f.requester_name || friendEmail?.split('@')[0],
            profile_photo: p?.profile_photo || null,
            friend_code: p?.friend_code || null,
            friendshipId: f.id
          };
        })
      );
      const pending = (friendshipsData || []).filter(f => f.status === 'pending' && f.addressee_email === user.email);
      const sent = (friendshipsData || []).filter(f => f.status === 'pending' && f.requester_email === user.email);
      setFriends(acceptedFriends);
      setPendingRequests(pending);
      setSentRequests(sent);
      setAllUsers((usersData || []).map(u => ({
        ...u,
        email: u.created_by,
        full_name: u.display_name || u.created_by?.split('@')[0],
      })).filter(u => u.email !== user.email));
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const loadMessages = async (friendEmail) => {
    if (!user) return;
    const conversationId = [user.email, friendEmail].sort().join('_');
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_date', { ascending: true });
    const unreadIds = (msgs || []).filter(m => !m.is_read && m.receiver_email === user.email).map(m => m.id);
    if (unreadIds.length > 0) await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
    setMessages(msgs || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !user) return;
    const conversationId = [user.email, selectedFriend.email].sort().join('_');
    const { error } = await supabase.from('messages').insert({
      sender_email: user.email, sender_name: user.full_name || user.email,
      receiver_email: selectedFriend.email, receiver_name: selectedFriend.name,
      message: newMessage.trim(), conversation_id: conversationId,
      is_read: false, created_by: user.email,
    });
    if (!error) { setNewMessage(''); loadMessages(selectedFriend.email); }
  };

  const sendFriendRequest = async (targetUser) => {
    try {
      const { error } = await supabase.from('friendships').insert({
        created_by: user.email,
        requester_email: user.email,
        requester_name: user.full_name || user.email,
        addressee_email: targetUser.email,
        addressee_name: targetUser.display_name || targetUser.full_name || targetUser.email,
        status: 'pending'
      });
      if (error) throw error;
      toast.success("Demande d'ami envoyée !");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi");
    }
  };

  const acceptRequest = async (id) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    loadData();
  };
  const declineRequest = async (id) => {
    await supabase.from('friendships').delete().eq('id', id);
    loadData();
  };
  const removeFriend = async (id) => {
    await supabase.from('friendships').delete().eq('id', id);
    loadData();
  };
  const isFriend = (email) => friends.some(f => f.email === email);
  const hasPendingRequest = (email) => pendingRequests.some(r => r.requester_email === email) || sentRequests.some(r => r.addressee_email === email);
  const filteredUsers = searchQuery.trim().length < 2 ? [] : allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.friend_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>;

  const tabCls = "data-[state=active]:bg-orange-500/20 text-xs sm:text-sm";
  const avatarCls = "h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center rounded-full font-bold text-sm ring-2 ring-orange-500/20";

  return (
    <div className="space-y-4">
      {/* Tabs nav */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
        {[
          { key: 'friends', label: `${t('friends')} (${friends.length})` },
          { key: 'messages', label: t('messages'), badge: unreadConversationsCount },
          { key: 'requests', label: `${t('received')} (${pendingRequests.length})` },
          { key: 'sent', label: `${t('sent')} (${sentRequests.length})` },
          { key: 'find', label: t('findFriends') },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === tab.key ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white'}`}>
            {tab.label}
            {tab.badge > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Amis */}
      {activeTab === 'friends' && (
        friends.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">{t('noFriendsYet')}</p>
          </div>
        ) : friends.map(friend => (
          <div key={friend.email} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={avatarCls}>{friend.name?.slice(0,2).toUpperCase()}</div>
              <p className="text-white font-medium">{friend.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedFriend(friend); setActiveTab('messages'); }} className="p-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"><MessageCircle className="w-4 h-4 text-white" /></button>
              <button onClick={() => removeFriend(friend.friendshipId)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"><UserX className="w-4 h-4 text-red-400" /></button>
            </div>
          </div>
        ))
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        friends.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">{t('addFriendsToChatPrompt')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedFriend ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10"><h3 className="text-white font-semibold">{t('conversations')}</h3></div>
                {friends.map(friend => (
                  <button key={friend.email} onClick={() => setSelectedFriend(friend)} className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5">
                    <div className={avatarCls}>{friend.name?.slice(0,2).toUpperCase()}</div>
                    <p className="text-white font-medium flex-1 text-left">{friend.name}</p>
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
                <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
                  <button onClick={() => setSelectedFriend(null)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"><ArrowLeft className="w-5 h-5 text-white" /></button>
                  <div className={avatarCls + " h-9 w-9"}>{selectedFriend.name?.slice(0,2).toUpperCase()}</div>
                  <p className="text-white font-semibold">{selectedFriend.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-white/30 text-sm py-8">{t('startConversation')}</p>}
                  {messages.map(msg => {
                    const isMine = msg.sender_email === user.email;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] px-4 py-2 rounded-2xl ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>{new Date(msg.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-2">
                  <Input placeholder="Message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} className="bg-white/5 border-white/20 text-white flex-1" style={{ fontSize: '16px' }} />
                  <button onClick={sendMessage} disabled={!newMessage.trim()} className="w-11 h-11 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg transition-colors flex-shrink-0"><Send className="w-4 h-4 text-white" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )
      )}

      {/* Demandes reçues */}
      {activeTab === 'requests' && (
        pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">{t('noPendingRequests')}</p>
          </div>
        ) : pendingRequests.map(req => (
          <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={avatarCls}>{req.requester_name?.slice(0,2).toUpperCase()}</div>
              <p className="text-white font-medium">{req.requester_name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => acceptRequest(req.id)} className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-lg transition-colors"><UserCheck className="w-4 h-4 text-green-400" /></button>
              <button onClick={() => declineRequest(req.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"><UserX className="w-4 h-4 text-red-400" /></button>
            </div>
          </div>
        ))
      )}

      {/* Demandes envoyées */}
      {activeTab === 'sent' && (
        sentRequests.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <UserPlus className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">{t('noSentRequests')}</p>
          </div>
        ) : sentRequests.map(req => (
          <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={avatarCls}>{req.addressee_name?.slice(0,2).toUpperCase()}</div>
              <div>
                <p className="text-white font-medium">{req.addressee_name}</p>
                <p className="text-orange-400/70 text-xs">{t('pendingResponse')}</p>
              </div>
            </div>
            <button onClick={() => declineRequest(req.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 text-sm transition-colors"><UserX className="w-4 h-4" />{t('cancel')}</button>
          </div>
        ))
      )}

      {/* Rechercher */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input placeholder={t('searchByNameOrCode')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/20 text-white" />
          </div>
          {searchQuery.trim().length < 2 && <div className="text-center py-8 text-white/40 text-sm">{t('typeAtLeast2Chars')}</div>}
          {filteredUsers.map(targetUser => (
            <div key={targetUser.email} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={avatarCls}>{(targetUser.full_name || targetUser.email)?.slice(0,2).toUpperCase()}</div>
                <div>
                  <p className="text-white font-medium">{targetUser.display_name || targetUser.full_name}</p>
                  {targetUser.friend_code && <p className="text-orange-400/70 text-xs">@{targetUser.friend_code}</p>}
                </div>
              </div>
              {isFriend(targetUser.email) ? (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-white/50 text-sm"><UserCheck className="w-4 h-4" />{t('friend')}</span>
              ) : hasPendingRequest(targetUser.email) ? (
                <span className="px-3 py-1.5 bg-white/10 rounded-lg text-white/50 text-sm">{t('pending')}</span>
              ) : (
                <button onClick={() => sendFriendRequest(targetUser)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm transition-colors"><UserPlus className="w-4 h-4" />{t('addFriend')}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

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
      const { data: { user: authUser } } = await supabase.auth.getUser();
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

          {/* Total Pièces + Amis côte à côte */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Total Pièces */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🧩</span>
                </div>
                <p className="text-white/50 text-xs">{t('piecesAssembled')}</p>
              </div>
              <div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-2xl font-bold text-white">{formatPieces(stats.totalPieces)}</span>
                  {stats.totalPieces >= 1000 && (
                    <span className="text-white/40 text-xs">{stats.totalPieces.toLocaleString()}</span>
                  )}
                </div>
                <div className="text-orange-400 font-semibold text-xs mt-1">{stats.completed} puzzle{stats.completed > 1 ? 's' : ''} {t('puzzlesCompletedLabel')}</div>
              </div>
            </motion.div>

            {/* Amis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-4 flex flex-col overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-orange-400 shrink-0" />
                <h2 className="text-white font-semibold text-sm">Amis</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FriendsTab user={user} t={t} />
              </div>
            </motion.div>
          </div>

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
        <div>
          <div className="overflow-x-auto scrollbar-hide w-full">
          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-lg min-w-max">
            <button onClick={() => setActiveTab('collection')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'collection' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
              <Puzzle className="w-4 h-4 shrink-0" />
              <span>{t('collection')}</span>
            </button>
            <button onClick={() => setActiveTab('wishlist')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'wishlist' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
              <Heart className="w-4 h-4 shrink-0" />
              <span>Wishlist</span>
            </button>
            <button onClick={() => setActiveTab('personal')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'personal' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
              <span>🔒</span>
              <span>{t('personalTab')}</span>
            </button>
            <button onClick={() => setActiveTab('speed')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === 'speed' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
              <Zap className="w-4 h-4 shrink-0" />
              <span>Speed</span>
            </button>

          </div>
          </div>

          {activeTab === 'collection' && <div className="mt-6"><CollectionSection user={user} /></div>}
          {activeTab === 'wishlist' && <div className="mt-6"><WishlistSection user={user} /></div>}
          {activeTab === 'personal' && <div className="mt-6"><PersonalPuzzleSection user={user} /></div>}
          {activeTab === 'speed' && <div className="mt-6"><SpeedPuzzleSection user={user} /></div>}

        </div>

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
