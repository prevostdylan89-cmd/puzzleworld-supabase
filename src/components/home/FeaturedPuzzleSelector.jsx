import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Puzzle } from 'lucide-react';
import { toast } from 'sonner';

export default function FeaturedPuzzleSelector({ open, onClose, position, currentPuzzle, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('likes'); // 'likes', 'category', 'pieces'
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPieces, setFilterPieces] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [categories, setCategories] = useState([]);
  const [piecesOptions, setPiecesOptions] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allPuzzlesData, setAllPuzzlesData] = useState([]);

  useEffect(() => {
    if (open) {
      loadAllData();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      filterAndSortPuzzles();
    }
  }, [searchQuery, sortBy, filterCategory, filterPieces, filterBrand, allPuzzlesData]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const all = await base44.entities.PuzzleCatalog.list('-total_likes', 1000);
      setAllPuzzlesData(all);

      // Extract unique categories from category_tag
      const uniqueCats = [...new Set(all.map(p => p.category_tag).filter(Boolean))].sort();
      setCategories(uniqueCats.map(name => ({ id: name, name })));

      // Extract unique brands
      const uniqueBrands = [...new Set(all.map(p => p.brand).filter(Boolean))].sort();
      setBrands(uniqueBrands.map(name => ({ id: name, name })));

      // Extract unique piece counts and group them
      const pieceCounts = [...new Set(all.map(p => p.piece_count).filter(n => n))].sort((a, b) => a - b);
      const grouped = [];
      if (pieceCounts.length > 0) {
        grouped.push({ value: `0-500`, label: '0-500 pcs' });
        grouped.push({ value: `500-1000`, label: '500-1000 pcs' });
        grouped.push({ value: `1000-3000`, label: '1000-3000 pcs' });
        grouped.push({ value: `3000+`, label: '3000+ pcs' });
      }
      setPiecesOptions(grouped);
      
      filterAndSortPuzzles();
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPuzzles = () => {
    let filtered = allPuzzlesData;

    // Filtre par catégorie
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category_tag === filterCategory);
    }

    // Filtre par marque
    if (filterBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === filterBrand);
    }

    // Filtre par pièces
    if (filterPieces !== 'all') {
      if (filterPieces === '0-500') {
        filtered = filtered.filter(p => (p.piece_count || 0) >= 0 && (p.piece_count || 0) <= 500);
      } else if (filterPieces === '500-1000') {
        filtered = filtered.filter(p => (p.piece_count || 0) > 500 && (p.piece_count || 0) <= 1000);
      } else if (filterPieces === '1000-3000') {
        filtered = filtered.filter(p => (p.piece_count || 0) > 1000 && (p.piece_count || 0) <= 3000);
      } else if (filterPieces === '3000+') {
        filtered = filtered.filter(p => (p.piece_count || 0) > 3000);
      }
    }

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tri
    if (sortBy === 'category') {
      filtered.sort((a, b) => (a.category_tag || '').localeCompare(b.category_tag || ''));
    } else if (sortBy === 'pieces') {
      filtered.sort((a, b) => (a.piece_count || 0) - (b.piece_count || 0));
    } else if (sortBy === 'brand') {
      filtered.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
    }

    setPuzzles(filtered);
  };

  const handleSelectPuzzle = async (puzzle) => {
    setIsLoading(true);
    try {
      if (currentPuzzle) {
        await base44.entities.FeaturedPuzzle.update(currentPuzzle.id, {
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin,
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd
        });
      } else {
        await base44.entities.FeaturedPuzzle.create({
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin,
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd,
          position
        });
      }
      toast.success('Puzzle mis en avant!');
      await onUpdate();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un puzzle pour la position {position}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un puzzle..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
             <div>
               <label className="text-xs text-white/60 block mb-1.5">Catégorie</label>
               <select
                 value={filterCategory}
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2"
               >
                 <option value="all">Toutes</option>
                 {categories.map(cat => (
                   <option key={cat.id} value={cat.name}>{cat.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs text-white/60 block mb-1.5">Marque</label>
               <select
                 value={filterBrand}
                 onChange={(e) => setFilterBrand(e.target.value)}
                 className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2"
               >
                 <option value="all">Toutes</option>
                 {brands.map(brand => (
                   <option key={brand.id} value={brand.name}>{brand.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs text-white/60 block mb-1.5">Nombre de pièces</label>
               <select
                 value={filterPieces}
                 onChange={(e) => setFilterPieces(e.target.value)}
                 className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2"
               >
                 <option value="all">Tous</option>
                 {piecesOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs text-white/60 block mb-1.5">Trier par</label>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2"
               >
                 <option value="likes">Les plus aimés</option>
                 <option value="category">Catégorie</option>
                 <option value="brand">Marque</option>
                 <option value="pieces">Pièces (asc)</option>
               </select>
             </div>
           </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : puzzles.length === 0 ? (
              <div className="text-center py-12">
                <Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Aucun puzzle trouvé</p>
              </div>
            ) : (
              puzzles.map((puzzle) => (
                <button
                  key={puzzle.id}
                  onClick={() => handleSelectPuzzle(puzzle)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/30"
                >
                  <img
                    src={puzzle.image_hd}
                    alt={puzzle.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-medium text-sm line-clamp-1">{puzzle.title}</h4>
                    <p className="text-white/50 text-xs">{puzzle.brand} • {puzzle.piece_count} pcs</p>
                    <p className="text-orange-400 text-xs">❤️ {puzzle.total_likes + puzzle.total_superlikes}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}