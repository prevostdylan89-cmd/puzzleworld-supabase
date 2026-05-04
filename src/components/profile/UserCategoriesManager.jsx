import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const EMOJI_OPTIONS = ['🧩', '🎨', '🌿', '🏔️', '🦁', '🌊', '🏰', '⭐', '🎭', '🚀', '❤️', '🍀'];
const COLOR_OPTIONS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];

export default function UserCategoriesManager({ user, onCategoriesChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '🧩', color: '#f97316' });

  useEffect(() => {
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    try {
      const cats = await base44.entities.UserCategory.filter({ created_by: user.email });
      setCategories(cats);
      if (onCategoriesChange) onCategoriesChange(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await base44.entities.UserCategory.update(editingId, form);
        toast.success('Catégorie mise à jour');
      } else {
        await base44.entities.UserCategory.create(form);
        toast.success('Catégorie créée !');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', icon: '🧩', color: '#f97316' });
      loadCategories();
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon || '🧩', color: cat.color || '#f97316' });
    setShowForm(true);
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Supprimer la catégorie "${cat.name}" ? Les puzzles ne seront pas supprimés.`)) return;
    try {
      await base44.entities.UserCategory.delete(cat.id);
      // Remove category from puzzles that had it
      const puzzles = await base44.entities.UserPuzzle.filter({ created_by: user.email, user_category_id: cat.id });
      for (const p of puzzles) {
        await base44.entities.UserPuzzle.update(p.id, { user_category_id: null });
      }
      toast.success('Catégorie supprimée');
      loadCategories();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', icon: '🧩', color: '#f97316' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Tag className="w-4 h-4 text-orange-400" />
          Mes Catégories
        </h3>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" /> Nouvelle
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
          >
            <Input
              placeholder="Nom de la catégorie..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white"
              autoFocus
            />
            <div>
              <p className="text-white/50 text-xs mb-2">Icône</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === emoji ? 'bg-orange-500/30 ring-2 ring-orange-500' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs mb-2">Couleur</p>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                <Check className="w-3 h-3 mr-1" /> {editingId ? 'Modifier' : 'Créer'}
              </Button>
              <Button onClick={handleCancel} size="sm" variant="ghost" className="text-white/50 hover:text-white">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? null : categories.length === 0 && !showForm ? (
        <p className="text-white/30 text-sm text-center py-4">Aucune catégorie créée</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border text-xs font-medium"
              style={{ borderColor: `${cat.color}40`, backgroundColor: `${cat.color}15`, color: cat.color }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <button onClick={() => handleEdit(cat)} className="opacity-60 hover:opacity-100 p-0.5">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(cat)} className="opacity-60 hover:opacity-100 p-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}