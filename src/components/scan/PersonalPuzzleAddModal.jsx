import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PersonalPuzzleAddModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', brand: '', pieces: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setImagePreview(file_url);
    } catch {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Ajout UNIQUEMENT dans la collection personnelle (PersonalPuzzle), jamais dans PuzzleCatalog ni UserPuzzle
      await base44.entities.PersonalPuzzle.create({
        name: form.name || 'Puzzle personnalisé',
        piece_count: form.pieces ? parseInt(form.pieces) : null,
        image_url: imageUrl || null,
      });

      toast.success('✅ Puzzle ajouté à votre collection !');
      handleClose();
      if (onAdded) onAdded();
    } catch {
      toast.error("Erreur lors de l'ajout du puzzle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', brand: '', pieces: '' });
    setImagePreview('');
    setImageUrl('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            🧩 Ajouter un puzzle personnalisé
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-purple-300/80 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2 mb-2">
          Ce puzzle sera ajouté uniquement à votre collection personnelle. Il ne sera pas publié dans le catalogue communautaire.
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo</label>
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-white/30" />
                )}
              </div>
              <label className="flex-1 block cursor-pointer">
                <div className="w-full text-center px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-colors">
                  {uploading ? '⏳ Upload...' : '📁 Choisir une photo'}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Nom du puzzle</label>
            <Input
              placeholder="Ex: La Tour Eiffel"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
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
              <label className="text-white/70 text-sm mb-1.5 block">Nb de pièces</label>
              <Input
                type="number"
                placeholder="Ex: 1000"
                value={form.pieces}
                onChange={(e) => update('pieces', e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
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
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-50"
            >
              {submitting ? '⏳ Ajout...' : '✅ Ajouter'}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}