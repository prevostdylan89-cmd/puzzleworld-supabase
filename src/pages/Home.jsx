import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Sparkles, TrendingUp, Calendar, ChevronRight, Scan, Star, Puzzle, BookOpen, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import ScanPuzzleModal from '@/components/scan/ScanPuzzleModal';
import EventModal from '@/components/events/EventModal';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import ArticleModal from '@/components/home/ArticleModal';
import { base44 } from '@/api/base44Client';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const { t, language } = useLanguage();
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [topPuzzles, setTopPuzzles] = useState([]);
  const [events, setEvents] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsInMaintenance, setEventsInMaintenance] = useState(false);

  useEffect(() => {
    if (isGuest) {
      loadAllPublic();
    } else {
      Promise.all([loadTopPuzzles(), loadEvents(), loadPageSettings(), loadFeaturedArticles()]).finally(() => setLoading(false));
    }
  }, [isGuest]);

  const loadAllPublic = async () => {
    try {
      const res = await base44.functions.invoke('publicData', { type: 'home' });
      const d = res.data;
      setTopPuzzles(d.topPuzzles || []);
      setEvents(d.events || []);
      setFeaturedArticles(d.featuredArticles || []);
      setEventsInMaintenance(d.eventsInMaintenance || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPageSettings = async () => {
    try {
      const settings = await base44.entities.PageSettings.filter({ page_name: 'Events' });
      if (settings.length > 0 && settings[0].is_active === false) {
        setEventsInMaintenance(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTopPuzzles = async () => {
    try {
      const featured = await base44.entities.FeaturedPuzzle.list('position', 10);
      if (featured.length > 0) {
        const sorted = featured.sort((a, b) => a.position - b.position);
        const catalogIds = sorted.map(f => f.puzzle_catalog_id).filter(Boolean);
        // Fetch full catalog data for all featured puzzles
        const allCatalog = await base44.entities.PuzzleCatalog.list('-socialScore', 500);
        const catalogMap = {};
        allCatalog.forEach(p => { catalogMap[p.id] = p; });
        const ordered = sorted
          .map(f => catalogMap[f.puzzle_catalog_id])
          .filter(Boolean);
        // If some weren't found in catalog, fill with featured cache data
        const result = sorted.map(f => catalogMap[f.puzzle_catalog_id] || (f.puzzle_catalog_id ? {
          id: f.puzzle_catalog_id,
          title: f.puzzle_title,
          image_hd: f.puzzle_image,
          asin: f.puzzle_asin,
        } : null));
        setTopPuzzles(result.filter(Boolean).filter(p => p.id));
      } else {
        // Fallback: top 10 puzzles by socialScore
        const puzzles = await base44.entities.PuzzleCatalog.filter({ status: 'active' }, '-socialScore', 10);
        setTopPuzzles(puzzles);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      const data = await base44.entities.FeaturedArticle.list('position', 5);
      setFeaturedArticles(data.sort((a, b) => a.position - b.position));
    } catch (e) {}
  };

  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const all = await base44.entities.Event.list('event_date', 20);
      const upcoming = all.filter(e => e.event_date >= today).slice(0, 4);
      setEvents(upcoming.length >= 4 ? upcoming : all.slice(0, 4));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen">

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden flex flex-col">

        {/* Mobile Hero - compact banner */}
        <section className="relative overflow-hidden px-4 pt-4 pb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-purple-500/10" />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/20 text-orange-400 text-xs mb-3">
              <Sparkles className="w-3 h-3" />
              <span>{t('newPuzzlesDaily')}</span>
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-1">
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                {t('heroTitle')}
              </span>
            </h1>
            <p className="text-white/50 text-sm mb-4">{t('heroSubtitle')}</p>

            {/* CTA Buttons - side by side, compact */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setShowScanModal(true)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl px-4 py-3.5 text-left active:scale-95 transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Scan className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{t('scanPuzzle')}</p>
                  <p className="text-white/75 text-[11px]">{t('addPuzzle')}</p>
                </div>
              </motion.button>

              <Link to={createPageUrl('Collection')} className="flex">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2.5 bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3.5 text-left w-full active:scale-95 transition-transform"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{t('explore')}</p>
                    <p className="text-white/50 text-[11px]">{t('collection')}</p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Mobile Top 10 - horizontal scroll */}
        <section className="py-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{t('topPuzzles')}</h2>
                <p className="text-white/40 text-[10px]">{t('mostLiked')}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-3 px-4 overflow-x-auto pb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-32 h-40 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : topPuzzles.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">{t('noPuzzleAvailable')}</div>
          ) : (
            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {topPuzzles.map((puzzle, index) => (
                <motion.div
                  key={puzzle.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPuzzle(puzzle)}
                  className="flex-shrink-0 w-32 relative rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="aspect-[3/4]">
                    {puzzle.image_hd ? (
                      <img src={puzzle.image_hd} alt={puzzle.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Puzzle className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
                    {index + 1}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight mb-0.5">{puzzle.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[9px]">{puzzle.piece_count} pcs</span>
                      {puzzle.amazon_rating && (
                        <span className="flex items-center gap-0.5 text-yellow-400 text-[9px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-yellow-400" />{puzzle.amazon_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Mobile Top Articles Blog */}
          <section className="py-4">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{t('latestArticles')}</h2>
                  <p className="text-white/40 text-[10px]">{t('mustRead')}</p>
                </div>
              </div>
              <Link to={createPageUrl('Blog')}>
                <span className="text-blue-400 text-xs font-medium flex items-center gap-0.5">
                  {t('seeAll')} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
              {featuredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedArticle(article)}
                  className="flex-shrink-0 w-40 relative rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform border border-white/[0.06]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="aspect-[4/3]">
                    {article.article_image ? (
                      <img src={article.article_image} alt={article.article_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {article.article_category && (
                      <span className="text-blue-300 text-[9px] font-semibold uppercase tracking-wide">{article.article_category}</span>
                    )}
                    <p className="text-white text-[10px] font-semibold line-clamp-2 leading-tight mt-0.5">{article.article_title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
        </section>

        {/* Mobile Événements - vertical cards */}
        <section className="py-4 px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{t('eventsTitle')}</h2>
                <p className="text-white/40 text-[10px]">{t('upcoming')}</p>
              </div>
            </div>
            {!eventsInMaintenance && (
              <Link to={createPageUrl('Events')}>
                <span className="text-purple-400 text-xs font-medium flex items-center gap-0.5">
                  {t('seeAll')} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            )}
          </div>

          {eventsInMaintenance ? (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-3xl mb-2 block">🔧</span>
              <p className="text-white/50 text-sm">{t('eventsInMaintenance')}</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">{t('noEventAvailable')}</div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 3).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setSelectedEvent(event)}
                  className="flex gap-3 rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.07] active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="w-24 flex-shrink-0 relative">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center min-h-[80px]">
                        <Calendar className="w-8 h-8 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 py-3 pr-3 flex flex-col justify-center">
                    <p className="text-white font-semibold text-sm line-clamp-2 mb-1.5 leading-tight">{event.title}</p>
                    <div className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(event.event_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== DESKTOP LAYOUT (inchangé) ===== */}
      <div className="hidden lg:block">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative px-8 py-16 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>{t('newPuzzlesDailyLong')}</span>
              </div>
              <h1 className="text-6xl font-bold text-white leading-tight mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  {t('heroTitle')}
                </span>
              </h1>
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                {t('heroSubtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowScanModal(true)}
                className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">{t('addYourPuzzle')}</h3>
                    <p className="text-white/80 text-sm">{t('scanOrAddManually')}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>

              <Link to={createPageUrl('Collection')}>
                <button className="group w-full relative overflow-hidden rounded-[2rem] bg-white/5 border-2 border-white/10 hover:border-orange-500/30 hover:bg-white/10 p-8 text-left transition-all hover:scale-[1.02]">
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl mb-2">{t('exploreCollection')}</h3>
                      <p className="text-white/60 text-sm">{t('discoverThousands')}</p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Top 10 Puzzles */}
        <section className="px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('topPuzzles')}</h2>
                <p className="text-white/40 text-xs">{t('mostLikedCommunity')}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : topPuzzles.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('noPuzzleAvailable')}</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-5 gap-4"
            >
              {topPuzzles.map((puzzle, index) => (
                <motion.div
                  key={puzzle.id}
                  variants={item}
                  onClick={() => setSelectedPuzzle(puzzle)}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-[1.03] transition-transform duration-200"
                >
                  {puzzle.image_hd ? (
                    <img src={puzzle.image_hd} alt={puzzle.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Puzzle className="w-10 h-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">{puzzle.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[10px]">{puzzle.piece_count} pcs</span>
                      {puzzle.amazon_rating && (
                        <span className="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-yellow-400" />{puzzle.amazon_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Top Articles Blog */}
        <section className="px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('latestArticles')}</h2>
                  <p className="text-white/40 text-xs">{t('mustRead')}</p>
                </div>
              </div>
              <Link to={createPageUrl('Blog')}>
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1">
                  {t('seeAll')} <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            {featuredArticles.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('noArticleYet')}</p>
              </div>
            ) : (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-5 gap-4"
            >
              {featuredArticles.map((article) => (
                <motion.div
                  key={article.id}
                  variants={item}
                  onClick={() => setSelectedArticle(article)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 border border-white/[0.06] hover:border-blue-500/30"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    {article.article_image ? (
                      <img src={article.article_image} alt={article.article_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {article.article_category && (
                      <span className="text-blue-300 text-[10px] font-semibold uppercase tracking-wide">{article.article_category}</span>
                    )}
                    <p className="text-white font-bold text-sm line-clamp-2 mt-1">{article.article_title}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            )}
          </section>

        {/* Événements */}
        <section className="px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('upcomingEvents')}</h2>
                <p className="text-white/40 text-xs">{t('dontMissAnything')}</p>
              </div>
            </div>
            {!eventsInMaintenance && (
              <Link to={createPageUrl('Events')}>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1">
                  {t('seeAll')} <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>

          {eventsInMaintenance ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-4xl mb-4 block">🔧</span>
              <p className="text-white/60 font-medium">{t('eventsMaintenanceLong')}</p>
              <p className="text-white/40 text-sm mt-1">{t('comingSoon')}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('noEventAvailable')}</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-4 gap-4"
            >
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  variants={item}
                  onClick={() => setSelectedEvent(event)}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 border border-white/[0.06] hover:border-purple-500/30"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-sm line-clamp-2 mb-2">{event.title}</p>
                    <div className="inline-flex items-center gap-1.5 bg-purple-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.event_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* Bouton Revoir le tuto */}
      <div className="px-4 lg:px-8 py-6 flex justify-center">
        <button
          onClick={() => navigate('/Tutorial')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <PlayCircle className="w-4 h-4" />
          Revoir le tutoriel
        </button>
      </div>

      <ScanPuzzleModal open={showScanModal} onClose={() => setShowScanModal(false)} />

      <PuzzleDetailModal
        open={!!selectedPuzzle}
        onClose={() => setSelectedPuzzle(null)}
        puzzle={selectedPuzzle}
      />

      {selectedEvent && (
        <EventModal
          open={true}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <ArticleModal
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        article={selectedArticle}
        articleId={selectedArticle?.article_id}
      />
    </div>
  );
}