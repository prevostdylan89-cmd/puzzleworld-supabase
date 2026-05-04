import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { name: 'Nature', icon: '🌳', order: 1 },
  { name: 'Urbain', icon: '🏙️', order: 2 },
  { name: 'Disney', icon: '🏰', order: 3 },
  { name: 'Art', icon: '🎨', order: 4 },
  { name: 'Animaux', icon: '🦁', order: 5 },
  { name: 'Monochrome', icon: '⚫', order: 6 },
  { name: 'Vintage', icon: '📜', order: 7 },
  { name: 'Autre', icon: '🧩', order: 8 },
];

export default function CategoryManagerModal({ open, onClose }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', icon: '' });
  const [newForm, setNewForm] = useState({ name: '', icon: '' });
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PuzzleCategory.list('order', 100);
      if (data.length === 0) {
        const created = await Promise.all(DEFAULT_CATEGORIES.map(c => base44.entities.PuzzleCategory.create(c)));
        setCategories(created.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else {
        setCategories(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async (id) => {
    if (!editForm.name.trim() || !editForm.icon.trim()) return toast.error('Nom et icône requis');
    setSaving(true);
    try {
      await base44.entities.PuzzleCategory.update(id, { name: editForm.name.trim(), icon: editForm.icon.trim() });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...editForm } : c));
      setEditingId(null);
      toast.success('Catégorie mise à jour');
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      await base44.entities.PuzzleCategory.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Catégorie supprimée');
    } catch (e) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const addCategory = async () => {
    if (!newForm.name.trim() || !newForm.icon.trim()) return toast.error('Nom et icône requis');
    setSaving(true);
    try {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order || 0), 0);
      const created = await base44.entities.PuzzleCategory.create({ name: newForm.name.trim(), icon: newForm.icon.trim(), order: maxOrder + 1 });
      setCategories(prev => [...prev, created]);
      setNewForm({ name: '', icon: '' });
      setShowNewForm(false);
      toast.success('Catégorie ajoutée !');
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">🏷️ Gérer les catégories</DialogTitle>
        </DialogHeader>
        <p className="text-white/50 text-sm mb-4">Ces catégories sont utilisées comme filtres dans la Collection communautaire et pour classer les puzzles.</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-orange-400 animate-spin" /></div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  {editingId === cat.id ? (
                    <>
                      <Input value={editForm.icon} onChange={e => setEditForm(p => ({ ...p, icon: e.target.value }))} className="bg-white/10 border-white/10 text-white w-16 text-center text-xl" maxLength={2} />
                      <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="bg-white/10 border-white/10 text-white flex-1" onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)} autoFocus />
                      <Button onClick={() => saveEdit(cat.id)} disabled={saving} size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8 w-8 p-0">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </Button>
                      <Button onClick={() => setEditingId(null)} variant="ghost" size="sm" className="text-white/50 hover:text-white h-8 w-8 p-0">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl w-8 text-center">{cat.icon}</span>
                      <span className="text-white font-medium flex-1">{cat.name}</span>
                      <Button onClick={() => { setEditingId(cat.id); setEditForm({ name: cat.name, icon: cat.icon }); }} variant="ghost" size="sm" className="text-white/40 hover:text-white h-8 w-8 p-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => deleteCategory(cat.id, cat.name)} variant="ghost" size="sm" className="text-red-400/50 hover:text-red-400 h-8 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {showNewForm ? (
              <div className="bg-white/5 border border-orange-500/30 rounded-xl p-3 flex items-center gap-3">
                <Input value={newForm.icon} onChange={e => setNewForm(p => ({ ...p, icon: e.target.value }))} placeholder="🌟" className="bg-white/5 border-white/10 text-white w-16 text-center text-xl" maxLength={2} />
                <Input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom de la catégorie" className="bg-white/5 border-white/10 text-white flex-1" onKeyDown={e => e.key === 'Enter' && addCategory()} autoFocus />
                <Button onClick={addCategory} disabled={saving} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </Button>
                <Button onClick={() => { setShowNewForm(false); setNewForm({ name: '', icon: '' }); }} variant="ghost" size="sm" className="text-white/50 hover:text-white h-8 w-8 p-0">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowNewForm(true)} variant="outline" className="w-full border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une catégorie
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}