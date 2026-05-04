import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function FeaturedArticleSelector({ open, onClose, position, currentArticle, onUpdate }) {
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (open) {
      loadCategories();
      loadArticles();
    }
  }, [open]);

  useEffect(() => {
    if (open) loadArticles();
  }, [search, sortBy, filterCategory]);

  const loadCategories = async () => {
    try {
      const allArticles = await base44.entities.BlogArticle.filter({ is_published: true }, '-created_date', 500);
      const uniqueCats = [...new Set(allArticles.map(a => a.category).filter(Boolean))].sort();
      setCategories(uniqueCats.map(name => ({ id: name, name })));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    let data = await base44.entities.BlogArticle.filter({ is_published: true }, '-created_date', 100);
    
    // Filtre catégorie
    if (filterCategory !== 'all') {
      data = data.filter(a => a.category === filterCategory);
    }

    // Filtre recherche
    let filtered = data.filter(a =>
      a.title?.toLowerCase().includes(search.toLowerCase())
    );

    // Tri
    if (sortBy === 'category') {
      filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    }

    setArticles(filtered);
    setLoading(false);
  };

  const filtered = articles;

  const selectArticle = async (article) => {
    setSaving(true);
    try {
      if (currentArticle) {
        await base44.entities.FeaturedArticle.update(currentArticle.id, {
          article_id: article.id,
          article_title: article.title,
          article_image: article.cover_image || '',
          article_category: article.category || '',
          article_slug: article.slug || '',
        });
      } else {
        await base44.entities.FeaturedArticle.create({
          position,
          article_id: article.id,
          article_title: article.title,
          article_image: article.cover_image || '',
          article_category: article.category || '',
          article_slug: article.slug || '',
        });
      }
      toast.success('Article sélectionné');
      await onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erreur: ' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const removeArticle = async () => {
    if (!currentArticle) return;
    setSaving(true);
    await base44.entities.FeaturedArticle.delete(currentArticle.id);
    toast.success('Article retiré');
    await onUpdate();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un article — Position {position}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="pl-10 bg-white/5 border-white/20 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded px-3 py-2"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name || cat}>{cat.name || cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Trier par</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded px-3 py-2"
            >
              <option value="date">Plus récent</option>
              <option value="category">Catégorie (A-Z)</option>
            </select>
          </div>
        </div>

        {currentArticle && (
          <div className="mb-3 flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-orange-400 text-sm">Article actuel : {currentArticle.article_title}</span>
            <Button size="sm" variant="ghost" onClick={removeArticle} disabled={saving} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" /> Retirer
            </Button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-white/40">Aucun article publié trouvé</div>
          ) : (
            filtered.map(article => (
              <button
                key={article.id}
                onClick={() => selectArticle(article)}
                disabled={saving}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 rounded-lg transition-all text-left"
              >
                {article.cover_image ? (
                  <img src={article.cover_image} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm line-clamp-2">{article.title}</p>
                  {article.category && (
                    <span className="text-orange-400 text-xs">{article.category}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}