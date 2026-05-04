import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2, Eye, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PuzzleEditModal from '@/components/dashboard/PuzzleEditModal';

export default function DashboardPendingPuzzles() {
  const [puzzles, setPuzzles] = useState([]);
  const [userPhotos, setUserPhotos] = useState({}); // catalogId -> user progress_photo
  const [loading, setLoading] = useState(true);
  const [editingPuzzle, setEditingPuzzle] = useState(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const pending = await base44.entities.PuzzleCatalog.filter({ status: 'pending' }, '-created_date', 200);
      setPuzzles(pending);
      // Load user photos for each pending puzzle
      const photoMap = {};
      await Promise.all(pending.map(async (p) => {
        const userPuzzles = await base44.entities.UserPuzzle.filter({ puzzle_reference: p.ean || p.asin });
        const withPhoto = userPuzzles.find(up => up.progress_photo);
        if (withPhoto) photoMap[p.id] = withPhoto.progress_photo;
      }));
      setUserPhotos(photoMap);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (puzzle) => {
    try {
      await base44.entities.PuzzleCatalog.update(puzzle.id, { status: 'active' });
      toast.success('Puzzle validé et visible dans la collection !');
      loadPending();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (puzzle) => {
    try {
      await base44.entities.PuzzleCatalog.delete(puzzle.id);
      toast.success('Puzzle supprimé');
      loadPending();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Puzzles en attente de validation</h2>
        <p className="text-white/60">Ces puzzles ont été scannés par des utilisateurs mais nécessitent votre validation avant d'apparaître dans la collection communautaire.</p>
      </div>

      {puzzles.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">Aucun puzzle en attente</p>
          <p className="text-white/50 text-sm mt-1">Tous les puzzles ont été traités.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {puzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className="bg-white/[0.03] border border-orange-500/20 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex gap-2 flex-shrink-0">
                {puzzle.image_hd ? (
                  <img
                    src={puzzle.image_hd}
                    alt={puzzle.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">🧩</span>
                  </div>
                )}
                {userPhotos[puzzle.id] && (
                  <div className="relative">
                    <img
                      src={userPhotos[puzzle.id]}
                      alt="Photo utilisateur"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-orange-500/40"
                    />
                    <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5">
                      <Camera className="w-2.5 h-2.5 text-white" />
                    </div>
                    <p className="text-[9px] text-orange-400 text-center mt-0.5">Photo user</p>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">En attente</span>
                  {puzzle.ean && <span className="text-white/30 text-xs">EAN: {puzzle.ean}</span>}
                </div>
                <h4 className="text-white font-medium text-sm line-clamp-2">{puzzle.title || 'Sans titre'}</h4>
                <p className="text-white/50 text-xs mt-1">
                  {puzzle.brand} {puzzle.piece_count ? `• ${puzzle.piece_count} pièces` : ''} • {puzzle.category_tag}
                </p>
                {puzzle.amazon_price && (
                  <p className="text-green-400 text-xs mt-1">{puzzle.amazon_price}€ sur Amazon</p>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  onClick={() => setEditingPuzzle(puzzle)}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  onClick={() => handleApprove(puzzle)}
                  size="sm"
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Valider
                </Button>
                <Button
                  onClick={() => handleReject(puzzle)}
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejeter
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPuzzle && (
        <PuzzleEditModal
          open={!!editingPuzzle}
          onClose={() => setEditingPuzzle(null)}
          puzzle={editingPuzzle}
          onUpdate={loadPending}
        />
      )}
    </div>
  );
}