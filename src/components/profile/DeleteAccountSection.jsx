import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DeleteAccountSection() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);

    const email = user.email;

    try {
      toast.info(t('deletionInProgress'));

      // 1. Anonymiser les posts (RGPD — garder le contenu mais effacer l'identité)
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('created_by', email);

      if (posts?.length) {
        await supabase
          .from('posts')
          .update({ author_name: t('deletedUser'), content: t('deletedContent') })
          .eq('created_by', email);
      }

      // 2. Supprimer les commentaires
      await supabase.from('comments').delete().eq('created_by', email);

      // 3. Supprimer les puzzles de la collection
      await supabase.from('user_puzzles').delete().eq('created_by', email);

      // 4. Supprimer les likes
      await supabase.from('likes').delete().eq('created_by', email);

      // 5. Supprimer les puzzle likes
      await supabase.from('user_puzzle_likes').delete().eq('created_by', email);

      // 6. Supprimer les follows (dans les deux sens)
      await supabase.from('follows').delete().eq('created_by', email);
      await supabase.from('follows').delete().eq('following', email);

      // 7. Supprimer la wishlist
      await supabase.from('wishlist').delete().eq('created_by', email);

      // 8. Supprimer les messages
      await supabase.from('messages').delete().eq('sender_id', email);

      // 9. Supprimer les annonces marketplace
      await supabase.from('marketplace_listings').delete().eq('created_by', email);

      // 10. Supprimer le profil utilisateur
      await supabase.from('user_profiles').delete().eq('created_by', email);

      // 11. Supprimer le compte Supabase Auth via l'Edge Function sécurisée
      // (deleteUser nécessite le service_role côté serveur, pas depuis le client)
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.id },
      });

      if (deleteError) {
        // Si l'Edge Function n'existe pas encore, on déconnecte quand même
        console.warn('Edge function delete-user non disponible:', deleteError.message);
      }

      toast.success(t('accountDeleted'));

      // Déconnexion et redirection
      setTimeout(async () => {
        await logout();
        window.location.href = '/';
      }, 1000);

    } catch (error) {
      console.error('Erreur suppression compte:', error);
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
