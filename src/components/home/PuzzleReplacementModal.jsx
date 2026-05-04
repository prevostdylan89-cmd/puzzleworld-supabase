import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PuzzleReplacementModal({ open, onClose, position, currentPuzzle, onReplace }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: puzzles = [], isLoading } = useQuery({
    queryKey: ['allPuzzles'],
    queryFn: async () => {
      const data = await base44.entities.PuzzleCatalog.list('-created_date', 100);
      return data;
    },
    enabled: open
  });

  const filteredPuzzles = puzzles.filter(puzzle => 
    puzzle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    puzzle.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReplace = async () => {
    if (!selectedPuzzle) return;

    setSaving(true);
    try {
      // Check if featured puzzle entry exists for this position
      const existing = await base44.entities.FeaturedPuzzle.filter({ position: position + 1 });

      const positionNumber = position + 1;
      
      if (existing.length > 0) {
        // Update existing
        await base44.entities.FeaturedPuzzle.update(existing[0].id, {
          puzzle_catalog_id: selectedPuzzle.id,
          puzzle_asin: selectedPuzzle.asin || '',
          puzzle_title: selectedPuzzle.title,
          puzzle_image: selectedPuzzle.image_hd
        });
      } else {
        // Create new
        await base44.entities.FeaturedPuzzle.create({
          position: positionNumber,
          puzzle_catalog_id: selectedPuzzle.id,
          puzzle_asin: selectedPuzzle.asin || '',
          puzzle_title: selectedPuzzle.title,
          puzzle_image: selectedPuzzle.image_hd
        });
      }

      toast.success('Puzzle mis à jour avec succès !');
      onReplace();
      onClose();
    } catch (error) {
      console.error('Error updating featured puzzle:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[800px] lg:max-h-[80vh] bg-[#0a0a2e] rounded-2xl border border-white/10 overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Remplacer le puzzle</h2>
                <p className="text-sm text-white/50 mt-1">Position {position + 1} - {currentPuzzle?.title}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un puzzle par titre ou marque..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Puzzle List */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                </div>
              ) : filteredPuzzles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/50">Aucun puzzle trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPuzzles.map((puzzle) => (
                    <button
                      key={puzzle.id}
                      onClick={() => setSelectedPuzzle(puzzle)}
                      className={`relative bg-white/5 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedPuzzle?.id === puzzle.id
                          ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      <div className="aspect-square bg-white/5">
                        {puzzle.image_hd ? (
                          <img
                            src={puzzle.image_hd}
                            alt={puzzle.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">🧩</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">{puzzle.title}</p>
                        <p className="text-white/50 text-xs mt-1">{puzzle.piece_count} pièces</p>
                      </div>
                      {selectedPuzzle?.id === puzzle.id && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                Annuler
              </Button>
              <Button
                onClick={handleReplace}
                disabled={!selectedPuzzle || saving}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Confirmer le remplacement'
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}