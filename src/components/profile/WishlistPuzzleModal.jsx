import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WishlistPuzzleModal({ open, onClose, item }) {
  if (!item) return null;

  const name = item.puzzle_name || item.title || '—';
  const brand = item.puzzle_brand || item.brand || null;
  const pieces = item.puzzle_pieces || item.piece_count || null;
  const image = item.image_url || item.image_hd || null;
  const catalog = item.catalogData || {};
  const asin = item.asin || catalog.asin || item.puzzle_reference || item._raw?.puzzle_reference || null;
  const amazonLink = item.amazon_link || catalog.amazon_link || (asin ? `https://www.amazon.fr/dp/${asin}?tag=puzzleworld0f-21` : null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-md p-0 overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image */}
        <div className="w-full bg-white/5 flex items-center justify-center" style={{ minHeight: 220 }}>
          {image ? (
            <img src={image} alt={name} className="w-full max-h-72 object-contain" />
          ) : (
            <div className="text-5xl py-12">🧩</div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{name}</h2>
            {brand && <p className="text-orange-400 font-medium mt-1">{brand}</p>}
          </div>

          {pieces && (
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-lg">🧩</span>
              <span className="text-white font-semibold">{pieces} pièces</span>
            </div>
          )}

          {amazonLink && (
            <Button
              onClick={() => window.open(amazonLink, '_blank')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-11 font-semibold"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir sur Amazon
            </Button>
          )}

          <p className="text-white/30 text-xs text-center">
            En tant que Partenaire Amazon, nous réalisons un bénéfice sur les achats qualifiés
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}