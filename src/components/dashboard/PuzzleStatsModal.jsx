import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PuzzleStatsModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [userCollections, setUserCollections] = useState([]);

  useEffect(() => {
    if (open && puzzle?.asin) {
      loadStats();
    }
  }, [open, puzzle]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les collections personnelles contenant ce puzzle
      const collections = await base44.entities.UserPuzzle.filter({ 
        puzzle_reference: puzzle.asin
      });
      
      setUserCollections(collections);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Nombre d'Ajouts</DialogTitle>
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
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">{puzzle.added_count || 0}</div>
              <div className="text-blue-400 text-lg font-medium mb-2">Ajouts Total</div>
              <p className="text-white/60 text-sm">
                Ce puzzle a été scanné et ajouté {puzzle.added_count || 0} fois dans les collections personnelles
              </p>
            </div>

            {/* User List */}
            {userCollections.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3">
                  Utilisateurs ayant ce puzzle ({userCollections.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userCollections.map((collection, index) => (
                    <div key={collection.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{collection.created_by}</p>
                          <p className="text-white/50 text-xs">
                            Ajouté le {new Date(collection.created_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                        {collection.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userCollections.length === 0 && (
              <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
                <p className="text-white/60">Aucun utilisateur n'a encore ajouté ce puzzle à sa collection</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}