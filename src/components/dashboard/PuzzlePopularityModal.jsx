import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ThumbsUp, ThumbsDown, TrendingUp, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PuzzlePopularityModal({ open, onClose, puzzle }) {
  const [loading, setLoading] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  const [dislikeUsers, setDislikeUsers] = useState([]);

  useEffect(() => {
    if (open && puzzle?.id) {
      loadStats();
    }
  }, [open, puzzle]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Récupérer tous les UserPuzzle avec ce puzzle en status "done" et notes vide = liked
      const allUserPuzzles = await base44.entities.UserPuzzle.filter({
        catalog_puzzle_id: puzzle.id,
        status: 'done'
      });

      // Filtrer likes et dislikes
      const likes = allUserPuzzles.filter(up => !up.notes || up.notes !== 'Non aimé');
      const dislikes = allUserPuzzles.filter(up => up.notes === 'Non aimé');

      setLikeUsers(likes);
      setDislikeUsers(dislikes);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!puzzle) return null;

  const totalLikes = puzzle.total_likes || 0;
  const totalDislikes = puzzle.total_dislikes || 0;
  const netScore = totalLikes - totalDislikes;
  
  // Score sur 100 (on considère que 50 likes nets = 100 points)
  const scoreOn100 = Math.min(100, Math.max(0, 50 + netScore));

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
          <DialogTitle className="text-2xl text-white">Statistiques de Popularité</DialogTitle>
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
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </div>
              <div className="text-6xl font-bold text-white mb-2">{scoreOn100}/100</div>
              <div className="text-purple-400 text-lg font-medium mb-2">Score de Popularité</div>
              <p className="text-white/60 text-sm">
                Basé sur {totalLikes} likes et {totalDislikes} dislikes
              </p>
            </div>

            {/* Likes vs Dislikes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{totalLikes}</div>
                    <div className="text-green-400 text-sm font-medium">Likes (+1)</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ThumbsDown className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{totalDislikes}</div>
                    <div className="text-red-400 text-sm font-medium">Dislikes (-1)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Score */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Score Net</span>
                <span className={`text-2xl font-bold ${netScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {netScore >= 0 ? '+' : ''}{netScore}
                </span>
              </div>
            </div>

            {/* User Lists */}
            <div className="grid grid-cols-2 gap-4">
              {/* Likes List */}
              {likeUsers.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-400" />
                    Ont aimé ({likeUsers.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {likeUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                          {index + 1}
                        </div>
                        <span className="text-white/80 truncate">{user.created_by}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dislikes List */}
              {dislikeUsers.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-400" />
                    N'ont pas aimé ({dislikeUsers.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {dislikeUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center gap-2 text-xs">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                          {index + 1}
                        </div>
                        <span className="text-white/80 truncate">{user.created_by}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}