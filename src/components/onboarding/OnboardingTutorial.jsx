import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Scan, Grid3X3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageContext';

const slides = [
  {
    id: 'scan',
    title: 'Scannez vos puzzles',
    subtitle: 'Ajoutez vos puzzles en un clin d\'œil',
    content: (
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a1e] border border-white/10" style={{ aspectRatio: '9/16', maxHeight: 340 }}>
        {/* Simulated Home screen */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10" />

        {/* Simulated header */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-[#000019]/90 flex items-center px-3 gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden">
            <img src="https://media.base44.com/images/public/69637ed7a7bc12860b6763ca/4bbfd7a69_JUSTELAPIECE.png" className="w-full h-full object-contain" />
          </div>
          <span className="text-white text-[10px] font-bold">PuzzleWorld</span>
        </div>

        {/* Simulated bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#000019]/95 border-t border-white/10 flex items-center justify-around px-4">
          <div className="flex flex-col items-center gap-0.5">
            <Grid3X3 className="w-4 h-4 text-white/40" />
            <span className="text-[8px] text-white/40">Collection</span>
          </div>

          {/* Scan button - highlighted */}
          <div className="relative -mt-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40 ring-2 ring-orange-400 ring-offset-2 ring-offset-[#000019]">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-orange-400 whitespace-nowrap font-bold">Scan</span>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="w-4 h-4 rounded-full bg-white/20" />
            <span className="text-[8px] text-white/40">Profil</span>
          </div>
        </div>

        {/* Arrow + annotation */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          {/* Arrow pointing down */}
          <div className="flex flex-col items-center">
            <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl text-center leading-tight shadow-lg max-w-[160px]">
              Appuyez ici pour scanner le code-barres de votre puzzle !
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-orange-500 mt-0.5">
              <path d="M12 2 L12 18 M6 12 L12 18 L18 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        </div>
      </div>
    ),
    description: 'Utilisez le bouton Scan au centre de la barre de navigation pour scanner le code-barres de n\'importe quel puzzle. L\'application le reconnaît instantanément et l\'ajoute à votre collection !',
  },
  {
    id: 'collection',
    title: 'Explorez la Collection',
    subtitle: 'Des milliers de puzzles référencés',
    content: (
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a1e] border border-white/10" style={{ aspectRatio: '9/16', maxHeight: 340 }}>
        {/* Simulated Collection screen */}
        <div className="absolute inset-0 bg-[#000019]" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-[#000019]/90 border-b border-white/10 flex items-center px-3">
          <span className="text-white text-[10px] font-bold">Collection Communauté</span>
        </div>

        {/* Search bar */}
        <div className="absolute top-11 left-2 right-2 h-7 bg-white/5 rounded-lg border border-white/10 flex items-center px-2 gap-1">
          <div className="w-3 h-3 rounded-full border border-white/30" />
          <div className="h-2 w-24 bg-white/20 rounded" />
        </div>

        {/* Categories */}
        <div className="absolute top-20 left-2 right-2 flex gap-1.5">
          {['🌍 Tout', '🐾 Animaux', '🏙️ Urbain'].map((cat, i) => (
            <div key={i} className={`px-2 py-1 rounded-full text-[7px] font-medium ${i === 0 ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50'}`}>
              {cat}
            </div>
          ))}
        </div>

        {/* Grid of fake puzzle cards */}
        <div className="absolute top-28 left-2 right-2 grid grid-cols-3 gap-1.5">
          {[
            { color: 'from-blue-500/30 to-purple-500/30', emoji: '🌄' },
            { color: 'from-green-500/30 to-teal-500/30', emoji: '🌿' },
            { color: 'from-orange-500/30 to-red-500/30', emoji: '🦋' },
            { color: 'from-pink-500/30 to-rose-500/30', emoji: '🌸' },
            { color: 'from-yellow-500/30 to-amber-500/30', emoji: '🦁' },
            { color: 'from-indigo-500/30 to-blue-500/30', emoji: '🏔️' },
          ].map((card, i) => (
            <div key={i} className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${card.color} flex flex-col items-center justify-center gap-1`}>
              <span className="text-lg">{card.emoji}</span>
              <div className="h-1 w-8 bg-white/20 rounded" />
              <div className="h-1 w-5 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Annotation overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 rounded-xl p-2 text-white text-[9px] text-center font-medium leading-tight backdrop-blur-sm">
          📦 Collection alimentée par les scans des utilisateurs
        </div>
      </div>
    ),
    description: 'La collection est remplie par la communauté ! Chaque puzzle scanné enrichit la base de données. Filtrez par catégorie, marque, nombre de pièces... et ajoutez les puzzles qui vous intéressent à votre wishlist ou collection personnelle.',
  },
  {
    id: 'manage',
    title: 'Gérez votre collection',
    subtitle: 'Suivez l\'avancement de chaque puzzle',
    content: (
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a1e] border border-white/10" style={{ aspectRatio: '9/16', maxHeight: 340 }}>
        <div className="absolute inset-0 bg-[#000019]" />

        {/* Statuts */}
        <div className="absolute top-2 left-2 right-2">
          <p className="text-white/60 text-[9px] font-semibold mb-2">Mes puzzles</p>
          <div className="space-y-1.5">
            {[
              { emoji: '⭐', label: 'Wishlist', count: '12 puzzles', color: 'bg-yellow-500/20 border-yellow-500/30' },
              { emoji: '📦', label: 'Dans ma boite', count: '5 puzzles', color: 'bg-blue-500/20 border-blue-500/30' },
              { emoji: '🔄', label: 'En cours', count: '2 puzzles', color: 'bg-purple-500/20 border-purple-500/30' },
              { emoji: '🏆', label: 'Terminés', count: '28 puzzles', color: 'bg-green-500/20 border-green-500/30' },
              { emoji: '🪦', label: 'Cimetière', count: '3 puzzles', color: 'bg-gray-500/20 border-gray-500/30' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${s.color}`}>
                <span className="text-sm">{s.emoji}</span>
                <span className="text-white text-[9px] font-medium flex-1">{s.label}</span>
                <span className="text-white/40 text-[8px]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Annotation */}
        <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 rounded-xl p-2 text-white text-[9px] text-center font-medium leading-tight">
          🗂️ Organisez vos puzzles par statut !
        </div>
      </div>
    ),
    description: 'Organisez vos puzzles par statut : Wishlist, Dans ma boite, En cours, Terminés, ou Cimetière. Retrouvez toute votre collection dans votre profil personnel.',
  },
];

export default function OnboardingTutorial({ open, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage();

  if (!open) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentSlide(i => i + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide(i => i - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#0a0a2e] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex gap-1.5 mb-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'bg-orange-500 w-6' : i < currentSlide ? 'bg-orange-500/40 w-3' : 'bg-white/20 w-3'
                  }`}
                />
              ))}
            </div>
            <p className="text-orange-400 text-xs font-semibold">{slide.subtitle}</p>
            <h2 className="text-white text-xl font-bold">{slide.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - illustration */}
        <div className="px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {slide.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Description */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/60 text-sm leading-relaxed"
            >
              {slide.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 px-5 pb-6">
          {currentSlide > 0 ? (
            <Button
              onClick={handlePrev}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white/40 hover:text-white/60 text-sm"
            >
              Passer
            </Button>
          )}

          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
          >
            {isLast ? (
              <><Check className="w-4 h-4 mr-2" /> C'est parti !</>
            ) : (
              <>Suivant <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}