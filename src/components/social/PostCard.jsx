import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, UserCheck, Puzzle, Bookmark, BookmarkCheck, ThumbsDown, Flame } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import CommentSection from './CommentSection';

import UserBadge from '@/components/shared/UserBadge';
import UserLevelTag from '@/components/shared/UserLevelTag';
import PuzzleDetailClickable from '@/components/collection/PuzzleDetailClickable';
import UserProfileDialog from './UserProfileDialog';
import UserBadgeDisplay from './UserBadgeDisplay';
import AuthorLevelBadge from './AuthorLevelBadge';
import PostAuthorBadge from './PostAuthorBadge';

export default function PostCard({ post, user, isFeatured = false }) {
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isPuzzleLiked, setIsPuzzleLiked] = useState(false);
  const [isPuzzleDisliked, setIsPuzzleDisliked] = useState(false);
  const [showPuzzleDetail, setShowPuzzleDetail] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showAuthorProfile, setShowAuthorProfile] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState('none'); // 'none' | 'pending' | 'friend'
  const [authorDisplayName, setAuthorDisplayName] = useState(null);

  useEffect(() => {
    if (!post.created_by) console.warn('PostCard: post.created_by is missing', post);
  }, [post.created_by]);

  const isOwnPost = user && post.created_by === user.email;
  const isCompletionPost = post.is_completion_post && post.puzzle_name && post.puzzle_reference;
  const showPuzzleActions = !isOwnPost && isCompletionPost && user;

  useEffect(() => {
    if (user) {
      checkIfLiked();
      checkIfFollowing();
      checkFriendStatus();
      if (showPuzzleActions) {
        checkIfInWishlist();
        checkIfPuzzleLiked();
        checkIfPuzzleDisliked();
      }
    }
  }, [post.id, user?.email]);

  const checkFriendStatus = async () => {
    if (!user || isOwnPost) return;
    const sentCheck = await base44.entities.Friendship.filter({
      requester_email: user.email,
      addressee_email: post.created_by
    });
    const receivedCheck = await base44.entities.Friendship.filter({
      requester_email: post.created_by,
      addressee_email: user.email
    });
    if (sentCheck.length > 0) {
      setFriendStatus(sentCheck[0].status === 'accepted' ? 'friend' : 'pending');
    } else if (receivedCheck.length > 0) {
      setFriendStatus(receivedCheck[0].status === 'accepted' ? 'friend' : 'received');
    }
  };

  const checkIfLiked = async () => {
    if (!user) return;
    const likes = await base44.entities.Like.filter({
      post_id: post.id,
      user_id: user.email
    });
    setIsLiked(likes.length > 0);
  };

  const checkIfFollowing = async () => {
    if (!user || isOwnPost) return;
    const follows = await base44.entities.Follow.filter({
      follower_email: user.email,
      following_email: post.created_by
    });
    setIsFollowing(follows.length > 0);
  };

  const checkIfInWishlist = async () => {
    if (!user) return;
    const existing = await base44.entities.UserPuzzle.filter({
      puzzle_name: post.puzzle_name,
      created_by: user.email,
      status: 'wishlist'
    });
    setIsInWishlist(existing.length > 0);
  };

  const checkIfPuzzleLiked = async () => {
    if (!user || !post.puzzle_name) return;
    const existing = await base44.entities.UserPuzzle.filter({
      puzzle_name: post.puzzle_name,
      created_by: user.email,
      status: 'wishlist'
    });
    setIsPuzzleLiked(existing.length > 0);
  };

  const checkIfPuzzleDisliked = async () => {
    if (!user || !post.puzzle_reference) return;
    const dislikes = await base44.entities.UserPuzzle.filter({
      puzzle_reference: post.puzzle_reference,
      created_by: user.email,
      notes: 'Non aimé'
    });
    setIsPuzzleDisliked(dislikes.length > 0);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error(t('loginToLike'));
      return;
    }

    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? Math.max(0, likesCount - 1) : likesCount + 1);

    try {
      if (previousLiked) {
        const likes = await base44.entities.Like.filter({
          post_id: post.id,
          user_id: user.email
        });
        if (likes.length > 0) {
          await base44.entities.Like.delete(likes[0].id);
          const newCount = Math.max(0, previousCount - 1);
          await base44.entities.Post.update(post.id, { likes_count: newCount });
          
          // Update socialScore in PuzzleCatalog if post is linked to a puzzle
          if (post.puzzle_reference) {
            const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
            if (puzzles.length > 0) {
              const puzzle = puzzles[0];
              await base44.entities.PuzzleCatalog.update(puzzle.id, {
                socialScore: Math.max(0, (puzzle.socialScore || 0) - 1)
              });
            }
          }
        }
      } else {
        await base44.entities.Like.create({
          post_id: post.id,
          user_id: user.email
        });
        const newCount = previousCount + 1;
        await base44.entities.Post.update(post.id, { likes_count: newCount });
        
        // Update socialScore in PuzzleCatalog if post is linked to a puzzle
        if (post.puzzle_reference) {
          const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
          if (puzzles.length > 0) {
            const puzzle = puzzles[0];
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Error toggling like:', error);
      toast.error(t('likeUpdateFailed'));
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error(t('loginToWishlist'));
      return;
    }

    try {
      if (isInWishlist) {
        const existing = await base44.entities.UserPuzzle.filter({
          puzzle_name: post.puzzle_name,
          created_by: user.email,
          status: 'wishlist'
        });
        if (existing.length > 0) {
          await base44.entities.UserPuzzle.delete(existing[0].id);
          setIsInWishlist(false);
          toast.success(t('removedFromWishlist'));
          
          // Update wishlistCount in PuzzleCatalog
          if (post.puzzle_reference) {
            const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
            if (puzzles.length > 0) {
              const puzzle = puzzles[0];
              await base44.entities.PuzzleCatalog.update(puzzle.id, {
                wishlistCount: Math.max(0, (puzzle.wishlistCount || 0) - 1)
              });
            }
          }
        }
      } else {
        await base44.entities.UserPuzzle.create({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'wishlist'
        });
        setIsInWishlist(true);
        toast.success(t('addedToWishlist'));
        
        // Update wishlistCount in PuzzleCatalog
        if (post.puzzle_reference) {
          const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
          if (puzzles.length > 0) {
            const puzzle = puzzles[0];
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              wishlistCount: (puzzle.wishlistCount || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      console.error('Error managing wishlist:', error);
      toast.error(t('wishlistUpdateFailed'));
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error(t('loginToFollow'));
      return;
    }

    // Optimistic update
    const previousFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? t('unfollowed') : t('followedUser'));

    try {
      if (previousFollowing) {
        const follows = await base44.entities.Follow.filter({
          follower_email: user.email,
          following_email: post.created_by
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
      } else {
        await base44.entities.Follow.create({
          follower_email: user.email,
          following_email: post.created_by
        });
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(previousFollowing);
      console.error('Error toggling follow:', error);
      toast.error(t('followUpdateFailed'));
    }
  };

  const handleAddFriend = async () => {
    if (!user) {
      toast.error(t('loginToFollow'));
      return;
    }
    if (friendStatus !== 'none') return;
    try {
      await base44.entities.Friendship.create({
        requester_email: user.email,
        addressee_email: post.created_by,
        status: 'pending',
      });
      setFriendStatus('pending');
      toast.success('Demande d\'ami envoyée !');
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  };

  const handlePuzzleDislike = async () => {
    if (!user) {
      toast.error(t('loginToDislikePuzzle'));
      return;
    }

    // Optimistic update
    const previousDisliked = isPuzzleDisliked;
    setIsPuzzleDisliked(!isPuzzleDisliked);

    try {
      if (previousDisliked) {
        // Remove dislike
        const dislikes = await base44.entities.UserPuzzle.filter({
          puzzle_reference: post.puzzle_reference,
          created_by: user.email,
          notes: 'Non aimé'
        });
        if (dislikes.length > 0) {
          await base44.entities.UserPuzzle.delete(dislikes[0].id);
          toast.success(t('dislikeRemoved'));
          
          // Update socialScore (+1 when removing dislike)
          if (post.puzzle_reference) {
            const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
            if (puzzles.length > 0) {
              const puzzle = puzzles[0];
              await base44.entities.PuzzleCatalog.update(puzzle.id, {
                socialScore: (puzzle.socialScore || 0) + 1,
                total_dislikes: Math.max(0, (puzzle.total_dislikes || 0) - 1)
              });
            }
          }
        }
      } else {
        // Add dislike
        await base44.entities.UserPuzzle.create({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'done',
          notes: 'Non aimé'
        });
        
        toast.success(t('puzzleDisliked'));
        
        // Update socialScore (-1 for dislike)
        if (post.puzzle_reference) {
          const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
          if (puzzles.length > 0) {
            const puzzle = puzzles[0];
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              socialScore: (puzzle.socialScore || 0) - 1,
              total_dislikes: (puzzle.total_dislikes || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      // Revert on error
      setIsPuzzleDisliked(previousDisliked);
      console.error('Error toggling puzzle dislike:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handlePuzzleLike = async () => {
    if (!user) {
      toast.error(t('loginToLikePuzzle'));
      return;
    }

    // Optimistic update
    const previousLiked = isPuzzleLiked;
    setIsPuzzleLiked(!isPuzzleLiked);

    try {
      if (previousLiked) {
        const existing = await base44.entities.UserPuzzle.filter({
          puzzle_name: post.puzzle_name,
          created_by: user.email,
          status: 'wishlist'
        });
        if (existing.length > 0) {
          await base44.entities.UserPuzzle.delete(existing[0].id);
          toast.success(t('puzzleRemovedFromWishlist'));
          setIsInWishlist(false);
          
          // Update wishlistCount in PuzzleCatalog
          if (post.puzzle_reference) {
            const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
            if (puzzles.length > 0) {
              const puzzle = puzzles[0];
              await base44.entities.PuzzleCatalog.update(puzzle.id, {
                wishlistCount: Math.max(0, (puzzle.wishlistCount || 0) - 1)
              });
            }
          }
        }
      } else {
        // Add to wishlist instead of likes
        await base44.entities.UserPuzzle.create({
          puzzle_name: post.puzzle_name,
          puzzle_brand: post.puzzle_brand || '',
          puzzle_pieces: post.puzzle_pieces || 0,
          puzzle_reference: post.puzzle_reference || '',
          image_url: post.image_url || '',
          status: 'wishlist'
        });
        
        toast.success(t('puzzleAddedToWishlist'));
        setIsInWishlist(true);
        
        // Update wishlistCount in PuzzleCatalog
        if (post.puzzle_reference) {
          const puzzles = await base44.entities.PuzzleCatalog.filter({ asin: post.puzzle_reference });
          if (puzzles.length > 0) {
            const puzzle = puzzles[0];
            await base44.entities.PuzzleCatalog.update(puzzle.id, {
              wishlistCount: (puzzle.wishlistCount || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      // Revert on error
      setIsPuzzleLiked(previousLiked);
      console.error('Error toggling puzzle like:', error);
      toast.error(t('updateFailed'));
    }
  };

  const handleCommentAdded = () => {
    setCommentsCount(commentsCount + 1);
  };

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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">
              {authorProfile?.display_name || authorProfile?.full_name || post.author_name || post.created_by?.split('@')[0] || ''}
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
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleFollow}
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              className={`rounded-full text-xs h-7 px-3 ${
                isFollowing 
                  ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 mr-1" />
                  {t('following2')}
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 mr-1" />
                  {t('follow2')}
                </>
              )}
            </Button>
            

          </div>
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
                  {post.puzzle_reference && (
                    <span className="text-orange-400 text-xs">{t('viewDetails')}</span>
                  )}
                </div>
                <div className="space-y-0.5 text-xs text-white/60">
                  {post.puzzle_brand && <p>{t('puzzleBrandLabel')}{post.puzzle_brand}</p>}
                  {post.puzzle_pieces && <p>{t('puzzlePiecesLabel')}{post.puzzle_pieces}</p>}
                  {post.puzzle_category && <p>{t('puzzleCategoryLabel')}{post.puzzle_category}</p>}
                  {post.puzzle_reference && <p>{t('puzzleRefLabel')}{post.puzzle_reference}</p>}
                </div>
              </div>
            </div>
            
            {/* Puzzle Actions - Only on puzzle posts */}
            {showPuzzleActions && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <Button
                  onClick={handlePuzzleLike}
                  size="sm"
                  className={`flex-1 rounded-lg ${
                    isPuzzleLiked 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                      : 'bg-white/5 text-white/70 hover:bg-green-500/10 hover:text-green-400 border border-white/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isPuzzleLiked ? 'fill-green-400' : ''}`} />
                  {t('iLike')}
                </Button>
                
                <Button
                  onClick={handlePuzzleDislike}
                  size="sm"
                  className={`flex-1 rounded-lg ${
                    isPuzzleDisliked 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                      : 'bg-white/5 text-white/70 hover:bg-red-500/10 hover:text-red-400 border border-white/10'
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 mr-1 ${isPuzzleDisliked ? 'fill-red-400' : ''}`} />
                  {t('notLiked')}
                </Button>
                
                <Button
                  onClick={handleAddToWishlist}
                  size="sm"
                  className={`flex-1 rounded-lg ${
                    isInWishlist 
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30' 
                      : 'bg-white/5 text-white/70 hover:bg-orange-500/10 hover:text-orange-400 border border-white/10'
                  }`}
                >
                  {isInWishlist ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1" />
                      Wishlist
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      Wishlist
                    </>
                  )}
                </Button>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-4">
          <img
            src={post.image_url}
            alt="Post"
            onClick={() => setLightboxOpen(true)}
            className="w-full rounded-xl object-cover max-h-96 cursor-pointer hover:opacity-90 transition-opacity"
          />
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && post.image_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={post.image_url}
            alt="Post"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Post Actions (Like & Comment) */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-6">
        <button 
          onClick={handleLike}
          disabled={isProcessing}
          className="flex items-center gap-2 text-white/50 hover:text-pink-400 transition-colors group disabled:opacity-50"
        >
          <Heart className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/50 hover:text-blue-400 transition-colors group"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm">{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          post={post} 
          user={user} 
          onCommentAdded={handleCommentAdded}
        />
      )}



      {/* Puzzle Detail Dialog */}
      {showPuzzleDetail && post.puzzle_reference && (
        <PuzzleDetailClickable
          puzzleReference={post.puzzle_reference}
          onClose={() => setShowPuzzleDetail(false)}
        />
      )}


    </motion.div>
  );
}