import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { CheckCircle2, XCircle, Loader2, Eye, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PuzzleEditModal from '@/components/dashboard/PuzzleEditModal';

export default function DashboardPendingPuzzles() {
  const [puzzles, setPuzzles] = useState([]);
  const [userPhotos, setUserPhotos] = useState({});
  const [userProfiles, setUserProfiles] = useState({}); // email -> { display_name }
  const [loading, setLoading] = useState(true);
  const [editingPuzzle, setEditingPuzzle] = useState(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      // 1. Fetch puzzles en attente
      const { data: pending, error } = await supabase
        .from('puzzle_catalog')
        .select('*')
        .eq('status', 'pending')
        .order('created_date', { ascending: false })
        .limit(200);

      if (error) throw error;
      setPuzzles(pending || []);

      // 2. Récupérer les profils des ajouteurs (emails uniques)
      const emails = [...new Set((pending || []).map(p => p.created_by).filter(Boolean))];
      if (emails.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('created_by, display_name, avatar, profile_photo')
          .in('created_by', emails);

        const profileMap = {};
        (profiles || []).forEach(p => { profileMap[p.created_by] = p; });
        setUserProfiles(profileMap);
      }

      // 3. Charger les photos utilisateur pour chaque puzzle
      const photoMap = {};
      await Promise.all((pending || []).map(async (p) => {
        const ref = p.ean || p.asin;
        if (!ref) return;
        const { data: userPuzzles } = await supabase
          .from('user_puzzles')
          .select('progress_photo')
          .eq('puzzle_reference', ref)
          .not('progress_photo', 'is', null)
          .limit(1);
        if (userPuzzles?.[0]?.progress_photo) {
          photoMap[p.id] = userPuzzles[0].progress_photo;
        }
      }));
      setUserPhotos(photoMap);

    } catch (error) {
      console.error(error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (puzzle) => {
    try {
      const { error } = await supabase
        .from('puzzle_catalog')
        .update({ status: 'active' })
        .eq('id', puzzle.id);
      if (error) throw error;
      toast.success('Puzzle validé et visible dans la collection !');
      loadPending();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async (puzzle) => {
    try {
      const { error } = await supabase
        .from('puzzle_catalog')
        .delete()
        .eq('id', puzzle.id);
      if (error) throw error;
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
        <p className="text-white/60">
          Ces puzzles ont été ajoutés par des utilisateurs et nécessitent votre validation avant d'apparaître dans la collection communautaire.
        </p>
      </div>

      {puzzles.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">Aucun puzzle en attente</p>
          <p className="text-white/50 text-sm mt-1">Tous les puzzles ont été traités.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {puzzles.map((puzzle) => {
            const profile = userProfiles[puzzle.created_by];
            const avatarUrl = profile?.profile_photo || profile?.avatar;

            return (
              <div
                key={puzzle.id}
                className="bg-white/[0.03] border border-orange-500/20 rounded-xl p-4 flex items-center gap-4"
              >
                {/* Images */}
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

                {/* Infos puzzle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">En attente</span>
                    {puzzle.ean && <span className="text-white/30 text-xs">EAN: {puzzle.ean}</span>}
                  </div>
                  <h4 className="text-white font-medium text-sm line-clamp-2">{puzzle.title || 'Sans titre'}</h4>
                  <p className="text-white/50 text-xs mt-1">
                    {puzzle.brand}{puzzle.piece_count ? ` • ${puzzle.piece_count} pièces` : ''}{puzzle.category_tag ? ` • ${puzzle.category_tag}` : ''}
                  </p>
                  {puzzle.amazon_price && (
                    <p className="text-green-400 text-xs mt-1">{puzzle.amazon_price}€ sur Amazon</p>
                  )}

                  {/* Ajouteur */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-orange-400" />
                      </div>
                    )}
                    <div className="flex flex-col leading-tight">
                      {profile?.display_name && (
                        <span className="text-white/80 text-xs font-medium">{profile.display_name}</span>
                      )}
                      <span className="text-white/40 text-[10px]">
                        {puzzle.created_by || 'Utilisateur inconnu'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
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
            );
          })}
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
