import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Loader2, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardTopPuzzles() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTopPuzzles(); }, []);

  const loadTopPuzzles = async () => {
    setLoading(true);
    try {
      // Get top puzzles by wishlist count directly from user_puzzles
      const { data: wishlistData } = await supabase
        .from('user_puzzles')
        .select('puzzle_name, puzzle_brand, puzzle_pieces, puzzle_reference, image')
        .eq('status', 'wishlist');

      if (!wishlistData) { setPuzzles([]); return; }

      // Count per puzzle_reference or puzzle_name
      const counts = {};
      for (const item of wishlistData) {
        const key = item.puzzle_reference || item.puzzle_name?.toLowerCase().trim();
        if (!key) continue;
        if (!counts[key]) counts[key] = { ...item, wishlistCount: 0 };
        counts[key].wishlistCount++;
      }

      const sorted = Object.values(counts)
        .sort((a, b) => b.wishlistCount - a.wishlistCount)
        .slice(0, 50);

      // Enrich with catalog data
      const enriched = await Promise.all(sorted.map(async (item) => {
        if (item.puzzle_reference) {
          const { data: catalog } = await supabase
            .from('puzzle_catalog')
            .select('title, brand, piece_count, image_hd')
            .eq('asin', item.puzzle_reference)
            .limit(1);
          if (catalog?.[0]) {
            return {
              key: item.puzzle_reference,
              name: catalog[0].title || item.puzzle_name,
              brand: catalog[0].brand || item.puzzle_brand,
              pieces: catalog[0].piece_count || item.puzzle_pieces,
              image: catalog[0].image_hd || item.image,
              reference: item.puzzle_reference,
              wishlistCount: item.wishlistCount,
            };
          }
        }
        return {
          key: item.puzzle_reference || item.puzzle_name,
          name: item.puzzle_name,
          brand: item.puzzle_brand,
          pieces: item.puzzle_pieces,
          image: item.image,
          reference: item.puzzle_reference,
          wishlistCount: item.wishlistCount,
        };
      }));

      setPuzzles(enriched);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Top Puzzles par Wishlist</h2>
          <p className="text-white/60">Puzzles les plus mis en wishlist — utile pour choisir le Top 10 de l'accueil</p>
        </div>
        <Button onClick={loadTopPuzzles} variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_120px_90px_90px] gap-3 px-4 py-3 border-b border-white/[0.06] text-white/40 text-xs font-medium uppercase tracking-wider">
          <div className="text-center">#</div>
          <div>Puzzle</div>
          <div>Marque</div>
          <div>Pièces</div>
          <div className="text-center">⭐ Wishlists</div>
        </div>
        {puzzles.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune donnée de wishlist disponible</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {puzzles.map((puzzle, index) => (
              <div key={puzzle.key} className={`grid grid-cols-[44px_1fr_120px_90px_90px] gap-3 px-4 py-3 items-center transition-colors hover:bg-white/[0.02] ${index < 3 ? 'bg-orange-500/[0.03]' : ''}`}>
                <div className="text-center">
                  {index === 0 ? <span className="text-xl">🥇</span>
                  : index === 1 ? <span className="text-xl">🥈</span>
                  : index === 2 ? <span className="text-xl">🥉</span>
                  : <span className="text-white/40 font-mono text-sm">{index + 1}</span>}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  {puzzle.image ? (
                    <img src={puzzle.image} alt={puzzle.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/5" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-lg">🧩</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1">{puzzle.name || '—'}</p>
                    {puzzle.reference && <p className="text-white/30 text-xs truncate">Réf: {puzzle.reference}</p>}
                  </div>
                </div>
                <div className="text-white/60 text-sm truncate">{puzzle.brand || '—'}</div>
                <div className="text-white/60 text-sm">{puzzle.pieces ? `${puzzle.pieces} pcs` : '—'}</div>
                <div className="text-center">
                  <span className={`font-bold text-sm ${index < 3 ? 'text-orange-400' : 'text-white/70'}`}>{puzzle.wishlistCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
