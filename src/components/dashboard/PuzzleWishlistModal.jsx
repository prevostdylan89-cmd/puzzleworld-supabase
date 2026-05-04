import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Bookmark, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PuzzleWishlistModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [wishlistUsers, setWishlistUsers] = useState([]);

  useEffect(() => {
    if (open && puzzle?.asin) {
      loadStats();
    }
  }, [open, puzzle]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les wishlists contenant ce puzzle
      const wishlists = await base44.entities.UserPuzzle.filter({ 
        puzzle_reference: puzzle.asin,
        status: 'wishlist'
      });
      
      setWishlistUsers(wishlists);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Statistiques Wishlist</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Puzzle Info */}
            <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <img
                src={puzzle.image_hd}
                alt={puzzle.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">{puzzle.title}</h3>
                <p className="text-white/60 text-sm">
                  {puzzle.brand} • {puzzle.piece_count} pièces
                </p>
                <p className="text-white/40 text-xs mt-2">ASIN: {puzzle.asin}</p>
              </div>
            </div>

            {/* Main Metric */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-orange-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">{puzzle.wishlistCount || 0}</div>
              <div className="text-orange-400 text-lg font-medium mb-2">Wishlists</div>
              <p className="text-white/60 text-sm">
                {puzzle.wishlistCount || 0} utilisateur{(puzzle.wishlistCount || 0) > 1 ? 's' : ''} {(puzzle.wishlistCount || 0) > 1 ? 'veulent' : 'veut'} ce puzzle
              </p>
            </div>

            {/* User List */}
            {wishlistUsers.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3">
                  Utilisateurs intéressés ({wishlistUsers.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {wishlistUsers.map((wishlist, index) => (
                    <div key={wishlist.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{wishlist.created_by}</p>
                          <p className="text-white/50 text-xs">
                            Ajouté le {new Date(wishlist.created_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      {wishlist.notes && (
                        <div className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400 max-w-xs truncate">
                          {wishlist.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wishlistUsers.length === 0 && (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">Aucun utilisateur n'a encore ajouté ce puzzle à sa wishlist</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}