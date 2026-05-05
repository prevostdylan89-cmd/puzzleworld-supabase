import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Eye, Loader2, RefreshCw } from 'lucide-react';
import { supabase, base44 } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardModeration() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => { loadContent(); }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [{ data: postsData }, { data: commentsData }] = await Promise.all([
        supabase.from('posts').select('*').order('created_date', { ascending: false }).limit(50),
        supabase.from('comments').select('*').order('created_date', { ascending: false }).limit(50),
      ]);
      setPosts(postsData || []);
      setComments(commentsData || []);
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!confirm('Supprimer ce post ?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Post supprimé');
  };

  const deleteComment = async (id) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    toast.success('Commentaire supprimé');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Modération</h2>
          <p className="text-white/50 text-sm">Gérez les posts et commentaires de la communauté.</p>
        </div>
        <Button onClick={loadContent} variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-orange-400" />
          <h3 className="text-white font-semibold">Règles surveillées</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/70">
          {['🚫 Discours haineux & discrimination', '📢 Spam & contenu promotionnel',
            '💬 Langage offensant', '👤 Harcèlement & attaques',
            '🧩 Contenu hors-sujet', '⚠️ Menaces & violence'].map(item => (
            <div key={item} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">{item}</div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'posts' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          Posts ({posts.length})
        </button>
        <button onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'comments' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          Commentaires ({comments.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
      ) : activeTab === 'posts' ? (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">{post.author_name || post.created_by}</span>
                  <span className="text-white/30 text-xs">{post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : ''}</span>
                </div>
                <p className="text-white/70 text-sm line-clamp-2">{post.content || '(pas de texte)'}</p>
                {post.image_url && <img src={post.image_url} alt="" className="mt-2 w-16 h-16 rounded object-cover" />}
              </div>
              <Button onClick={() => deletePost(post.id)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {posts.length === 0 && <p className="text-white/40 text-center py-8">Aucun post</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">{comment.author_name || comment.created_by}</span>
                  <span className="text-white/30 text-xs">{comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ''}</span>
                </div>
                <p className="text-white/70 text-sm">{comment.content}</p>
              </div>
              <Button onClick={() => deleteComment(comment.id)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {comments.length === 0 && <p className="text-white/40 text-center py-8">Aucun commentaire</p>}
        </div>
      )}
    </div>
  );
}
