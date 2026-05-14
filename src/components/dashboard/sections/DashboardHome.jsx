import React, { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/supabaseClient';
import { Puzzle, Edit2, Loader2, Calendar, BookOpen, ShoppingBag, Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeaturedPuzzleSelector from '@/components/home/FeaturedPuzzleSelector';
import FeaturedEventSelector from '@/components/home/FeaturedEventSelector';
import FeaturedArticleSelector from '@/components/home/FeaturedArticleSelector';
import { toast } from 'sonner';

export default function DashboardHome() {
  const [featuredPuzzles, setFeaturedPuzzles] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  // Marketplace featured
  const [featuredMarket, setFeaturedMarket] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [marketSearch, setMarketSearch] = useState('');
  const [marketSaving, setMarketSaving] = useState(false);

  useEffect(() => {
    loadFeatured();
    loadFeaturedMarket();
  }, []);

  const loadFeatured = async () => {
    setLoading(true);
    try {
      const [{ data: puzzles }, { data: events }, { data: articles }] = await Promise.all([
        supabase.from('featured_puzzles').select('*').order('position', { ascending: true }).limit(10),
        supabase.from('featured_events').select('*').order('position', { ascending: true }).limit(3),
        supabase.from('featured_articles').select('*').order('position', { ascending: true }).limit(5),
      ]);
      setFeaturedPuzzles(puzzles || []);
      setFeaturedEvents(events || []);
      setFeaturedArticles(articles || []);
    } catch (error) {
      console.error('Error loading featured:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedMarket = async () => {
    try {
      const { data: featuredData } = await supabase
        .from('featured_marketplace')
        .select('*, marketplace_listings(id, title, photos, puzzle_image, transaction_type, price, created_by)')
        .order('position', { ascending: true }).limit(10);
      const { data: recentData } = await supabase
        .from('marketplace_listings')
        .select('id, title, photos, puzzle_image, transaction_type, price, created_by, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false }).limit(50);
      setFeaturedMarket((featuredData || []).map(f => f.marketplace_listings).filter(Boolean));
      setRecentListings(recentData || []);
    } catch (e) { console.error(e); }
  };

  const addToFeaturedMarket = async (listing) => {
    if (featuredMarket.find(f => f.id === listing.id)) { toast.error('Déjà en vedette'); return; }
    if (featuredMarket.length >= 10) { toast.error('Maximum 10 annonces'); return; }
    setMarketSaving(true);
    try {
      const { error } = await supabase.from('featured_marketplace').insert({ listing_id: listing.id, position: featuredMarket.length });
      if (error) throw error;
      setFeaturedMarket(prev => [...prev, listing]);
      toast.success('Annonce ajoutée en vedette');
    } catch { toast.error("Erreur lors de l'ajout"); } finally { setMarketSaving(false); }
  };

  const removeFromFeaturedMarket = async (listingId) => {
    setMarketSaving(true);
    try {
      await supabase.from('featured_marketplace').delete().eq('listing_id', listingId);
      setFeaturedMarket(prev => prev.filter(f => f.id !== listingId));
      toast.success('Annonce retirée');
    } catch { toast.error('Erreur'); } finally { setMarketSaving(false); }
  };

  const clearFeaturedMarket = async () => {
    if (!confirm("Vider la sélection ? Les dernières annonces s'afficheront automatiquement.")) return;
    setMarketSaving(true);
    try {
      await supabase.from('featured_marketplace').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setFeaturedMarket([]);
      toast.success('Sélection vidée — affichage automatique actif');
    } catch { toast.error('Erreur'); } finally { setMarketSaving(false); }
  };

  const openPuzzleSelector = (position) => {
    setSelectedPosition(position);
    setShowPuzzleSelector(true);
  };

  const openEventSelector = (position) => {
    setSelectedPosition(position);
    setShowEventSelector(true);
  };

  const openArticleSelector = (position) => {
    setSelectedPosition(position);
    setShowArticleSelector(true);
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
        <h2 className="text-3xl font-bold text-white mb-2">Accueil</h2>
        <p className="text-white/60">Gérez le contenu de la page d'accueil</p>
      </div>

      {/* Top 10 Puzzles Section */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Top 10 Puzzles en Vedette</h3>
        <p className="text-white/60 text-sm mb-6">
          Sélectionnez les 10 puzzles à afficher sur la page d'accueil (dans l'ordre)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((position) => {
            const puzzle = featuredPuzzles.find(p => p.position === position);
            
            return (
              <div
                key={position}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-orange-500/30 transition-all"
              >
                {puzzle ? (
                  <>
                    <div className="aspect-square bg-white/5">
                      <img
                        src={puzzle.puzzle_image}
                        alt={puzzle.puzzle_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                        {puzzle.puzzle_title}
                      </p>
                      <Button
                        onClick={() => openPuzzleSelector(position)}
                        size="sm"
                        className="w-full bg-white/10 hover:bg-white/20 text-white"
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Changer
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-square bg-white/5 flex flex-col items-center justify-center p-4">
                    <Puzzle className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white/50 text-sm mb-3 text-center">
                      Position {position} vide
                    </p>
                    <Button
                      onClick={() => openPuzzleSelector(position)}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sélectionner
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Articles Section */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Top 5 Articles Blog en Vedette</h3>
        <p className="text-white/60 text-sm mb-6">
          Sélectionnez les 5 articles à afficher sur la page d'accueil (dans l'ordre)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((position) => {
            const article = featuredArticles.find(a => a.position === position);
            return (
              <div
                key={position}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-orange-500/30 transition-all"
              >
                {article ? (
                  <>
                    <div className="aspect-video bg-white/5">
                      {article.article_image ? (
                        <img src={article.article_image} alt={article.article_title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-1">{article.article_title}</p>
                      {article.article_category && <p className="text-orange-400 text-xs mb-2">{article.article_category}</p>}
                      <Button onClick={() => openArticleSelector(position)} size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white">
                        <Edit2 className="w-3 h-3 mr-2" /> Changer
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-white/5 flex flex-col items-center justify-center p-4">
                    <BookOpen className="w-10 h-10 text-white/20 mb-3" />
                    <p className="text-white/50 text-sm mb-3 text-center">Position {position} vide</p>
                    <Button onClick={() => openArticleSelector(position)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                      Sélectionner
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 Events Section */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Top 3 Événements en Vedette</h3>
        <p className="text-white/60 text-sm mb-6">
          Sélectionnez les 3 événements à afficher sur la page d'accueil
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((position) => {
            const event = featuredEvents.find(e => e.position === position);
            
            return (
              <div
                key={position}
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden hover:border-orange-500/30 transition-all"
              >
                {event ? (
                  <>
                    <div className="aspect-video bg-white/5">
                      <img
                        src={event.event_image}
                        alt={event.event_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium line-clamp-2 mb-1">
                        {event.event_title}
                      </p>
                      <p className="text-white/50 text-xs mb-2">{event.event_date}</p>
                      <Button
                        onClick={() => openEventSelector(position)}
                        size="sm"
                        className="w-full bg-white/10 hover:bg-white/20 text-white"
                      >
                        <Edit2 className="w-3 h-3 mr-2" />
                        Changer
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-white/5 flex flex-col items-center justify-center p-4">
                    <Calendar className="w-12 h-12 text-white/20 mb-3" />
                    <p className="text-white/50 text-sm mb-3 text-center">
                      Position {position} vide
                    </p>
                    <Button
                      onClick={() => openEventSelector(position)}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sélectionner
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 Marketplace en Vedette */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" /> Top 10 Marketplace en Vedette
            </h3>
            <p className="text-white/40 text-sm mt-1">
              {featuredMarket.length === 0 ? '⚡ Auto : les 10 dernières annonces actives' : `${featuredMarket.length}/10 sélectionnées manuellement`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadFeaturedMarket} variant="ghost" size="sm" className="text-white/40 hover:text-white"><RefreshCw className="w-4 h-4" /></Button>
            {featuredMarket.length > 0 && (
              <Button onClick={clearFeaturedMarket} size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs">Vider (auto)</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Colonne gauche : sélection actuelle */}
          <div>
            <p className="text-white/50 text-xs font-semibold mb-2">✅ EN VEDETTE ({featuredMarket.length}/10)</p>
            {featuredMarket.length === 0 ? (
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-white/30 text-sm">
                Aucune sélection — affichage automatique actif
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {featuredMarket.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                      {l.photos?.[0] || l.puzzle_image ? <img src={l.photos?.[0] || l.puzzle_image} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5 text-white/20 m-auto mt-2.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{l.title}</p>
                      <p className="text-white/30 text-[10px]">{l.transaction_type} {l.transaction_type === 'vente' && l.price ? `• ${Number(l.price).toFixed(2)} €` : ''}</p>
                    </div>
                    <button onClick={() => removeFromFeaturedMarket(l.id)} disabled={marketSaving} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colonne droite : annonces disponibles */}
          <div>
            <p className="text-white/50 text-xs font-semibold mb-2">📋 DERNIÈRES ANNONCES ACTIVES</p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input placeholder="Rechercher..." value={marketSearch} onChange={e => setMarketSearch(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm pl-8 h-8" />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {recentListings.filter(l => !featuredMarket.find(f => f.id === l.id) && (!marketSearch || l.title?.toLowerCase().includes(marketSearch.toLowerCase()))).length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">Aucune annonce disponible</p>
              ) : (
                recentListings
                  .filter(l => !featuredMarket.find(f => f.id === l.id) && (!marketSearch || l.title?.toLowerCase().includes(marketSearch.toLowerCase())))
                  .map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        {l.photos?.[0] || l.puzzle_image ? <img src={l.photos?.[0] || l.puzzle_image} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5 text-white/20 m-auto mt-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{l.title}</p>
                        <p className="text-white/30 text-[10px]">{l.transaction_type} {l.transaction_type === 'vente' && l.price ? `• ${Number(l.price).toFixed(2)} €` : ''}</p>
                      </div>
                      <button onClick={() => addToFeaturedMarket(l)} disabled={marketSaving || featuredMarket.length >= 10} className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selectors */}
      {showPuzzleSelector && (
        <FeaturedPuzzleSelector
          open={showPuzzleSelector}
          onClose={() => {
            setShowPuzzleSelector(false);
            setSelectedPosition(null);
          }}
          position={selectedPosition}
          currentPuzzle={featuredPuzzles.find(p => p.position === selectedPosition)}
          onUpdate={loadFeatured}
        />
      )}

      {showArticleSelector && (
        <FeaturedArticleSelector
          open={showArticleSelector}
          onClose={() => { setShowArticleSelector(false); setSelectedPosition(null); }}
          position={selectedPosition}
          currentArticle={featuredArticles.find(a => a.position === selectedPosition)}
          onUpdate={loadFeatured}
        />
      )}

      {showEventSelector && (
        <FeaturedEventSelector
          open={showEventSelector}
          onClose={() => {
            setShowEventSelector(false);
            setSelectedPosition(null);
          }}
          position={selectedPosition}
          currentEvent={featuredEvents.find(e => e.position === selectedPosition)}
          onUpdate={loadFeatured}
        />
      )}
    </div>
  );
}