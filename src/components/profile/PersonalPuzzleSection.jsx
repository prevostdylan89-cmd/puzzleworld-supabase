import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Puzzle, Trash2, Loader2, ImagePlus, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AddSpeedRecordInline from '@/components/profile/AddSpeedRecordInline';

export default function PersonalPuzzleSection({ user }) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const data = await base44.entities.PersonalPuzzle.filter({ created_by: user.email });
      data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setPuzzles(data);
    } catch (error) {
      console.error('Error loading personal puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/40 text-sm">Puzzles privés — jamais publiés sur la collection communautaire</p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un puzzle
        </Button>
      </div>

      {puzzles.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
          <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Aucun puzzle personnel ajouté</p>
          <p className="text-white/30 text-sm mt-2">Ajoutez vos puzzles avec vos propres photos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {puzzles.map((puzzle, index) => (
            <PersonalPuzzleCard key={puzzle.id} puzzle={puzzle} index={index} onUpdate={loadPuzzles} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <AddPersonalPuzzleModal onClose={() => setShowForm(false)} onSaved={loadPuzzles} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonalPuzzleCard({ puzzle, index, onUpdate }) {
  const [deleting, setDeleting] = useState(false);
  const [showSpeedRecord, setShowSpeedRecord] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce puzzle personnel ?')) return;
    setDeleting(true);
    try {
      await base44.entities.PersonalPuzzle.delete(puzzle.id);
      toast.success('Puzzle supprimé');
      onUpdate();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const speedPuzzle = { id: puzzle.id, puzzle_name: puzzle.name, puzzle_brand: '', puzzle_pieces: puzzle.piece_count, image_url: puzzle.image_url };

  return (
    <>
    <AddSpeedRecordInline open={showSpeedRecord} onClose={() => setShowSpeedRecord(false)} puzzle={speedPuzzle} />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group relative"
    >
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => setShowSpeedRecord(true)}
          className="w-7 h-7 bg-yellow-500/80 hover:bg-yellow-500 rounded-full flex items-center justify-center transition-colors"
          title="Ajouter un record"
        >
          <Zap className="w-3.5 h-3.5 text-white" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      <div className="aspect-square overflow-hidden bg-white/5">
        {puzzle.image_url ? (
          <img
            src={puzzle.image_url}
            alt={puzzle.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Puzzle className="w-12 h-12 text-white/20" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">{puzzle.name}</h3>
        <span className="text-white/40 text-xs">{puzzle.piece_count} pcs</span>
      </div>
    </motion.div>
    </>
  );
}

function AddPersonalPuzzleModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [pieceCount, setPieceCount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Image uploadée !');
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Veuillez saisir un nom de puzzle');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.PersonalPuzzle.create({
        name: name.trim(),
        piece_count: pieceCount ? parseInt(pieceCount) : null,
        image_url: imageUrl || null,
      });
      toast.success('Puzzle personnel ajouté ! 🧩');
      onSaved();
      onClose();
    } catch {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Ajouter un puzzle personnel</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-500/50 hover:bg-white/10 transition-all overflow-hidden"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            ) : imageUrl ? (
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/30">
                <ImagePlus className="w-10 h-10" />
                <span className="text-sm">Cliquez pour ajouter une photo</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* Nom */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Nom du puzzle *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Panorama de Paris"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Pièces */}
          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Nombre de pièces</label>
            <input
              type="number"
              value={pieceCount}
              onChange={e => setPieceCount(e.target.value)}
              placeholder="Ex: 1000"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || uploading || !name.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-11"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {saving ? 'Enregistrement...' : 'Ajouter ce puzzle'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}