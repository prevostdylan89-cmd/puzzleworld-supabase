import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, ImageIcon, Link, BookOpen, Star, GripVertical, ArrowUp, ArrowDown, Tag, Search, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import BlockEditor, { createBlock } from '@/components/blog/BlockEditor';
import BlockRenderer from '@/components/blog/BlockRenderer';
import SeoPanel from '@/components/blog/SeoPanel';

const EMPTY_FORM = {
  title: '', subtitle: '', slug: '', content: '', blocks: [],
  cover_image: '', show_cover_in_article: true, category: '', tags: '', meta_description: '', meta_title: '',
  external_link: '', external_link_label: '',
  featured_puzzles: [],
  is_published: false, read_time: 5
};

function generateSlug(title) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

// ─── Article Form ──────────────────────────────────────────────────────────────
function ArticleForm({ editingId, form, setForm, onSave, onCancel, saving, uploading, handleImageUpload }) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    base44.entities.BlogCategory.list('order').then(setCategories).catch(() => {});
  }, []);

  const blocks = form.blocks || [];
  const setBlocks = (newBlocks) => setForm(f => ({ ...f, blocks: newBlocks }));

  if (showPreview) {
    return (
      <div className="text-white">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => setShowPreview(false)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4 mr-2" /> Fermer l'aperçu
          </Button>
          <span className="text-white/30 text-sm">Aperçu de l'article</span>
        </div>
        <div className="max-w-3xl mx-auto">
          {form.cover_image && (
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <img src={form.cover_image} alt={form.title} className="w-full h-full object-cover" />
            </div>
          )}
          {form.category && <span className="text-orange-400 text-sm font-semibold uppercase tracking-wide">{form.category}</span>}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 mb-3">{form.title || 'Titre de l\'article'}</h1>
          {form.subtitle && <p className="text-xl text-white/60 mb-8">{form.subtitle}</p>}
          <div className="mt-6">
            <BlockRenderer blocks={blocks} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{editingId ? "Modifier l'article" : 'Nouvel article'}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="border-white/20 text-white/70 hover:text-white gap-1.5">
            <Eye className="w-4 h-4" /> Aperçu
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {[['content', 'Contenu'], ['seo', 'SEO'], ['settings', 'Paramètres']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 mb-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Titre H1 *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))}
                  placeholder="Titre principal de l'article" className="bg-white/[0.05] border-white/20 text-white text-xl font-bold" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Introduction / sous-titre</label>
                <Textarea value={form.subtitle || ''} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Accroche ou introduction courte..." className="bg-white/[0.05] border-white/20 text-white text-base" rows={2} />
              </div>
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Contenu de l'article</label>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image principale
              </label>
              {form.cover_image && <img src={form.cover_image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />}
              <label className="cursor-pointer block">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="border-2 border-dashed border-white/20 rounded-lg p-3 text-center text-white/50 text-sm hover:border-orange-500/50 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Uploader une image'}
                </div>
              </label>
              <Input value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                placeholder="Ou coller une URL" className="bg-white/5 border-white/20 text-white mt-2 text-xs" />
              <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.show_cover_in_article !== false}
                  onChange={e => setForm(f => ({ ...f, show_cover_in_article: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs text-white/70">Afficher aussi dans l'article</span>
              </label>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <label className="text-sm font-semibold text-white">Catégorie & Tags</label>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Catégorie</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[#0a0a2e] border border-white/20 text-white rounded-md px-3 py-2 text-sm">
                  <option value="">— Choisir —</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Tags (virgule)</label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="puzzle, conseil, débutant" className="bg-white/5 border-white/20 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Temps de lecture (min)</label>
                <Input type="number" value={form.read_time} onChange={e => setForm(f => ({ ...f, read_time: Number(e.target.value) }))}
                  className="bg-white/5 border-white/20 text-white text-xs" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <label className="text-sm font-semibold text-white flex items-center gap-2"><Link className="w-4 h-4" /> Lien externe</label>
              <Input value={form.external_link} onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))}
                placeholder="https://..." className="bg-white/5 border-white/20 text-white text-xs" />
              <Input value={form.external_link_label} onChange={e => setForm(f => ({ ...f, external_link_label: e.target.value }))}
                placeholder="Libellé du lien" className="bg-white/5 border-white/20 text-white text-xs" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="max-w-2xl">
          <SeoPanel form={form} setForm={setForm} />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-md space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <label className="text-sm font-semibold text-white">Paramètres avancés</label>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Slug URL</label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="mon-article-seo" className="bg-white/5 border-white/20 text-white text-sm" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10 sticky bottom-0 bg-[#000019] pb-4">
        <Button onClick={() => onSave(false)} variant="outline" className="border-white/20 text-white hover:bg-white/10" disabled={saving}>
          Sauvegarder brouillon
        </Button>
        <Button onClick={() => onSave(true)} className="bg-orange-500 hover:bg-orange-600" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Publier l'article
        </Button>
      </div>
    </div>
  );
}

// ─── Category Manager ──────────────────────────────────────────────────────────
function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCats(); }, []);

  const loadCats = async () => {
    setLoading(true);
    const data = await base44.entities.BlogCategory.list('order');
    setCategories(data);
    setLoading(false);
  };

  const addCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.BlogCategory.create({ name: newName.trim(), order: categories.length, is_featured: false });
    setNewName('');
    await loadCats();
    setSaving(false);
    toast.success('Catégorie ajoutée');
  };

  const deleteCategory = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    await base44.entities.BlogCategory.delete(id);
    await loadCats();
    toast.success('Catégorie supprimée');
  };

  const toggleFeatured = async (cat) => {
    // Only one can be featured at a time
    for (const c of categories) {
      if (c.is_featured && c.id !== cat.id) {
        await base44.entities.BlogCategory.update(c.id, { is_featured: false });
      }
    }
    await base44.entities.BlogCategory.update(cat.id, { is_featured: !cat.is_featured });
    await loadCats();
    toast.success(cat.is_featured ? 'Retirée de la une' : 'Catégorie mise à la une');
  };

  const moveUp = async (i) => {
    if (i === 0) return;
    const updated = [...categories];
    [updated[i], updated[i - 1]] = [updated[i - 1], updated[i]];
    await Promise.all(updated.map((c, idx) => base44.entities.BlogCategory.update(c.id, { order: idx })));
    await loadCats();
  };

  const moveDown = async (i) => {
    if (i === categories.length - 1) return;
    const updated = [...categories];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    await Promise.all(updated.map((c, idx) => base44.entities.BlogCategory.update(c.id, { order: idx })));
    await loadCats();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>;

  return (
    <div className="text-white space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Catégories du blog</h3>
        <p className="text-white/50 text-sm">Gérez les catégories, leur ordre d'affichage et la catégorie "à la une".</p>
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nouvelle catégorie..."
          className="bg-white/5 border-white/20 text-white" onKeyDown={e => e.key === 'Enter' && addCategory()} />
        <Button onClick={addCategory} disabled={saving || !newName.trim()} className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap">
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Tag className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Aucune catégorie. Ajoutez-en une !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <div key={cat.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              cat.is_featured ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10'
            }`}>
              <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
              <span className="font-medium flex-1">{cat.name}</span>
              {cat.is_featured && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs flex-shrink-0">
                  ⭐ À la une
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => moveUp(i)} disabled={i === 0} className="text-white/40 hover:text-white p-1 h-7 w-7">
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => moveDown(i)} disabled={i === categories.length - 1} className="text-white/40 hover:text-white p-1 h-7 w-7">
                  <ArrowDown className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleFeatured(cat)}
                  className={`p-1 h-7 w-7 ${cat.is_featured ? 'text-orange-400' : 'text-white/40 hover:text-orange-400'}`}
                  title={cat.is_featured ? 'Retirer de la une' : 'Mettre à la une'}>
                  <Star className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)} className="text-red-400 hover:text-red-300 p-1 h-7 w-7">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Articles List ─────────────────────────────────────────────────────────────
function ArticlesList({ articles, loading, categories, onEdit, onTogglePublish, onDelete, onNew }) {
  const [filterCat, setFilterCat] = useState('all');

  const filtered = filterCat === 'all' ? articles : articles.filter(a => a.category === filterCat);

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Articles</h2>
          <p className="text-white/50 text-sm">{articles.length} article(s)</p>
        </div>
        <Button onClick={onNew} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" /> Nouvel article
        </Button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterCat === 'all' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            Tous ({articles.length})
          </button>
          {categories.map(cat => {
            const count = articles.filter(a => a.category === cat.name).length;
            return (
              <button key={cat.id} onClick={() => setFilterCat(cat.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${filterCat === cat.name ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                {cat.name} <span className="opacity-60">({count})</span>
                {cat.is_featured && <Star className="w-3 h-3 text-yellow-400" />}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-4">Aucun article. Créez votre premier article !</p>
          <Button onClick={onNew} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Créer un article
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 w-full max-w-full overflow-hidden min-w-0">
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => onTogglePublish(a)} title={a.is_published ? 'Dépublier' : 'Publier'}>
                  {a.is_published ? <EyeOff className="w-4 h-4 text-white/50" /> : <Eye className="w-4 h-4 text-green-400" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onEdit(a)}>
                  <Pencil className="w-4 h-4 text-white/50" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(a.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                <h3 className="font-semibold text-white truncate flex-1 min-w-0">{a.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.category && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{a.category}</Badge>}
                  <Badge className={a.is_published ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20'}>
                    {a.is_published ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardBlog() {
  const [tab, setTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [arts, cats] = await Promise.all([
      base44.entities.BlogArticle.list('-created_date'),
      base44.entities.BlogCategory.list('order'),
    ]);
    setArticles(arts);
    setCategories(cats);
    setLoading(false);
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
  const openEdit = (a) => { setForm({ ...EMPTY_FORM, ...a }); setEditingId(a.id); setShowForm(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_image: file_url }));
    setUploading(false);
  };

  const handleSave = async (isPublished) => {
    if (!form.title) { toast.error('Le titre est requis'); return; }
    setSaving(true);
    const data = { ...form, is_published: isPublished, slug: form.slug || generateSlug(form.title) };
    if (editingId) {
      await base44.entities.BlogArticle.update(editingId, data);
      toast.success('Article modifié');
    } else {
      await base44.entities.BlogArticle.create(data);
      toast.success('Article créé');
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const togglePublish = async (article) => {
    await base44.entities.BlogArticle.update(article.id, { is_published: !article.is_published });
    toast.success(article.is_published ? 'Article dépublié' : 'Article publié');
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    await base44.entities.BlogArticle.delete(id);
    toast.success('Article supprimé');
    load();
  };

  if (showForm) {
    return (
      <ArticleForm
        editingId={editingId} form={form} setForm={setForm}
        onSave={handleSave} onCancel={() => setShowForm(false)}
        saving={saving} uploading={uploading} handleImageUpload={handleImageUpload}
      />
    );
  }

  return (
    <div className="text-white">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('articles')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'articles' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
          Articles
        </button>
        <button onClick={() => setTab('categories')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'categories' ? 'bg-orange-500 text-white' : 'text-white/60 hover:text-white'}`}>
          Catégories
        </button>
      </div>

      {tab === 'articles' ? (
        <ArticlesList
          articles={articles} loading={loading} categories={categories}
          onEdit={openEdit} onTogglePublish={togglePublish} onDelete={handleDelete} onNew={openNew}
        />
      ) : (
        <CategoryManager key="cats" />
      )}
    </div>
  );
}