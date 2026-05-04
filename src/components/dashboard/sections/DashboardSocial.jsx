import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Trash2, Eye, MessageSquare, Loader2, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardSocial() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState(null);
  const [likesPost, setLikesPost] = useState(null);
  const [likes, setLikes] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await base44.entities.Post.list('-created_date', 50);
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;

    try {
      await base44.entities.Post.delete(deletingPost.id);
      toast.success('Post supprimé');
      setDeletingPost(null);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewLikes = async (post) => {
    setLikesPost(post);
    setLoadingLikes(true);
    try {
      const postLikes = await base44.entities.Like.filter({ post_id: post.id });
      setLikes(postLikes);
    } catch (e) {
      toast.error('Erreur chargement des likes');
    } finally {
      setLoadingLikes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Social (Fil d'actualité)</h2>
        <p className="text-white/60">Modération des posts et commentaires</p>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Posts Récents</h3>

        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/70 text-sm font-medium">{post.author_name}</span>
                    <span className="text-white/40 text-xs">
                      {new Date(post.created_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-white text-sm mb-3 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <button
                      onClick={() => handleViewLikes(post)}
                      className="flex items-center gap-1 hover:text-orange-400 transition-colors"
                    >
                      <Heart className="w-3 h-3" />
                      {post.likes_count || 0} likes
                    </button>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments_count || 0} commentaires
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setDeletingPost(post)}
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Likes Modal */}
      {likesPost && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setLikesPost(null)}>
          <div className="bg-[#0a0a2e] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                Likes — {likesPost.author_name}
              </h3>
              <button onClick={() => setLikesPost(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/50 text-xs mb-4 line-clamp-2">{likesPost.content}</p>
            {loadingLikes ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-orange-400 animate-spin" /></div>
            ) : likes.length === 0 ? (
              <p className="text-white/40 text-center py-6">Aucun like</p>
            ) : (
              <div className="space-y-2">
                {likes.map((like) => (
                  <div key={like.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                    <Heart className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{like.user_id}</span>
                    <span className="text-white/30 text-xs ml-auto">{new Date(like.created_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPost} onOpenChange={() => setDeletingPost(null)}>
        <AlertDialogContent className="bg-[#0a0a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le post</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}