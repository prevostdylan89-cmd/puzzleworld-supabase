import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock, Tag, ChevronRight, BookOpen, Plus, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BlockRenderer from '@/components/blog/BlockRenderer';

const CATEGORY_COLORS = {
  Conseils: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Actualités: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Tutoriels: 'bg-green-500/20 text-green-300 border-green-500/30',
  Puzzles: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Communauté: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  SEO: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ArticleCard({ article, onClick }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-orange-500/30 hover:bg-white/[0.07] transition-all group"
    >
      {article.cover_image && (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={article.cover_image} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-3 lg:p-5">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {article.category && (
            <Badge className={`text-[10px] lg:text-xs ${CATEGORY_COLORS[article.category] || 'bg-white/10 text-white/60'}`}>
              {article.category}
            </Badge>
          )}
          <span className="text-white/30 text-[10px] flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {article.read_time} min
          </span>
        </div>
        <h2 className="text-xs lg:text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug">
          {article.title}
        </h2>
        {article.subtitle && (
          <p className="text-white/60 text-[11px] lg:text-sm line-clamp-2 hidden lg:block">{article.subtitle}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-orange-400 text-[10px] lg:text-sm font-medium">
          Lire <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.article>
  );
}

function ArticleView({ article, onBack }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au blog
      </button>

      {article.cover_image && article.show_cover_in_article !== false && (
        <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {article.category && (
          <Badge className={`text-xs ${CATEGORY_COLORS[article.category] || 'bg-white/10 text-white/60'}`}>
            {article.category}
          </Badge>
        )}
        <span className="text-white/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time} min de lecture</span>
        <span className="text-white/40 text-xs">{formatDate(article.created_date)}</span>
      </div>

      <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">{article.title}</h1>
      {article.subtitle && <p className="text-xl text-white/60 mb-8 leading-relaxed">{article.subtitle}</p>}

      {/* Content — blocs ou HTML legacy */}
      {(() => {
        let blocks = article.blocks;
        if (typeof blocks === 'string') { try { blocks = JSON.parse(blocks); } catch { blocks = []; } }
        if (Array.isArray(blocks) && blocks.length > 0) {
          return <BlockRenderer blocks={blocks} />;
        }
        if (article.content) {
          return (
            <div
              className="prose prose-invert prose-orange max-w-none text-white/80 leading-relaxed"
              style={{ lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          );
        }
        return null;
      })()}

      {/* Tags */}
      {article.tags && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          <Tag className="w-4 h-4 text-white/30 mt-0.5" />
          {article.tags.split(',').map(tag => (
            <span key={tag.trim()} className="bg-white/5 text-white/50 text-sm px-3 py-1 rounded-full">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Lien externe */}
      {article.external_link && (
        <div className="mt-8 p-5 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <p className="text-white/70 text-sm mb-3">Ressource liée</p>
          <a href={article.external_link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-orange-400 font-semibold hover:text-orange-300 transition-colors">
            <ExternalLink className="w-4 h-4" />
            {article.external_link_label || article.external_link}
          </a>
        </div>
      )}

      {/* Fiche puzzle */}
      {article.puzzle_catalog_id && article.puzzle_title && (
        <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
          {article.puzzle_image && (
            <img src={article.puzzle_image} alt={article.puzzle_title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
          )}
          <div>
            <p className="text-white/40 text-xs mb-1 uppercase tracking-wide">Puzzle associé</p>
            <p className="text-white font-semibold">{article.puzzle_title}</p>
            <a href={`/Collection`} className="text-orange-400 text-sm hover:underline mt-1 inline-block">
              Voir dans le catalogue →
            </a>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [user, setUser] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const isGuest = localStorage.getItem('guest_mode') === 'true';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    load();

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('article');
    if (slug) {
      base44.entities.BlogArticle.filter({ slug, is_published: true }).then(results => {
        if (results[0]) {
          setSelectedArticle(results[0]);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      });
    }
  }, []);

  const load = async () => {
    try {
      let data, cats;
      if (isGuest) {
        const res = await base44.functions.invoke('publicData', { type: 'articles' });
        data = res.data.data || [];
        cats = res.data.categories || [];
      } else {
        [data, cats] = await Promise.all([
          base44.entities.BlogArticle.filter({ is_published: true }, '-created_date'),
          base44.entities.BlogCategory.list('order'),
        ]);
      }
      setArticles(data);
      setCategories(cats);
    } catch {}
    finally { setLoading(false); }
  };

  // Sort articles by category order, then date
  const featuredCat = categories.find(c => c.is_featured);
  const sortedArticles = [...articles].sort((a, b) => {
    const ai = categories.findIndex(c => c.name === a.category);
    const bi = categories.findIndex(c => c.name === b.category);
    if (ai !== bi) return ai - bi;
    return 0;
  });

  const filtered = filterCategory === 'all' ? sortedArticles : sortedArticles.filter(a => a.category === filterCategory);

  if (selectedArticle) {
    return (
      <div className="min-h-screen px-4 py-8 lg:px-8">
        <ArticleView article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 lg:mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs lg:text-sm px-3 py-1.5 lg:px-4 lg:py-2 rounded-full mb-3">
          <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> Blog PuzzleWorld
        </div>
        <h1 className="text-2xl lg:text-5xl font-bold text-white mb-2 lg:mb-4">
          Conseils, actus & <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">inspirations puzzle</span>
        </h1>
        <p className="text-white/50 text-sm lg:text-lg max-w-xl mx-auto hidden lg:block">
          Découvrez nos articles, guides et actualités pour les passionnés de puzzles.
        </p>

        {user?.role === 'admin' && (
          <a href="/Dashboard" className="inline-flex items-center gap-2 mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Gérer le blog (Admin)
          </a>
        )}
      </motion.div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 lg:gap-2 justify-center mb-5 lg:mb-8">
          <button onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-all ${
              filterCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}>
            Tous
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setFilterCategory(cat.name)}
              className={`px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-all flex items-center gap-1 ${
                filterCategory === cat.name ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}>
              {cat.name}
              {cat.is_featured && <span className="text-yellow-400 text-[10px]">⭐</span>}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Aucun article pour le moment. Revenez bientôt !</p>
        </div>
      ) : (
        <>
          {/* Featured first article */}
          {filtered[0] && (
            <motion.article
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedArticle(filtered[0]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mb-5 lg:mb-8 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/30 group transition-all"
            >
              <div className="lg:flex">
                {filtered[0].cover_image && (
                  <div className="lg:w-1/2 aspect-[16/9] lg:aspect-auto overflow-hidden">
                    <img src={filtered[0].cover_image} alt={filtered[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4 lg:p-8 lg:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 lg:mb-4 flex-wrap">
                    {filtered[0].category && (
                      <Badge className={`text-xs ${CATEGORY_COLORS[filtered[0].category] || ''}`}>{filtered[0].category}</Badge>
                    )}
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">À la une</Badge>
                  </div>
                  <h2 className="text-base lg:text-3xl font-bold text-white mb-1.5 lg:mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                    {filtered[0].title}
                  </h2>
                  {filtered[0].subtitle && <p className="text-white/60 text-sm mb-2 lg:mb-6 line-clamp-2 hidden sm:block">{filtered[0].subtitle}</p>}
                  <div className="flex items-center gap-3 text-white/40 text-xs lg:text-sm">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].read_time} min</span>
                    <span>{formatDate(filtered[0].created_date)}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          )}

          {/* Rest of articles */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-4">
            {filtered.slice(1).map((article, i) => (
              <ArticleCard key={article.id} article={article} onClick={() => {
                setSelectedArticle(article);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}