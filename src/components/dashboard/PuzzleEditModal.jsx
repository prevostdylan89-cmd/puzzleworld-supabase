import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileSelect } from '@/components/ui/mobile-select';
import { SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

function useDynamicCategories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    base44.entities.PuzzleCategory.list('order', 100).then(data => {
      setCats(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }).catch(() => {});
  }, []);
  return cats;
}

// puzzle=null means "create mode", puzzle=object means "edit mode"
export default function PuzzleEditModal({ open, onClose, puzzle, onUpdate }) {
  const isCreating = !puzzle;
  const dynamicCategories = useDynamicCategories();
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    piece_count: '',
    category_tag: '',
    price: '',
    asin: '',
    ean: '',
    image_hd: '',
    amazon_link: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (puzzle) {
      setFormData({
        title: puzzle.title || '',
        brand: puzzle.brand || '',
        piece_count: puzzle.piece_count || '',
        category_tag: puzzle.category_tag || '',
        price: puzzle.amazon_price || puzzle.price || '',
        asin: puzzle.asin || '',
        ean: puzzle.ean || '',
        image_hd: puzzle.image_hd || '',
        amazon_link: puzzle.amazon_link || ''
      });
    } else {
      setFormData({ title: '', brand: '', piece_count: '', category_tag: '', price: '', asin: '', ean: '', image_hd: '', amazon_link: '' });
    }
  }, [puzzle, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        title: formData.title,
        brand: formData.brand,
        piece_count: parseInt(formData.piece_count) || 0,
        category_tag: formData.category_tag,
        amazon_price: parseFloat(formData.price) || 0,
        asin: formData.asin,
        ean: formData.ean,
        amazon_link: formData.amazon_link || (formData.asin ? `https://www.amazon.fr/dp/${formData.asin}?tag=puzzleworld-21` : ''),
        image_hd: formData.image_hd,
        ...(isCreating ? { socialScore: 0, wishlistCount: 0, added_count: 0, total_likes: 0, total_dislikes: 0 } : {})
      };

      if (isCreating) {
        await base44.entities.PuzzleCatalog.create(data);
        toast.success('Puzzle ajouté à la collection !');
      } else {
        await base44.entities.PuzzleCatalog.update(puzzle.id, data);
        toast.success('Puzzle mis à jour');
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{isCreating ? 'Ajouter un puzzle' : 'Modifier le puzzle'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Titre</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Marque</label>
              <Input
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Nombre de pièces</label>
              <Input
                type="number"
                value={formData.piece_count}
                onChange={(e) => setFormData({ ...formData, piece_count: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Catégorie</label>
            <select
              value={formData.category_tag}
              onChange={(e) => setFormData({ ...formData, category_tag: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="">Sélectionner une catégorie</option>
              {dynamicCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Prix (€)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">ASIN Amazon</label>
              <Input
                value={formData.asin}
                onChange={(e) => setFormData({ ...formData, asin: e.target.value.trim() })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Ex: B07B9S8X1Q"
              />
              {formData.asin && (
                <p className="text-white/40 text-xs mt-1 truncate">
                  → amazon.fr/dp/{formData.asin}
                </p>
              )}
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">EAN-13 (code-barres)</label>
              <Input
                value={formData.ean}
                onChange={(e) => setFormData({ ...formData, ean: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Ex: 4005556173297"
                maxLength={13}
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Lien Amazon affilié</label>
            <Input
              value={formData.amazon_link}
              onChange={(e) => setFormData({ ...formData, amazon_link: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="https://www.amazon.fr/dp/ASIN?tag=votre-tag-21"
            />
            {!formData.amazon_link && formData.asin && (
              <p className="text-white/40 text-xs mt-1">
                Laissez vide pour générer auto depuis l'ASIN : amazon.fr/dp/{formData.asin}?tag=puzzleworld-21
              </p>
            )}
            {formData.amazon_link && (
              <a href={formData.amazon_link} target="_blank" rel="noopener noreferrer" className="text-orange-400 text-xs mt-1 block hover:underline truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                ↗ {formData.amazon_link.length > 50 ? formData.amazon_link.slice(0, 50) + '...' : formData.amazon_link}
              </a>
            )}
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">URL Image HD</label>
            <Input
              value={formData.image_hd}
              onChange={(e) => setFormData({ ...formData, image_hd: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="https://..."
            />
          </div>

          {formData.image_hd && (
            <div>
              <label className="text-white/70 text-sm mb-2 block">Aperçu</label>
              <img
                src={formData.image_hd}
                alt="Preview"
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                isCreating ? 'Ajouter le puzzle' : 'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}