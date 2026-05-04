import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileSelect } from '@/components/ui/mobile-select';
import { SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = ['Nature', 'Urbain', 'Disney', 'Art', 'Animaux', 'Monochrome', 'Vintage', 'Autre'];

export default function ManualAddPuzzleModal({ open, onClose, onSubmit, prefillBarcode = '' }) {
  const [form, setForm] = useState({
    title: '',
    brand: '',
    pieces: '',
    category: '',
    price: '',
    barcode: prefillBarcode,
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('imageUrl', file_url);
      setImagePreview(file_url);
    } catch {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.pieces) {
      toast.error('Le titre et le nombre de pièces sont obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      // Créer dans le catalogue avec status "pending"
      const catalogEntry = await base44.entities.PuzzleCatalog.create({
        title: form.title,
        brand: form.brand || '',
        piece_count: parseInt(form.pieces),
        category_tag: form.category || 'Autre',
        amazon_price: form.price ? parseFloat(form.price) : undefined,
        ean: form.barcode || '',
        image_hd: form.imageUrl || '',
        status: 'pending',
      });

      const puzzleData = {
        catalog_id: catalogEntry.id,
        name: form.title,
        title: form.title,
        brand: form.brand,
        pieces: parseInt(form.pieces),
        piece_count: parseInt(form.pieces),
        image: form.imageUrl,
        image_hd: form.imageUrl,
        ean: form.barcode,
        sku: form.barcode,
        category_tag: form.category,
        amazon_price: form.price ? parseFloat(form.price) : null,
      };

      onSubmit(puzzleData);
    } catch {
      toast.error("Erreur lors de l'ajout du puzzle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ title: '', brand: '', pieces: '', category: '', price: '', barcode: prefillBarcode, imageUrl: '' });
    setImagePreview('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            ✏️ Ajouter un puzzle manuellement
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 mb-2">
          🕐 Ce puzzle sera soumis à validation avant d'apparaître dans le catalogue communautaire.
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Image */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Image</label>
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-white/30" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block">
                  <div className="w-full text-center cursor-pointer px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-colors">
                    {uploading ? '⏳ Upload...' : '📁 Choisir une image'}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <Input
                  placeholder="ou coller une URL..."
                  value={form.imageUrl}
                  onChange={(e) => { update('imageUrl', e.target.value); setImagePreview(e.target.value); }}
                  className="bg-white/5 border-white/10 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Titre <span className="text-orange-400">*</span></label>
            <Input
              placeholder="Ex: La Tour Eiffel au coucher de soleil"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Marque + Pièces */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Marque</label>
              <Input
                placeholder="Ex: Ravensburger"
                value={form.brand}
                onChange={(e) => update('brand', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Nb pièces <span className="text-orange-400">*</span></label>
              <Input
                type="number"
                placeholder="Ex: 1000"
                value={form.pieces}
                onChange={(e) => update('pieces', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Catégorie + Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Catégorie</label>
              <MobileSelect
                value={form.category}
                onValueChange={(v) => update('category', v)}
                placeholder="Choisir..."
                title="Catégorie"
                trigger={
                  <button type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm">
                    <span className={form.category ? 'text-white' : 'text-white/40'}>
                      {form.category || 'Choisir...'}
                    </span>
                    <span className="text-white/40">▾</span>
                  </button>
                }
              >
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </MobileSelect>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Prix (€)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 19.99"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Code-barres */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Code-barres (EAN)</label>
            <Input
              placeholder="Ex: 4005556173433"
              value={form.barcode}
              onChange={(e) => update('barcode', e.target.value.replace(/\D/g, '').slice(0, 13))}
              className="bg-white/5 border-white/10 text-white tracking-wider"
              maxLength={13}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="ghost"
              className="flex-1 text-white/50 hover:text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.title || !form.pieces}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50"
            >
              {submitting ? '⏳ Ajout...' : '✅ Valider'}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}