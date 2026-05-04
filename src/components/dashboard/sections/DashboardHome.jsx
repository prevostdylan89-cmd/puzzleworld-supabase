import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Puzzle, Edit2, Loader2, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    setLoading(true);
    try {
      const puzzles = await base44.entities.FeaturedPuzzle.list('position');
      const events = await base44.entities.FeaturedEvent.list('position');
      const articles = await base44.entities.FeaturedArticle.list('position');
      setFeaturedPuzzles(puzzles);
      setFeaturedEvents(events);
      setFeaturedArticles(articles);
    } catch (error) {
      console.error('Error loading featured:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
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