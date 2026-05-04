import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Loader2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareToFeedModal({ open, onClose, puzzle, photoUrl }) {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (puzzle && open) {
      setContent(
        `🧩 J'ai terminé le puzzle "${puzzle.puzzle_name}"${puzzle.puzzle_pieces ? ` (${puzzle.puzzle_pieces} pièces)` : ''}${puzzle.puzzle_brand ? ` de ${puzzle.puzzle_brand}` : ''} ! 🏆`
      );
    }
  }, [puzzle, open]);

  const handlePost = async () => {
    if (!content.trim()) { toast.error('Le texte ne peut pas être vide'); return; }
    setPosting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Post.create({
        content: content.trim(),
        image_url: photoUrl || '',
        puzzle_name: puzzle.puzzle_name,
        puzzle_brand: puzzle.puzzle_brand || '',
        puzzle_pieces: puzzle.puzzle_pieces,
        puzzle_reference: puzzle.puzzle_reference || '',
        is_completion_post: true,
        likes_count: 0,
        comments_count: 0,
        author_name: user.full_name || user.email,
      });
      toast.success('🎉 Partagé sur le feed social !');
      onClose();
    } catch {
      toast.error('Erreur lors du partage');
    } finally {
      setPosting(false);
    }
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-400" />
            Partager sur le feed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aperçu post */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 p-3 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                Moi
              </div>
              <div>
                <p className="text-white text-sm font-medium">Vous</p>
                <p className="text-white/40 text-xs">À l'instant · Feed social</p>
              </div>
            </div>

            {/* Image preview */}
            {photoUrl ? (
              <img src={photoUrl} alt={puzzle.puzzle_name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-32 bg-white/[0.03] flex flex-col items-center justify-center gap-2 text-white/20">
                <ImageOff className="w-8 h-8" />
                <span className="text-xs">Pas de photo</span>
              </div>
            )}

            {/* Post info */}
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">✅ Puzzle terminé</span>
                {puzzle.puzzle_pieces && <span className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">🧩 {puzzle.puzzle_pieces} pièces</span>}
                {puzzle.puzzle_brand && <span className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">{puzzle.puzzle_brand}</span>}
              </div>
              <p className="text-white/70 text-xs italic">{puzzle.puzzle_name}</p>
            </div>
          </div>

          {/* Texte éditable */}
          <div>
            <label className="text-white/60 text-xs mb-1.5 block">Votre message</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-green-500/40 placeholder-white/20"
              placeholder="Écrivez quelque chose..."
            />
            <p className="text-white/30 text-xs text-right mt-1">{content.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-white/60 hover:text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {posting ? 'Publication...' : 'Publier'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}