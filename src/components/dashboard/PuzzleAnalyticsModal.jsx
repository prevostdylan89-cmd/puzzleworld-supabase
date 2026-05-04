import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Calendar, TrendingUp, Heart, Users, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PuzzleAnalyticsModal({ open, onClose, puzzle }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && puzzle) {
      loadAnalytics();
    }
  }, [open, puzzle]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get all likes for this puzzle
      const likes = await base44.entities.UserPuzzleLike.filter({ 
        puzzle_asin: puzzle.asin 
      });

      // Get swipe interactions
      const swipes = await base44.entities.SwipeInteraction.filter({ 
        puzzle_asin: puzzle.asin 
      });

      // Calculate detailed stats
      const createdDate = new Date(puzzle.created_date);
      const today = new Date();
      const daysOnSite = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

      // Count unique interactions by type
      const uniqueLikes = new Set();
      const uniqueSuperlikes = new Set();
      const uniqueDislikes = new Set();
      
      swipes.forEach(s => {
        if (s.interaction_type === 'like') uniqueLikes.add(s.created_by);
        else if (s.interaction_type === 'superlike') uniqueSuperlikes.add(s.created_by);
        else if (s.interaction_type === 'dislike') uniqueDislikes.add(s.created_by);
      });

      const likeCount = uniqueLikes.size;
      const superlikeCount = uniqueSuperlikes.size;
      const dislikeCount = uniqueDislikes.size;
      
      const totalInteractions = swipes.length;
      const postLikes = likes.length;
      const totalAllInteractions = likeCount + superlikeCount + dislikeCount + postLikes;
      
      // Score de popularité: dislike=0pts, like=75pts, superlike=100pts
      let popularityScore = 0;
      if (totalAllInteractions > 0) {
        const scoreSum = (likeCount * 75) + (superlikeCount * 100) + (postLikes * 75) + (dislikeCount * 0);
        popularityScore = Math.round(scoreSum / totalAllInteractions);
      }
      const positiveInteractions = likeCount + superlikeCount;
      const engagementRate = totalInteractions > 0 
        ? ((positiveInteractions / totalInteractions) * 100).toFixed(1)
        : 0;

      // Likes over time (simplified - group by week)
      const likesOverTime = likes.reduce((acc, like) => {
        const week = format(new Date(like.created_date), 'yyyy-ww');
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});

      setAnalytics({
        daysOnSite,
        likesCount: likeCount,
        wishlistCount: puzzle.wishlistCount || 0,
        dislikesCount: dislikeCount,
        popularityScore: popularityScore,
        totalInteractions: totalInteractions,
        engagementRate,
        likesOverTime,
        avgLikesPerDay: daysOnSite > 0 ? (likeCount / daysOnSite).toFixed(2) : 0
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleChart = () => {
    if (!analytics || !analytics.totalSwipes) return null;

    const total = analytics.totalSwipes;
    const likesPercent = ((analytics.likesCount / total) * 100).toFixed(0);
    const superlikesPercent = ((analytics.superlikesCount / total) * 100).toFixed(0);
    const dislikesPercent = ((analytics.dislikesCount / total) * 100).toFixed(0);

    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">Likes</span>
            <span className="text-orange-400 font-bold">{likesPercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500"
              style={{ width: `${likesPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">Superlikes</span>
            <span className="text-pink-400 font-bold">{superlikesPercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-500"
              style={{ width: `${superlikesPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">Dislikes</span>
            <span className="text-red-400 font-bold">{dislikesPercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${dislikesPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Analytics - {puzzle?.title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Puzzle Info */}
            <div className="flex gap-4">
              <img
                src={puzzle.image_hd}
                alt={puzzle.title}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">{puzzle.title}</h3>
                <p className="text-white/60 text-sm mb-2">{puzzle.brand}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white/10 px-2 py-1 rounded">{puzzle.piece_count} pièces</span>
                  <span className="bg-white/10 px-2 py-1 rounded">{puzzle.category_tag}</span>
                  {puzzle.price && <span className="bg-white/10 px-2 py-1 rounded">{puzzle.price}€</span>}
                </div>
                {puzzle.amazon_link && (
                  <a 
                    href={puzzle.amazon_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-orange-400 text-sm mt-2 hover:text-orange-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir sur Amazon
                  </a>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span className="text-white/60 text-xs">Sur le site</span>
                </div>
                <div className="text-2xl font-bold text-white">{analytics?.daysOnSite}</div>
                <div className="text-white/40 text-xs">jours</div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-white/60 text-xs">Score de Popularité</span>
                </div>
                <div className={`text-3xl font-bold ${
                  (analytics?.popularityScore || 0) >= 80 ? 'text-green-400' :
                  (analytics?.popularityScore || 0) >= 50 ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {analytics?.popularityScore || 0}
                </div>
                <div className="text-white/40 text-xs">/ 100 points</div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-white/60 text-xs">Interactions</span>
                </div>
                <div className="text-2xl font-bold text-white">{analytics?.totalSwipes}</div>
                <div className="text-white/40 text-xs">swipes</div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-white/60 text-xs">Taux d'engagement</span>
                </div>
                <div className="text-2xl font-bold text-white">{analytics?.engagementRate}%</div>
                <div className="text-white/40 text-xs">positif</div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Calcul du Score de Popularité</h4>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{analytics?.likesCount}</div>
                  <div className="text-white/70 text-xs mt-1">❤️ Likes</div>
                  <div className="text-green-400 text-xs mt-1">75 pts chacun</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-2xl font-bold text-orange-400">{analytics?.wishlistCount}</div>
                  <div className="text-white/70 text-xs mt-1">📚 Wishlist</div>
                  <div className="text-orange-400 text-xs mt-1">100 pts chacun</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">{analytics?.dislikesCount}</div>
                  <div className="text-white/70 text-xs mt-1">👎 Dislikes</div>
                  <div className="text-red-400 text-xs mt-1">0 pts</div>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${
                (analytics?.popularityScore || 0) >= 80 ? 'bg-green-500/10 border-green-500/20' :
                (analytics?.popularityScore || 0) >= 50 ? 'bg-orange-500/10 border-orange-500/20' :
                'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/70 text-sm">Total votes: {analytics?.totalInteractions}</div>
                    <div className="text-white/70 text-sm mt-1">
                      Formule: (({analytics?.likesCount} × 75) + ({analytics?.wishlistCount} × 100)) / {analytics?.totalInteractions}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-xs mb-1">Score de Popularité</div>
                    <div className={`text-5xl font-bold ${
                      (analytics?.popularityScore || 0) >= 80 ? 'text-green-400' :
                      (analytics?.popularityScore || 0) >= 50 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {analytics?.popularityScore}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Distribution des Interactions</h4>
              {renderSimpleChart()}
            </div>

            {/* Additional Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Informations Détaillées</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Date d'ajout:</span>
                  <p className="text-white font-medium">
                    {format(new Date(puzzle.created_date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-white/60">ASIN:</span>
                  <p className="text-white font-medium">{puzzle.asin}</p>
                </div>
                <div>
                  <span className="text-white/60">Likes uniques:</span>
                  <p className="text-white font-medium">{analytics?.totalLikes}</p>
                </div>
                <div>
                  <span className="text-white/60">Score de popularité:</span>
                  <p className={`font-medium text-lg ${
                    (analytics?.popularityScore || 0) >= 80 ? 'text-green-400' :
                    (analytics?.popularityScore || 0) >= 50 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {analytics?.popularityScore}/100
                  </p>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={() => {
                const data = {
                  puzzle: puzzle.title,
                  brand: puzzle.brand,
                  analytics: analytics
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-${puzzle.asin}.json`;
                a.click();
              }}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Exporter les données (JSON)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}