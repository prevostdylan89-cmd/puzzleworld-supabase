import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Puzzle, Bookmark, BookmarkCheck, ThumbsDown, Flame, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import CommentSection from './CommentSection';
import UserLevelTag from '@/components/shared/UserLevelTag';
import PuzzleDetailClickable from '@/components/collection/PuzzleDetailClickable';
import UserProfileDialog from './UserProfileDialog';
import UserBadgeDisplay from './UserBadgeDisplay';
import AuthorLevelBadge from './AuthorLevelBadge';
import PostAuthorBadge from './PostAuthorBadge';
import SharePostButton from './SharePostButton';

export default function PostCard({ post, user, isFeatured = false }) {
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isPuzzleLiked, setIsPuzzleLiked] = useState(false);
  const [isPuzzleDisliked, setIsPuzzleDisliked] = useState(false);
  const [showPuzzleDetail, setShowPuzzleDetail] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAuthorProfile, setShowAuthorProfile] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState('none');

  // Charger le profil auteur
  useEffect(() => {
    if (!post.created_by) return;
    supabase.from('user_profiles').select('profile_photo, display_name').eq('created_by', post.created_by).maybeSingle()
      .then(({ data }) => { if (data) setAuthorProfile(data); });
  }, [post.created_by]);

  const isOwnPost = user && post.created_by === user.email;
  const isCompletionPost = post.is_completion_post && post.puzzle_name && post.puzzle_reference;
  const showPuzzleActions = !isOwnPost && isCompletionPost && user;

  // Charger les vraies données au montage
  useEffect(() => {
    loadRealCounts();
    if (user) {
      checkIfLiked();
      checkFriendStatus();
      if (showPuzzleActions) {
        checkIfInWishlist();
        checkIfPuzzleDisliked();
      }
    }
  }, [post.id, user?.email]);

  // Charger les vrais compteurs depuis Supabase
  const loadRealCounts = async () => {
    const [{ count: likesC }, { count: commentsC }] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    ]);
    if (likesC !== null) setLikesCount(likesC);
    if (commentsC !== null) setCommentsCount(commentsC);
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('created_by', user.email).maybeSingle();
    setIsLiked(!!data);
  };

  const checkFriendStatus = async () => {
    if (!user || isOwnPost) return;
    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase.from('friendships').select('id, status').eq('created_by', user.email).eq('friend_email', post.created_by),
      supabase.from('friendships').select('id, status').eq('created_by', post.created_by).eq('friend_email', user.email),
    ]);
    if (sent?.length > 0) setFriendStatus(sent[0].status === 'accepted' ? 'friend' : 'pending');
    else if (received?.length > 0) setFriendStatus(received[0].status === 'accepted' ? 'friend' : 'received');
  };

  const checkIfInWishlist = async () => {
    if (!user || !post.puzzle_name) return;
    const { data } = await supabase.from('user_puzzles').select('id').eq('puzzle_name', post.puzzle_name).eq('created_by', user.email).eq('status', 'wishlist').maybeSingle();
    setIsInWishlist(!!data);
    setIsPuzzleLiked(!!data);
  };

  const checkIfPuzzleDisliked = async () => {
    if (!user || !post.puzzle_reference) return;
    const { data } = await supabase.from('user_puzzles').select('id').eq('puzzle_reference', post.puzzle_reference).eq('created_by', user.email).eq('notes', 'Non aimé').maybeSingle();
    setIsPuzzleDisliked(!!data);
  };

  // ── Like / Unlike ─────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user) { toast.error(t('loginToLike')); return; }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('created_by', user.email);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, created_by: user.email });
      }
      // Sync compteur dans posts
      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
      if (count !== null) {
        setLikesCount(count);
        await supabase.from('posts').update({ likes_count: count }).eq('id', post.id);
      }
    } catch (err) {
      setIsLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
      toast.error(t('likeUpdateFailed'));
    }
  };

  // ── Ajout ami ─────────────────────────────────────────────────────────────
  const handleAddFriend = async () => {
    if (!user) { toast.error(t('loginToFollow')); return; }
    if (friendStatus !== 'none') return;
    try {
      const { error } = await supabase.from('friendships').insert({
        created_by: user.email,
        requester_email: user.email,
        addressee_email: post.created_by,
        status: 'pending',
      });
      if (error) throw error;
      setFriendStatus('pending');
      toast.success("Demande d'ami envoyée !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi de la demande");
    }
  };

  // ── Wishlist puzzle ────────────────────────────────────────────────────────
  const handleAddToWishlist = async () => {
    if (!user) { toast.error(t('loginToWishlist')); return; }
    try {
      if (isInWishlist) {
        await supabase.from('user_puzzles').delete().eq('puzzle_name', post.puzzle_name).eq('created_by', user.email).eq('status', 'wishlist');
        setIsInWishlist(false);
        toast.success(t('removedFromWishlist'));
      } else {
        await supabase.from('user_puzzles').insert({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'wishlist',
          created_by: user.email,
        });
        setIsInWishlist(true);
        toast.success(t('addedToWishlist'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('wishlistUpdateFailed'));
    }
  };

  // ── Like puzzle ───────────────────────────────────────────────────────────
  const handlePuzzleLike = async () => {
    if (!user) { toast.error(t('loginToLikePuzzle')); return; }
    const wasLiked = isPuzzleLiked;
    setIsPuzzleLiked(!wasLiked);
    try {
      if (wasLiked) {
        await supabase.from('user_puzzles').delete().eq('puzzle_name', post.puzzle_name).eq('created_by', user.email).eq('status', 'wishlist');
        setIsInWishlist(false);
        toast.success(t('puzzleRemovedFromWishlist'));
      } else {
        await supabase.from('user_puzzles').insert({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'wishlist',
          created_by: user.email,
        });
        setIsInWishlist(true);
        toast.success(t('puzzleAddedToWishlist'));
      }
    } catch (err) {
      setIsPuzzleLiked(wasLiked);
      toast.error(t('updateFailed'));
    }
  };

  // ── Dislike puzzle ────────────────────────────────────────────────────────
  const handlePuzzleDislike = async () => {
    if (!user) { toast.error(t('loginToDislikePuzzle')); return; }
    const wasDisliked = isPuzzleDisliked;
    setIsPuzzleDisliked(!wasDisliked);
    try {
      if (wasDisliked) {
        await supabase.from('user_puzzles').delete().eq('puzzle_reference', post.puzzle_reference).eq('created_by', user.email).eq('notes', 'Non aimé');
        toast.success(t('dislikeRemoved'));
      } else {
        await supabase.from('user_puzzles').insert({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'done',
          notes: 'Non aimé',
          created_by: user.email,
        });
        toast.success(t('puzzleDisliked'));
      }
    } catch (err) {
      setIsPuzzleDisliked(wasDisliked);
      toast.error(t('updateFailed'));
    }
  };

  const handleCommentAdded = () => setCommentsCount(c => c + 1);

  const authorInitials = post.author_name
    ? post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : 'just now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl rounded-2xl overflow-hidden transition-all ${
        isFeatured
          ? 'bg-gradient-to-br from-orange-500/10 to-white/[0.03] border border-orange-500/30 shadow-lg shadow-orange-500/5'
          : 'bg-white/[0.03] border border-white/[0.06]'
      }`}
    >
      {isFeatured && (
        <div className="px-4 pt-3 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-orange-400 text-xs font-semibold">{t('trending')}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <button onClick={() => setShowAuthorProfile(true)}>
          <Avatar className="h-10 w-10 ring-2 ring-orange-500/20 cursor-pointer hover:ring-orange-500/40 transition-all flex-shrink-0">
            {authorProfile?.profile_photo ? (
              <img src={authorProfile.profile_photo} alt={post.author_name} className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold">
                {(post.author_name || post.created_by || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">
              {authorProfile?.display_name || post.author_name || post.created_by?.split('@')[0] || ''}
            </span>
            <PostAuthorBadge userEmail={post.created_by} />
            {post.created_by && <AuthorLevelBadge userEmail={post.created_by} />}
            {post.is_completion_post && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <Puzzle className="w-3 h-3 mr-1" />
                {t('puzzleCompleted')}
              </Badge>
            )}
          </div>
          <p className="text-white/40 text-xs">{timeAgo}</p>
        </div>
        {user && !isOwnPost && (
          <Button
            onClick={handleAddFriend}
            size="sm"
            disabled={friendStatus !== 'none'}
            className={`rounded-full text-xs h-7 px-3 ${
              friendStatus === 'friend'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : friendStatus === 'pending'
                ? 'bg-white/10 text-white/50 cursor-default'
                : friendStatus === 'received'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
            }`}
          >
            <Users className="w-3 h-3 mr-1" />
            {friendStatus === 'friend' ? '✅ Amis' : friendStatus === 'pending' ? 'Demande envoyée' : friendStatus === 'received' ? 'Demande reçue' : 'Ajouter en ami'}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap select-text">{post.content}</p>
      </div>

      {/* Puzzle Details */}
      {post.is_completion_post && post.puzzle_name && (
        <div className="px-4 pb-3">
          <button
            onClick={() => post.puzzle_reference && setShowPuzzleDetail(true)}
            className={`w-full p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-left ${
              post.puzzle_reference ? 'hover:bg-orange-500/15 cursor-pointer transition-colors' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Puzzle className="w-4 h-4 text-orange-400" />
                  <p className="text-white font-medium text-sm">{post.puzzle_name}</p>
                  {post.puzzle_reference && <span className="text-orange-400 text-xs">{t('viewDetails')}</span>}
                </div>
                <div className="space-y-0.5 text-xs text-white/60">
                  {post.puzzle_brand && <p>{t('puzzleBrandLabel')}{post.puzzle_brand}</p>}
                  {post.puzzle_pieces && <p>{t('puzzlePiecesLabel')}{post.puzzle_pieces}</p>}
                  {post.puzzle_category && <p>{t('puzzleCategoryLabel')}{post.puzzle_category}</p>}
                  {post.puzzle_reference && <p>{t('puzzleRefLabel')}{post.puzzle_reference}</p>}
                </div>
              </div>
            </div>
            {showPuzzleActions && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <Button onClick={handlePuzzleLike} size="sm"
                  className={`flex-1 rounded-lg ${isPuzzleLiked ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' : 'bg-white/5 text-white/70 hover:bg-green-500/10 hover:text-green-400 border border-white/10'}`}>
                  <Heart className={`w-4 h-4 mr-1 ${isPuzzleLiked ? 'fill-green-400' : ''}`} />{t('iLike')}
                </Button>
                <Button onClick={handlePuzzleDislike} size="sm"
                  className={`flex-1 rounded-lg ${isPuzzleDisliked ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-white/5 text-white/70 hover:bg-red-500/10 hover:text-red-400 border border-white/10'}`}>
                  <ThumbsDown className={`w-4 h-4 mr-1 ${isPuzzleDisliked ? 'fill-red-400' : ''}`} />{t('notLiked')}
                </Button>
                <Button onClick={handleAddToWishlist} size="sm"
                  className={`flex-1 rounded-lg ${isInWishlist ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30' : 'bg-white/5 text-white/70 hover:bg-orange-500/10 hover:text-orange-400 border border-white/10'}`}>
                  {isInWishlist ? <><BookmarkCheck className="w-4 h-4 mr-1" />Wishlist</> : <><Bookmark className="w-4 h-4 mr-1" />Wishlist</>}
                </Button>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img src={post.image_url} alt="Post" onClick={() => setLightboxOpen(true)}
            className="w-full rounded-xl object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity" />
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && post.image_url && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <img src={post.image_url} alt="Post" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors">✕</button>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-6">
        <button onClick={handleLike} disabled={isProcessing}
          className="flex items-center gap-2 text-white/50 hover:text-pink-400 transition-colors group disabled:opacity-50">
          <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/50 hover:text-blue-400 transition-colors group">
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{commentsCount}</span>
        </button>
        {isOwnPost && (
          <div className="ml-auto">
            <SharePostButton post={post} />
          </div>
        )}
      </div>

      {/* Comments */}
      {showComments && <CommentSection post={post} user={user} onCommentAdded={handleCommentAdded} />}

      {/* Puzzle Detail */}
      {showPuzzleDetail && post.puzzle_reference && (
        <PuzzleDetailClickable puzzleReference={post.puzzle_reference} onClose={() => setShowPuzzleDetail(false)} />
      )}

      {/* Author Profile Dialog */}
      {showAuthorProfile && (
        <UserProfileDialog
          userEmail={post.created_by}
          authorName={authorProfile?.display_name || post.author_name}
          onClose={() => setShowAuthorProfile(false)}
        />
      )}
    </motion.div>
  );
}
