import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/components/LanguageContext';
import UserProfileDialog from './UserProfileDialog';

function CommentItem({ comment, commentInitials, timeAgo }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [displayName, setDisplayName] = useState(comment.author_name);

  useEffect(() => {
    if (!comment.author_name) return;
    
    // Fetch profile photo by searching display_name with the pseudo (author_name)
    const fetchPhoto = async () => {
      try {
        // Search by display_name (the pseudo from the comment)
        const profiles = await base44.entities.UserProfile.filter({ display_name: comment.author_name });
        if (profiles.length > 0 && profiles[0].profile_photo) {
          setProfilePhoto(profiles[0].profile_photo);
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
      }
    };

    fetchPhoto();
    
    // Check admin status
    if (comment.created_by) {
      base44.entities.User.filter({ email: comment.created_by })
        .then(users => { if (users.length > 0 && users[0].role === 'admin') setIsAdmin(true); })
        .catch(() => {});
    }
  }, [comment.author_name, comment.created_by]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      <button onClick={() => comment.created_by && setShowProfile(true)}>
        <Avatar className="h-8 w-8 ring-2 ring-purple-500/20 cursor-pointer hover:ring-purple-500/40 transition-all">
          {profilePhoto ? (
            <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-white/20 text-white text-xs">
              {commentInitials}
            </AvatarFallback>
          )}
        </Avatar>
      </button>
      {showProfile && comment.created_by && (
        <UserProfileDialog
          userEmail={comment.created_by}
          authorName={comment.author_name}
          onClose={() => setShowProfile(false)}
        />
      )}
      <div className="flex-1">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-white/90 font-medium text-sm">{displayName}</p>
            {isAdmin && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold whitespace-nowrap">
                👑 Admin
              </span>
            )}
          </div>
          <p className="text-white/70 text-sm">{comment.content}</p>
        </div>
        <p className="text-white/30 text-xs mt-1 ml-3">{timeAgo}</p>
      </div>
    </motion.div>
  );
}

export default function CommentSection({ post, user, onCommentAdded }) {
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ email: user.email })
      .then(profiles => { 
        if (profiles.length > 0 && profiles[0].profile_photo) {
          setCurrentUserPhoto(profiles[0].profile_photo);
        }
      })
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      const commentsList = await base44.entities.Comment.filter(
        { post_id: post.id },
        '-created_date'
      );
      setComments(commentsList);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('logIn'));
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await base44.entities.Comment.create({
        post_id: post.id,
        content: newComment.trim(),
        author_name: user.full_name || user.email
      });

      setComments([comment, ...comments]);
      setNewComment('');
      
      // Update post comments count
      await base44.entities.Post.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });

      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(t('postFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="border-t border-white/[0.06] bg-white/[0.02]">
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-white/[0.06]">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
              {currentUserPhoto ? (
                <img src={currentUserPhoto} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs">
                  {userInitials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('addComment')}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                disabled={isSubmitting}
              />
              <Button 
                type="submit"
                size="icon"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <p className="text-white/40 text-sm text-center py-4">{t('loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-4">{t('noComments')}</p>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => {
              const commentInitials = comment.author_name 
                ? comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'U';
              
              const timeAgo = comment.created_date 
                ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })
                : 'just now';

              return (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  commentInitials={commentInitials}
                  timeAgo={timeAgo}
                />
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}