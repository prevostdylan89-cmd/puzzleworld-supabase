import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

async function uploadToSupabase(file) {
  const ext = file.name.split('.').pop();
  const fileName = `puzzles/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}

export default function PersonalPuzzleAddModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', brand: '', pieces: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setForm({ name: '', brand: '', pieces: '' });
      setImagePreview('');
      setImageUrl('');
      setUploading(false);
      setSubmitting(false);
    }
  }, [open]);

  // Bridge Android
  useEffect(() => {
    const handleAndroidImage = (e) => {
      const { target, url } = e.detail || {};
      if (target === 'personal_puzzle' && url) {
        setImageUrl(url);
        setImagePreview(url);
        setUploading(false);
        toast.success('Image ajoutée !');
      }
    };
    window.addEventListener('android-image-selected', handleAndroidImage);
    window.receiveImageFromAndroid = (target, url) => {
      window.dispatchEvent(new CustomEvent('android-image-selected', { detail: { target, url } }));
    };
    return () => window.removeEventListener('android-image-selected', handleAndroidImage);
  }, []);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleImageClick = () => {
    if (window.Android?.openImagePicker) {
      setUploading(true);
      window.Android.openImagePicker('personal_puzzle');
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Sélectionnez une image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande (max 5 Mo)'); return; }
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploading(true);
    e.target.value = '';
    try {
      const url = await uploadToSupabase(file);
      setImageUrl(url);
      setImagePreview(url);
      toast.success('Image uploadée !');
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Le nom est obligatoire'); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Les puzzles perso vont dans user_puzzles avec catalog_puzzle_id = null
      // Ils ne passent PAS par puzzle_catalog → pas de validation admin
      const { error } = await supabase.from('user_puzzles').insert({
        puzzle_name: form.name,
        puzzle_brand: form.brand || '',
        puzzle_pieces: form.pieces ? parseInt(form.pieces) : null,
        image_url: imageUrl || null,
        status: 'personal',
        created_by: user.email,
        catalog_puzzle_id: null,
        puzzle_reference: null,
      });

      if (error) throw error;
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Photo */}
          <div>
            <label className="text-white/70 text-sm mb-2 block">Photo</label>
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imagePreview
                  ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon className="w-7 h-7 text-white/30" />
                }
              </div>
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={uploading}
                  className="w-full text-center cursor-pointer px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-purple-500/50 hover:text-purple-400 transition-colors disabled:opacity-50"
                >
                  {uploading ? '⏳ Upload...' : '📁 Choisir une photo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          {/* Nom */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Nom du puzzle <span className="text-purple-400">*</span></label>
            <Input placeholder="Ex: La Tour Eiffel" value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>

          {/* Marque + Pièces */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Marque</label>
              <Input placeholder="Ex: Ravensburger" value={form.brand} onChange={(e) => update('brand', e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1.5 block">Nb de pièces</label>
              <Input type="number" placeholder="Ex: 1000" value={form.pieces} onChange={(e) => update('pieces', e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleClose} variant="ghost" className="flex-1 text-white/50 hover:text-white hover:bg-white/5">Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name} className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-50">
              {submitting ? '⏳ Ajout...' : '✅ Ajouter'}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
