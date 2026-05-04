import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DeleteAccountSection() {
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const user = await base44.auth.me();
      const userEmail = user.email;

      toast.info(t('deletionInProgress'));

      // Anonymize posts (GDPR compliance - keep content but remove identity)
      const userPosts = await base44.entities.Post.filter({ created_by: userEmail });
      for (const post of userPosts) {
        await base44.entities.Post.update(post.id, {
          author_name: t('deletedUser'),
          content: t('deletedContent')
        });
      }

      // Delete comments
      const userComments = await base44.entities.Comment.filter({ created_by: userEmail });
      for (const comment of userComments) {
        await base44.entities.Comment.delete(comment.id);
      }

      // Delete user puzzles
      const userPuzzles = await base44.entities.UserPuzzle.filter({ created_by: userEmail });
      for (const puzzle of userPuzzles) {
        await base44.entities.UserPuzzle.delete(puzzle.id);
      }

      // Delete likes
      const userLikes = await base44.entities.Like.filter({ user_id: userEmail });
      for (const like of userLikes) {
        await base44.entities.Like.delete(like.id);
      }

      // Delete puzzle likes
      const userPuzzleLikes = await base44.entities.UserPuzzleLike.filter({ created_by: userEmail });
      for (const puzzleLike of userPuzzleLikes) {
        await base44.entities.UserPuzzleLike.delete(puzzleLike.id);
      }

      // Delete follows
      const userFollows = await base44.entities.Follow.filter({ follower_email: userEmail });
      const userFollowing = await base44.entities.Follow.filter({ following_email: userEmail });
      for (const follow of [...userFollows, ...userFollowing]) {
        await base44.entities.Follow.delete(follow.id);
      }

      // Delete DNA
      const userDNA = await base44.entities.UserDNA.filter({ created_by: userEmail });
      for (const dna of userDNA) {
        await base44.entities.UserDNA.delete(dna.id);
      }

      // Delete achievements
      const achievements = await base44.entities.Achievement.filter({ created_by: userEmail });
      for (const achievement of achievements) {
        await base44.entities.Achievement.delete(achievement.id);
      }

      // Delete user badges
      const userBadges = await base44.entities.UserBadge.filter({ created_by: userEmail });
      for (const badge of userBadges) {
        await base44.entities.UserBadge.delete(badge.id);
      }

      toast.success(t('accountDeleted'));
      
      // Logout and redirect
      setTimeout(() => {
        base44.auth.logout('/');
      }, 1000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('deletionError'));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">{t('dangerZone')}</h3>
            <p className="text-white/60 text-sm mb-4">
              {t('deleteAccountDesc')}
            </p>
            <Button
              onClick={() => setShowConfirm(true)}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t('deleteAccount')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-[#0a0a2e] border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('confirmDeletion')}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {t('irreversibleAction')} <span className="font-bold text-red-400">{t('irreversibleWord')}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-white/80 text-sm mb-3">{t('dataToBeDeleted')}</p>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• {t('profileData')}</li>
                <li>• {t('puzzleCollectionData')}</li>
                <li>• {t('postsCommentsData')}</li>
                <li>• {t('likesData')}</li>
                <li>• {t('statsData')}</li>
                <li>• {t('subscriptionsData')}</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/5"
                disabled={isDeleting}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('deleting')}
                  </>
                ) : (
                  t('confirmDelete')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}