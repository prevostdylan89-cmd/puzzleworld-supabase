import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PuzzleDetailModal from '@/components/collection/PuzzleDetailModal';
import ReclassifyButton from '@/components/collection/ReclassifyButton';
import DiscoverySection from '@/components/collection/DiscoverySection';
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid,
  ChevronDown,
  X,
  Puzzle,
  Loader2,
  Plus,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const allPuzzles = [
  {
    title: 'Starry Night Dreams',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
    pieces: 2000,
    plays: 1523,
    rating: 4.9,
    creator: 'ArtMaster',
    category: 'Abstract'
  },
  {
    title: 'Ocean Sunset',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    pieces: 1000,
    plays: 892,
    rating: 4.7,
    creator: 'NatureVibes',
    category: 'Nature'
  },
  {
    title: 'Mountain Peak',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop',
    pieces: 500,
    plays: 2341,
    rating: 4.8,
    creator: 'Explorer',
    category: 'Nature'
  },
  {
    title: 'Cosmic Galaxy',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
    pieces: 1500,
    plays: 5672,
    rating: 4.9,
    creator: 'SpaceExplorer',
    category: 'Space'
  },
  {
    title: 'Cherry Blossoms',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop',
    pieces: 750,
    plays: 4231,
    rating: 4.6,
    creator: 'JapanLover',
    category: 'Nature'
  },
  {
    title: 'City Lights',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop',
    pieces: 1000,
    plays: 3892,
    rating: 4.7,
    creator: 'UrbanArt',
    category: 'Urban'
  },
  {
    title: 'Aurora Borealis',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    pieces: 2000,
    plays: 3456,
    rating: 4.8,
    creator: 'NorthernLights',
    category: 'Nature'
  },
  {
    title: 'Ancient Temple',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=400&fit=crop',
    pieces: 1200,
    plays: 2134,
    rating: 4.7,
    creator: 'HistoryBuff',
    category: 'Architecture'
  },
  {
    title: 'Tropical Paradise',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=400&fit=crop',
    pieces: 800,
    plays: 1876,
    rating: 4.5,
    creator: 'BeachLover',
    category: 'Nature'
  },
  {
    title: 'Abstract Colors',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop',
    pieces: 1500,
    plays: 2987,
    rating: 4.8,
    creator: 'ModernArt',
    category: 'Abstract'
  },
  {
    title: 'Forest Trail',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    pieces: 600,
    plays: 3421,
    rating: 4.6,
    creator: 'NatureWalk',
    category: 'Nature'
  },
  {
    title: 'Vintage Map',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    pieces: 2500,
    plays: 1543,
    rating: 4.9,
    creator: 'Cartographer',
    category: 'Vintage'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const DEFAULT_categoryFilters = [
  { id: 'all', label: 'All', icon: '🌍' },
];

export default function Collection() {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilters, setCategoryFilters] = useState(DEFAULT_categoryFilters);

  // Multi-select state (lifted here so bar is fixed to page)
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Load categories from DB
  useEffect(() => {
    const loadCategories = async () => {
      try {
        let data;
        if (isGuest) {
          const res = await base44.functions.invoke('publicData', { type: 'categories' });
          data = res.data.data || [];
        } else {
          data = await base44.entities.PuzzleCategory.list('order', 100);
        }
        if (data.length > 0) {
          const sorted = data.sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategoryFilters([
            { id: 'all', label: t('all'), icon: '🌍' },
            ...sorted.map(c => ({ id: c.name, label: c.name, icon: c.icon }))
          ]);
        }
      } catch {}
    };
    loadCategories();
  }, [isGuest]);


  const [minPieces, setMinPieces] = useState('');
  const [maxPieces, setMaxPieces] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [userOwnedMap, setUserOwnedMap] = useState({}); // { puzzle_reference: status }

  // Load user's owned puzzles to show badges on community catalog
  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user) return;
      base44.entities.UserPuzzle.filter({ created_by: user.email }).then(puzzles => {
        const map = {};
        puzzles.forEach(p => {
          // Match by ASIN/reference (primary key)
          if (p.puzzle_reference) map[`ref:${p.puzzle_reference}`] = p.status;
          // Match by name as fallback
          if (p.puzzle_name) map[`name:${p.puzzle_name.toLowerCase().trim()}`] = p.status;
        });
        setUserOwnedMap(map);
      });
    }).catch(() => {});
  }, []);

  const addToMyCollection = useCallback(async (puzzles, status = 'inbox') => {
    try {
      const user = await base44.auth.me();
      if (!user) { toast.error(t('loginToAdd')); return; }
      let added = 0;
      const newMapEntries = {};
      for (const puzzle of puzzles) {
        const ref = puzzle.asin || puzzle.id;
        const existing = await base44.entities.UserPuzzle.filter({ created_by: user.email, puzzle_reference: ref });
        if (existing.length === 0) {
          await base44.entities.UserPuzzle.create({
            puzzle_name: puzzle.title,
            puzzle_brand: puzzle.brand || '',
            puzzle_pieces: puzzle.piece_count || 0,
            puzzle_reference: ref,
            image_url: puzzle.image_hd || '',
            status
          });
          added++;
          // Track for immediate local update
          newMapEntries[`ref:${ref}`] = status;
          if (puzzle.title) newMapEntries[`name:${puzzle.title.toLowerCase().trim()}`] = status;
        }
      }
      // Immediately update the badge map so UI reflects the change without waiting for reload
      if (Object.keys(newMapEntries).length > 0) {
        setUserOwnedMap(prev => ({ ...prev, ...newMapEntries }));
      }
      const statusLabels = { wishlist: 'wishlist', inbox: t('inBox'), done: t('completed2') };
      if (added > 0) toast.success(added > 1 ? t('addedToStatusPlural').replace('{count}', added).replace('{status}', statusLabels[status] || t('inBox')) : t('addedToStatus').replace('{count}', added).replace('{status}', statusLabels[status] || t('inBox')));
      else toast.info(t('alreadyInCollection'));
    } catch (e) {
      toast.error(t('addError'));
    }
  }, []);

  // Fetch puzzles from global catalog
  const { data: globalPuzzles = [], isLoading, refetch } = useQuery({
    queryKey: ['globalPuzzles', isGuest],
    queryFn: async () => {
      if (isGuest) {
        const res = await base44.functions.invoke('publicData', { type: 'puzzles' });
        return res.data.data || [];
      }
      const puzzles = await base44.entities.PuzzleCatalog.filter({ status: 'active' }, '-created_date', 500);
      return puzzles;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  useEffect(() => {
    const asin = localStorage.getItem('selectedPuzzleAsin');
    if (asin && globalPuzzles.length > 0) {
      localStorage.removeItem('selectedPuzzleAsin');
      const puzzle = globalPuzzles.find(p => p.asin === asin);
      if (puzzle) {
        setSelectedPuzzle(puzzle);
        setShowDetailModal(true);
      }
    }
  }, [globalPuzzles]);

  // Known brands from the catalog
  const KNOWN_BRANDS = ['Ravensburger', 'Clementoni', 'Jumbo', 'Trefl', 'Educa', 'Schmidt', 'Castorland', 'Heye', 'Cobble Hill', 'Buffalo Games', 'Ceaco', 'Epoch', 'MB', 'Nathan', 'Dino', 'Wrebbit', 'Helvetiq', 'AveJoys'];

  const brandOptions = React.useMemo(() => {
    const brandsInCatalog = new Set();
    let hasUnknown = false;
    globalPuzzles.forEach(p => {
      const b = p.brand?.trim();
      if (!b) {
        hasUnknown = true;
      } else {
        const known = KNOWN_BRANDS.find(kb => b.toLowerCase().includes(kb.toLowerCase()));
        if (known) brandsInCatalog.add(known);
        else brandsInCatalog.add(b);
      }
    });
    const sorted = [...brandsInCatalog].sort();
    if (hasUnknown) sorted.push('__unknown__');
    return sorted;
  }, [globalPuzzles]);

  const clearFilters = () => {
    setMinPieces('');
    setMaxPieces('');
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  // Filter puzzles
  const filteredPuzzles = globalPuzzles.filter(puzzle => {
    const matchesSearch = puzzle.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          puzzle.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinPieces = !minPieces || (puzzle.piece_count >= parseInt(minPieces));
    const matchesMaxPieces = !maxPieces || (puzzle.piece_count <= parseInt(maxPieces));
    const matchesCategory = selectedCategory === 'all' || puzzle.category_tag === selectedCategory;
    const puzzleBrand = puzzle.brand?.trim() || '';
    const matchesBrand = selectedBrand === 'all'
      || (selectedBrand === '__unknown__' && !puzzleBrand)
      || (selectedBrand !== '__unknown__' && puzzleBrand.toLowerCase().includes(selectedBrand.toLowerCase()));
    
    return matchesSearch && matchesMinPieces && matchesMaxPieces && matchesCategory && matchesBrand;
  });

  // Sort puzzles
  const sortedPuzzles = [...filteredPuzzles].sort((a, b) => {
    switch(sortBy) {
      case 'newest':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'popular':
        return (b.wishlistCount || 0) - (a.wishlistCount || 0);
      case 'pieces-asc':
        return (a.piece_count || 0) - (b.piece_count || 0);
      case 'pieces-desc':
        return (b.piece_count || 0) - (a.piece_count || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 lg:top-0 z-30 bg-[#000019]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-white">{t('communityCollection')}</h1>
              <p className="text-white/50 text-sm mt-1">
                {isLoading ? t('loading') : `${sortedPuzzles.length} ${t('communityPuzzlesCount').replace('{count}', '').trim()}`}
              </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPuzzles')}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 text-white hover:bg-white/5">
                    <SlidersHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-[#000019] border-white/[0.06]">
                  <SheetHeader>
                    <SheetTitle className="text-white">{t('filters')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Piece Count Min/Max */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">{t('pieceCount')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">{t('minimum')}</label>
                          <Input
                            type="number"
                            value={minPieces}
                            onChange={(e) => setMinPieces(e.target.value)}
                            placeholder="Ex: 500"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">{t('maximum')}</label>
                          <Input
                            type="number"
                            value={maxPieces}
                            onChange={(e) => setMaxPieces(e.target.value)}
                            placeholder="Ex: 2000"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <label className="text-sm text-white/70 mb-3 block">{t('brandFilter')}</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBrand('all')}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            selectedBrand === 'all'
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {t('allBrands')}
                        </button>
                        {brandOptions.map(brand => (
                          <button
                            key={brand}
                            onClick={() => setSelectedBrand(brand)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedBrand === brand
                                ? 'bg-orange-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {brand === '__unknown__' ? t('unknownBrand') : brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={clearFilters}
                      variant="outline" 
                      className="w-full border-white/20 text-white hover:bg-white/5"
                    >
                      {t('clearAllFilters')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode Toggle */}
              <div className="hidden lg:flex bg-white/5 border border-white/10 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'large' ? 'default' : 'ghost'}
                  size="icon"
                  className={viewMode === 'large' ? 'bg-orange-500 text-white' : 'text-white/50 hover:text-white'}
                  onClick={() => setViewMode('large')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filters — desktop: scroll horizontal / mobile: select dropdown */}
          <div className="mt-3 mb-1">
            {/* Mobile: dropdown select */}
            <div className="flex flex-col gap-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscovery(d => !d)}
                className={`w-full rounded-full border-orange-500/40 gap-1.5 ${showDiscovery ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' : 'text-orange-400 hover:bg-orange-500/10 border-orange-500/40'}`}
              >
                <span>✨</span>
                {showDiscovery ? t('globalCollection') : t('discoverMode')}
              </Button>
              {!showDiscovery && <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue>
                      {(() => {
                        const cat = categoryFilters.find(c => c.id === selectedCategory);
                        return cat ? `${cat.icon} ${cat.label}` : t('filters');
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  {categoryFilters.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white text-sm">
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue placeholder={t('sortBy')} />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a2e] border-white/10">
                  <SelectItem value="newest" className="text-white text-sm">{t('sortNewest')}</SelectItem>
                  <SelectItem value="popular" className="text-white text-sm">{t('sortPopular')}</SelectItem>
                  <SelectItem value="pieces-asc" className="text-white text-sm">{t('piecesAsc')}</SelectItem>
                  <SelectItem value="pieces-desc" className="text-white text-sm">{t('piecesDesc')}</SelectItem>
                </SelectContent>
              </Select>
              </div>}
            </div>

            {/* Desktop: scroll horizontal */}
            <div className="hidden lg:block relative mt-2">
              <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#000019] to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#000019] to-transparent pointer-events-none z-10"></div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categoryFilters.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort Options — desktop only */}
          <div className="hidden lg:flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Puzzle className="w-4 h-4" />
              <span>{t('sortBy2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ReclassifyButton onComplete={() => refetch()} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscovery(d => !d)}
                className={`rounded-full border-orange-500/40 gap-1.5 ${showDiscovery ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' : 'text-orange-400 hover:bg-orange-500/10'}`}
              >
                <span>✨</span>
                {showDiscovery ? t('globalCollection') : t('discoverMode')}
              </Button>
              {!showDiscovery && (
                <Button
                  variant={sortBy === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className={`rounded-full ${sortBy === 'newest' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                >{t('sortNewest')}</Button>
              )}
              {!showDiscovery && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue placeholder={t('more')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a2e] border-white/10">
                    <SelectItem value="pieces-asc" className="text-white text-sm">{t('piecesAscFull')}</SelectItem>
                    <SelectItem value="pieces-desc" className="text-white text-sm">{t('piecesDescFull')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Discovery Section */}
      {showDiscovery && !isLoading && globalPuzzles.length > 0 && (
        <DiscoverySection globalPuzzles={globalPuzzles} />
      )}

      {/* Puzzle Grid */}
      {!showDiscovery && <div className="px-4 lg:px-8 py-6">

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className={`grid gap-2.5 lg:gap-4 ${
                viewMode === 'large' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {sortedPuzzles.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">{t('noPuzzleFound')}</p>
                  <p className="text-white/30 text-sm mt-2">{t('beFirstToAdd')}</p>
                </div>
              ) : (
                sortedPuzzles.map((puzzle, index) => (
                  <CommunityPuzzleCard 
                    key={puzzle.id} 
                    puzzle={puzzle} 
                    index={index} 
                    variant={viewMode === 'large' ? 'large' : 'default'}
                    ownedStatus={
                      userOwnedMap[`ref:${puzzle.asin}`] ||
                      userOwnedMap[`ref:${puzzle.id}`] ||
                      userOwnedMap[`name:${puzzle.title?.toLowerCase().trim()}`] ||
                      null
                    }
                    onAddToCollection={(status) => addToMyCollection([puzzle], status)}
                    isMultiSelect={isMultiSelect}
                    isSelected={selectedIds.includes(puzzle.id)}
                    onToggleSelect={() => {
                      setSelectedIds(prev =>
                        prev.includes(puzzle.id)
                          ? prev.filter(id => id !== puzzle.id)
                          : [...prev, puzzle.id]
                      );
                    }}
                    onEnterMultiSelect={() => { setIsMultiSelect(true); setSelectedIds([puzzle.id]); }}
                    onClick={() => {
                      if (isMultiSelect) {
                        setSelectedIds(prev =>
                          prev.includes(puzzle.id)
                            ? prev.filter(id => id !== puzzle.id)
                            : [...prev, puzzle.id]
                        );
                      } else {
                        setSelectedPuzzle(puzzle);
                        setShowDetailModal(true);
                      }
                    }}
                  />
                ))
              )}
            </motion.div>
          )}

          {/* Load More */}
          <div className="flex justify-center mt-12">
            <Button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/5 rounded-full px-8"
            >
              {t('backToTop')}
              <ChevronDown className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
      </div>}

      <PuzzleDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        puzzle={selectedPuzzle}
      />

      {/* Floating multi-select bar */}
      {isMultiSelect && createPortal(
        <div className="fixed bottom-20 left-0 right-0 z-[9990] flex justify-center px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#0d0d35] border border-white/15 rounded-2xl shadow-2xl flex items-center gap-2 px-3 py-2"
          >
            <span className="text-white/60 text-xs font-medium flex-shrink-0">
              {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => {
                  const selected = sortedPuzzles.filter(p => selectedIds.includes(p.id));
                  addToMyCollection(selected, 'wishlist');
                  setIsMultiSelect(false); setSelectedIds([]);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-medium whitespace-nowrap"
              >
                <span>⭐</span> Wishlist
              </button>
              <button
                onClick={() => {
                  const selected = sortedPuzzles.filter(p => selectedIds.includes(p.id));
                  addToMyCollection(selected, 'inbox');
                  setIsMultiSelect(false); setSelectedIds([]);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium whitespace-nowrap"
              >
                <span>📦</span> {t('inBox')}
              </button>
              <button
                onClick={() => {
                  const selected = sortedPuzzles.filter(p => selectedIds.includes(p.id));
                  addToMyCollection(selected, 'done');
                  setIsMultiSelect(false); setSelectedIds([]);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium whitespace-nowrap"
              >
                <span>🏆</span> {t('completed2')}
              </button>
            </div>
            <button
              onClick={() => { setIsMultiSelect(false); setSelectedIds([]); }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}


        function CommunityPuzzleCard({ puzzle, index, variant, onClick, onAddToCollection, ownedStatus, isMultiSelect, isSelected, onToggleSelect, onEnterMultiSelect }) {
        const { t } = useLanguage();
        const [showContextMenu, setShowContextMenu] = useState(false);

        return (
        <>
        <motion.div
          variants={item}
          onClick={onClick}
          className={`relative bg-white/[0.03] border rounded-xl overflow-hidden transition-all group cursor-pointer ${
            isSelected
              ? 'border-orange-500 ring-2 ring-orange-500/40'
              : 'border-white/[0.06] hover:border-orange-500/30'
          }`}
        >
          {/* Multi-select checkbox overlay */}
          {isMultiSelect && (
            <div className={`absolute top-1.5 left-1.5 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-orange-500 border-orange-500' : 'bg-black/40 border-white/50'
            }`}>
              {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
          )}

          {/* 3 dots button — always visible on mobile, hover on desktop */}
          {!isMultiSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowContextMenu(true); }}
              className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-3.5 h-3.5 text-white" />
            </button>
          )}

          {/* Owned badge */}
          {ownedStatus && !isMultiSelect && (
            <div className="absolute top-2 left-2 z-10">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-sm border ${
                ownedStatus === 'done'
                  ? 'bg-green-500 border-green-400 text-white'
                  : ownedStatus === 'wishlist'
                  ? 'bg-yellow-500 border-yellow-400 text-white'
                  : 'bg-blue-500 border-blue-400 text-white'
              }`}>
                <span>{ownedStatus === 'done' ? '🏆' : ownedStatus === 'wishlist' ? '⭐' : '📦'}</span>
                <span className="hidden lg:inline">{ownedStatus === 'done' ? t('completed2') : ownedStatus === 'wishlist' ? 'Wishlist' : t('myBox')}</span>
              </div>
            </div>
          )}

          <div className={`${variant === 'large' ? 'aspect-[4/3]' : 'aspect-[3/4]'} overflow-hidden bg-white/5`}>
            {puzzle.image_hd ? (
              <img
                src={puzzle.image_hd}
                alt={puzzle.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Puzzle className="w-8 h-8 text-white/20" />
              </div>
            )}
          </div>
          <div className="p-2 lg:p-3">
            <h3 className="text-white text-[11px] lg:text-sm font-semibold line-clamp-2 mb-0.5 leading-tight">
              {puzzle.title}
            </h3>
            <div className="flex items-center justify-between text-[10px] lg:text-xs text-white/40">
              <span className="truncate max-w-[60%]">{puzzle.brand || ''}</span>
              <span>{puzzle.piece_count} pcs</span>
            </div>
            {puzzle.wishlistCount > 0 && (
              <div className="flex items-center gap-2 mt-1 text-[10px]">
                <span className="text-orange-400">⭐ {puzzle.wishlistCount}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Context menu (3 dots) — compact bottom sheet */}
        {showContextMenu && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowContextMenu(false)} />
            <div className="fixed bottom-20 left-0 right-0 z-[9999] flex justify-center px-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="w-full max-w-sm bg-[#0d0d35] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Compact puzzle header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/10">
                  {puzzle.image_hd && (
                    <img src={puzzle.image_hd} alt={puzzle.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <p className="text-white text-xs font-semibold line-clamp-1 flex-1">{puzzle.title}</p>
                  <button onClick={() => setShowContextMenu(false)} className="w-5 h-5 flex items-center justify-center text-white/40">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Action row */}
                <div className="flex items-center divide-x divide-white/10">
                  <button
                    onClick={() => { onAddToCollection('wishlist'); setShowContextMenu(false); }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg">⭐</span>
                    <span className="text-white/70 text-[10px]">Wishlist</span>
                  </button>
                  <button
                    onClick={() => { onAddToCollection('inbox'); setShowContextMenu(false); }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg">📦</span>
                    <span className="text-white/70 text-[10px]">{t('inBox')}</span>
                  </button>
                  <button
                    onClick={() => { onAddToCollection('done'); setShowContextMenu(false); }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg">🏆</span>
                    <span className="text-white/70 text-[10px]">{t('completed2')}</span>
                  </button>
                  <button
                    onClick={() => { setShowContextMenu(false); onEnterMultiSelect(); }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-lg">☑️</span>
                    <span className="text-white/70 text-[10px]">Sélection</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>,
          document.body
        )}
        </>
        );
        }