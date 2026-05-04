import React, { useState, useEffect } from 'react';
import WishlistPuzzleModal from '@/components/profile/WishlistPuzzleModal';
import { motion } from 'framer-motion';
import { X, Calendar, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CompletedPuzzlesModal({ open, onClose, user }) {
  const { t, language } = useLanguage();
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPieces, setTotalPieces] = useState(0);

  useEffect(() => {
    if (open && user) {
      loadCompletedPuzzles();
    }
  }, [open, user]);

  const loadCompletedPuzzles = async () => {
    try {
      const completed = await base44.entities.UserPuzzle.filter({
        created_by: user.email,
        status: 'done'
      });
      setPuzzles(completed);
      const total = completed.reduce((sum, p) => sum + (p.puzzle_pieces || 0), 0);
      setTotalPieces(total);
    } catch (error) {
      console.error('Error loading completed puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Package className="w-6 h-6 text-green-400" />
            {t('completedTab')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">{puzzles.length}</div>
                  <div className="text-white/60 text-sm">{t('completedTab')}</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-400">{totalPieces.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">{t('piecesAssembled')}</div>
                </div>
              </div>
            </div>

            {puzzles.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                {t('noCompletedPuzzle')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {puzzles.map((puzzle) => (
                  <div key={puzzle.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-all">
                    <div className="flex gap-3">
                      {puzzle.image_url ? (
                        <img src={puzzle.image_url} alt={puzzle.puzzle_name} className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                          <Package className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h4>
                        <p className="text-white/50 text-sm">{puzzle.puzzle_brand}</p>
                        <p className="text-orange-400 text-sm">{puzzle.puzzle_pieces} {t('puzzlePiecesCount')}</p>
                        {puzzle.end_date && (
                          <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(puzzle.end_date), 'dd MMM yyyy', { locale: language === 'fr' ? fr : enUS })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const ALL_ACHIEVEMENTS = [
  // Scan & Collection
  { type: 'premier_scan',           icon: '🔍', color: '#3B82F6', title: 'Premier Scan',           desc: 'Scanner ton tout premier puzzle', cat: 'Scan' },
  { type: 'main_a_la_pate',         icon: '🤝', color: '#10B981', title: 'Main à la pâte',         desc: 'Ajouter 10 puzzles à la communauté', cat: 'Scan' },
  { type: 'le_rituel',              icon: '🔄', color: '#8B5CF6', title: 'Le Rituel',              desc: 'Ajouter 50 puzzles à la communauté', cat: 'Scan' },
  { type: 'le_maniaque',            icon: '😤', color: '#F59E0B', title: 'Le Maniaque',            desc: 'Ajouter 100 puzzles à la communauté', cat: 'Scan' },
  { type: 'collectionneur_serieux', icon: '📦', color: '#EF4444', title: 'Collectionneur Sérieux', desc: 'Ajouter 200 puzzles à la communauté', cat: 'Scan' },
  { type: 'conservateur',           icon: '🏛️', color: '#6366F1', title: 'Conservateur',           desc: 'Ajouter 400 puzzles à la communauté', cat: 'Scan' },
  { type: 'lencyclopedie',          icon: '📚', color: '#14B8A6', title: "L'Encyclopédie",         desc: 'Atteindre 800 puzzles scannés', cat: 'Scan' },
  // Temps
  { type: 'regularite',    icon: '📅', color: '#F97316', title: 'Régularité',    desc: 'Se connecter 7 jours d\'affilée', cat: 'Temps' },
  { type: 'flash',         icon: '⚡', color: '#FACC15', title: 'Flash',         desc: 'Scanner 5 puzzles en moins de 10 minutes', cat: 'Temps' },
  { type: 'oiseau_de_nuit',icon: '🦉', color: '#818CF8', title: 'Oiseau de nuit',desc: 'Scanner un puzzle entre 2h et 4h du matin', cat: 'Temps' },
  // Taille
  { type: 'echauffement',      icon: '🏃', color: '#84CC16', title: 'Échauffement',       desc: 'Scanner un puzzle de 150 pièces', cat: 'Taille' },
  { type: 'le_standard',       icon: '🧩', color: '#06B6D4', title: 'Le Standard',        desc: 'Scanner un puzzle de 1 000 pièces', cat: 'Taille' },
  { type: 'patience_de_moine', icon: '🧘', color: '#7C3AED', title: 'Patience de Moine',  desc: 'Scanner un puzzle de 3 000 pièces', cat: 'Taille' },
  { type: 'le_titan_puzzle',   icon: '🗿', color: '#DC2626', title: 'Le Titan',           desc: 'Scanner un puzzle de 5 000 pièces', cat: 'Taille' },
  { type: 'lolympe',           icon: '🏔️', color: '#F59E0B', title: "L'Olympe",          desc: 'Scanner un puzzle de 10 000 pièces', cat: 'Taille' },
  { type: 'petit_mais_costaud',icon: '💪', color: '#10B981', title: 'Petit mais costaud', desc: 'Avoir 20 puzzles complétés de moins de 500 pièces', cat: 'Taille' },
  { type: 'poids_lourd',       icon: '🏋️', color: '#6366F1', title: 'Poids Lourd',       desc: 'Atteindre 50 000 pièces complétées cumulées', cat: 'Taille' },
  { type: 'demi_millionnaire', icon: '💎', color: '#EAB308', title: 'Demi-Millionnaire',  desc: 'Atteindre 500 000 pièces complétées cumulées', cat: 'Taille' },
  { type: 'geant_des_pieces',  icon: '🐘', color: '#8B5CF6', title: 'Géant des pièces',  desc: 'Avoir 5 puzzles de plus de 3 000 pièces complétés', cat: 'Taille' },
  // Catégories
  { type: 'ami_des_betes',  icon: '🐾', color: '#78716C', title: 'Ami des bêtes',  desc: '10 puzzles scannés dans la catégorie Animaux', cat: 'Catégories' },
  { type: 'main_verte',     icon: '🌿', color: '#22C55E', title: 'Main Verte',     desc: '10 puzzles scannés dans la catégorie Nature', cat: 'Catégories' },
  { type: 'citadin',        icon: '🏙️', color: '#64748B', title: 'Citadin',        desc: '10 puzzles scannés dans la catégorie Urbain', cat: 'Catégories' },
  { type: 'magie_disney',   icon: '🏰', color: '#EC4899', title: 'Magie Disney',   desc: '10 puzzles scannés dans la catégorie Disney', cat: 'Catégories' },
  { type: 'esthete',        icon: '🎨', color: '#F43F5E', title: 'Esthète',        desc: '10 puzzles scannés dans la catégorie Art', cat: 'Catégories' },
  { type: 'loeil_noir',     icon: '🖤', color: '#6B7280', title: "L'œil Noir",    desc: '5 puzzles scannés dans la catégorie Monochrome', cat: 'Catégories' },
  { type: 'nostalgique',    icon: '📼', color: '#D97706', title: 'Nostalgique',    desc: '10 puzzles scannés dans la catégorie Vintage', cat: 'Catégories' },
  { type: 'fan_de_pop',     icon: '🎭', color: '#C026D3', title: 'Fan de Pop',     desc: '10 puzzles scannés dans la catégorie Pop Culture', cat: 'Catégories' },
  { type: 'inclassable',    icon: '❓', color: '#0EA5E9', title: 'Inclassable',    desc: '10 puzzles scannés dans la catégorie Autres', cat: 'Catégories' },
  { type: 'touche_a_tout',  icon: '🌐', color: '#059669', title: 'Touche-à-tout',  desc: 'Avoir au moins 1 puzzle dans chaque catégorie', cat: 'Catégories' },
  { type: 'le_specialiste', icon: '🎯', color: '#7C3AED', title: 'Le Spécialiste', desc: '50 puzzles dans une seule et même catégorie', cat: 'Catégories' },
  // Communauté
  { type: 'premier_contact', icon: '💬', color: '#06B6D4', title: 'Premier Contact', desc: 'Laisser un commentaire sur un post', cat: 'Communauté' },
  { type: 'critique',        icon: '⭐', color: '#F59E0B', title: 'Critique',        desc: 'Liker 10 puzzles différents', cat: 'Communauté' },
  { type: 'curieux',         icon: '👀', color: '#8B5CF6', title: 'Curieux',         desc: 'Suivre 10 utilisateurs différents', cat: 'Communauté' },
  { type: 'coup_de_foudre',  icon: '❤️', color: '#EF4444', title: 'Coup de Foudre', desc: 'Ajouter 20 puzzles en wishlist', cat: 'Communauté' },
  { type: 'fan_de',          icon: '🌟', color: '#FACC15', title: 'Fan de...',       desc: 'Suivre ton premier utilisateur', cat: 'Communauté' },
  { type: 'populaire',       icon: '📣', color: '#F97316', title: 'Populaire',       desc: 'Être suivi par 5 utilisateurs', cat: 'Communauté' },
  { type: 'leader_dopinion', icon: '👑', color: '#EAB308', title: "Leader d'opinion",desc: 'Être suivi par 20 utilisateurs', cat: 'Communauté' },
  { type: 'bavard',          icon: '🗣️', color: '#10B981', title: 'Bavard',          desc: 'Poster 50 commentaires au total', cat: 'Communauté' },
  { type: 'juge_de_paix',    icon: '⚖️', color: '#6366F1', title: 'Juge de Paix',   desc: 'Liker 100 puzzles différents', cat: 'Communauté' },
  // Marques
  { type: 'ladepte_ravensburger', icon: '🔵', color: '#1D4ED8', title: "L'Adepte de Ravensburger", desc: '20 puzzles Ravensburger dans ta collection', cat: 'Marques' },
  { type: 'clementoni_fan',       icon: '🟡', color: '#CA8A04', title: 'Clementoni Fan',           desc: '20 puzzles Clementoni dans ta collection', cat: 'Marques' },
  { type: 'education_au_top',     icon: '🟠', color: '#EA580C', title: 'Education au Top',         desc: '20 puzzles Educa dans ta collection', cat: 'Marques' },
  { type: 'sans_frontieres',      icon: '🌍', color: '#059669', title: 'Sans frontières',          desc: 'Avoir des puzzles de 5 marques différentes', cat: 'Marques' },
  { type: 'lexclusif',            icon: '💫', color: '#7C3AED', title: "L'Exclusif",              desc: 'Être le seul sur le site à avoir scanné un modèle', cat: 'Marques' },
  { type: 'multi_marques',        icon: '🏪', color: '#0EA5E9', title: 'Multi-marques',            desc: '10 marques différentes dans ta collection', cat: 'Marques' },
  // Hauts Faits
  { type: 'le_mur_du_son',          icon: '🚀', color: '#F97316', title: 'Le Mur du Son',          desc: 'Atteindre le Niveau 5', cat: 'Hauts Faits' },
  { type: 'le_sommet',              icon: '🏔️', color: '#FACC15', title: 'Le Sommet',              desc: 'Atteindre le Niveau 10 (Le Grand Architecte)', cat: 'Hauts Faits' },
  { type: 'anciennete',             icon: '⏳', color: '#6B7280', title: 'Ancienneté',             desc: 'Être inscrit depuis plus de 6 mois', cat: 'Hauts Faits' },
  { type: 'le_pilier',              icon: '🏛️', color: '#DC2626', title: 'Le Pilier',              desc: 'Faire partie du Top 50 des contributeurs', cat: 'Hauts Faits' },
  { type: 'grand_maitre_du_puzzle', icon: '🎖️', color: '#EAB308', title: 'Grand Maître du Puzzle', desc: 'Débloquer 40 succès sur les 50', cat: 'Hauts Faits' },
];

const CATEGORIES_ORDER = ['Scan', 'Temps', 'Taille', 'Catégories', 'Communauté', 'Marques', 'Hauts Faits'];

export function AchievementsModal({ open, onClose, user }) {
  const [unlockedTypes, setUnlockedTypes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unlocked');
  const [activeCategory, setActiveCategory] = useState('Tous');

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      base44.entities.Achievement.filter({ created_by: user.email })
        .then(items => setUnlockedTypes(new Set(items.map(a => a.achievement_type))))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  const unlockedList = ALL_ACHIEVEMENTS.filter(a => unlockedTypes.has(a.type));
  const lockedList   = ALL_ACHIEVEMENTS.filter(a => !unlockedTypes.has(a.type));

  const filterByCat = (list) =>
    activeCategory === 'Tous' ? list : list.filter(a => a.cat === activeCategory);

  const displayList = filterByCat(activeTab === 'unlocked' ? unlockedList : lockedList);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#080820] border-white/10 text-white max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/10 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              🏆 Succès
            </DialogTitle>
          </DialogHeader>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/60 text-sm">{unlockedList.length} / {ALL_ACHIEVEMENTS.length} débloqués</span>
              <span className="text-orange-400 font-semibold text-sm">{Math.round((unlockedList.length / ALL_ACHIEVEMENTS.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all"
                style={{ width: `${(unlockedList.length / ALL_ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>
          </div>
          {/* Tabs débloqués / à débloquer */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab('unlocked')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'unlocked'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              ✅ Obtenus ({unlockedList.length})
            </button>
            <button
              onClick={() => setActiveTab('locked')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'locked'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              🔒 À débloquer ({lockedList.length})
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="px-5 py-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none border-b border-white/5">
          {['Tous', ...CATEGORIES_ORDER].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                activeCategory === cat
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievement list */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              {activeTab === 'unlocked' ? 'Aucun succès débloqué dans cette catégorie.' : 'Tous les succès de cette catégorie sont débloqués ! 🎉'}
            </div>
          ) : (
            <div className="space-y-2">
              {displayList.map(achievement => {
                const unlocked = unlockedTypes.has(achievement.type);
                return (
                  <div
                    key={achievement.type}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      unlocked
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/[0.02] opacity-70'
                    }`}
                  >
                    {/* Icon badge */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        backgroundColor: unlocked ? `${achievement.color}22` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${unlocked ? achievement.color + '55' : 'rgba(255,255,255,0.08)'}`
                      }}
                    >
                      <span className={unlocked ? '' : 'grayscale opacity-40'}>{achievement.icon}</span>
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{achievement.title}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: unlocked ? `${achievement.color}22` : 'rgba(255,255,255,0.06)',
                            color: unlocked ? achievement.color : 'rgba(255,255,255,0.3)'
                          }}
                        >
                          {achievement.cat}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 leading-snug">{achievement.desc}</p>
                    </div>
                    {/* Status */}
                    {unlocked ? (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-white/20 text-xs">🔒</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CollectionModal({ open, onClose, user }) {
  const { t } = useLanguage();
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      base44.entities.UserPuzzle.filter({ created_by: user.email }, '-created_date')
        .then(setPuzzles)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, user]);

  const statusLabel = { wishlist: '⭐ Wishlist', inbox: '📦 Chez moi', in_progress: '🧩 En cours', done: '✅ Terminé', cemetery: '🪦 Cimetière' };
  const statusColor = { wishlist: 'text-yellow-400', inbox: 'text-blue-400', in_progress: 'text-orange-400', done: 'text-green-400', cemetery: 'text-white/40' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            🧩 Ma Collection ({puzzles.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : puzzles.length === 0 ? (
          <div className="text-center py-8 text-white/50">Aucun puzzle dans votre collection.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {puzzles.map((puzzle) => (
              <div key={puzzle.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-orange-500/30 transition-all">
                <div className="flex gap-3">
                  {puzzle.image_url ? (
                    <img src={puzzle.image_url} alt={puzzle.puzzle_name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">{puzzle.puzzle_name}</h4>
                    {puzzle.puzzle_brand && <p className="text-white/50 text-xs">{puzzle.puzzle_brand}</p>}
                    <p className="text-orange-400 text-xs">{puzzle.puzzle_pieces} pcs</p>
                    <span className={`text-xs font-medium ${statusColor[puzzle.status] || 'text-white/40'}`}>
                      {statusLabel[puzzle.status] || puzzle.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WishlistModal({ open, onClose, user }) {
  const { t } = useLanguage();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (open && user) {
      loadWishlist();
    }
  }, [open, user]);

  const loadWishlist = async () => {
    try {
      const items = await base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'wishlist' });
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            {t('wishlist')} ({wishlist.length})
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {t('emptyWishlist')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((puzzle) => (
              <div
                key={puzzle.id}
                onClick={() => setSelectedItem(puzzle)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-pink-500/30 transition-all cursor-pointer hover:bg-white/10"
              >
                <div className="flex gap-3">
                  {puzzle.image_url ? (
                    <img src={puzzle.image_url} alt={puzzle.puzzle_name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h4>
                    <p className="text-white/50 text-sm">{puzzle.puzzle_brand}</p>
                    <p className="text-pink-400 text-sm">{puzzle.puzzle_pieces} {t('puzzlePiecesCount')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {selectedItem && (
      <WishlistPuzzleModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    )}
    </>
  );
}