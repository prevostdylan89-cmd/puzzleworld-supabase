import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabaseClient';
import { Search, Loader2, Puzzle } from 'lucide-react';
import { toast } from 'sonner';

export default function FeaturedPuzzleSelector({ open, onClose, position, currentPuzzle, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [puzzles, setPuzzles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('added');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPieces, setFilterPieces] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allPuzzlesData, setAllPuzzlesData] = useState([]);

  useEffect(() => { if (open) loadAllData(); }, [open]);
  useEffect(() => { if (open) filterAndSortPuzzles(); }, [searchQuery, sortBy, filterCategory, filterPieces, filterBrand, allPuzzlesData]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const { data: all } = await supabase
        .from('puzzle_catalog')
        .select('*')
        .eq('status', 'active')
        .order('added_count', { ascending: false })
        .limit(1000);
      setAllPuzzlesData(all || []);
      const uniqueCats = [...new Set((all || []).map(p => p.category_tag).filter(Boolean))].sort();
      setCategories(uniqueCats);
      const uniqueBrands = [...new Set((all || []).map(p => p.brand).filter(Boolean))].sort();
      setBrands(uniqueBrands);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortPuzzles = () => {
    let filtered = [...allPuzzlesData];
    if (filterCategory !== 'all') filtered = filtered.filter(p => p.category_tag === filterCategory);
    if (filterBrand !== 'all') filtered = filtered.filter(p => p.brand === filterBrand);
    if (filterPieces === '0-500') filtered = filtered.filter(p => (p.piece_count || 0) <= 500);
    else if (filterPieces === '500-1000') filtered = filtered.filter(p => (p.piece_count || 0) > 500 && (p.piece_count || 0) <= 1000);
    else if (filterPieces === '1000-3000') filtered = filtered.filter(p => (p.piece_count || 0) > 1000 && (p.piece_count || 0) <= 3000);
    else if (filterPieces === '3000+') filtered = filtered.filter(p => (p.piece_count || 0) > 3000);
    if (searchQuery) filtered = filtered.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'category') filtered.sort((a, b) => (a.category_tag || '').localeCompare(b.category_tag || ''));
    else if (sortBy === 'pieces') filtered.sort((a, b) => (a.piece_count || 0) - (b.piece_count || 0));
    else if (sortBy === 'brand') filtered.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
    setPuzzles(filtered);
  };

  const handleSelectPuzzle = async (puzzle) => {
    setIsLoading(true);
    try {
      if (currentPuzzle) {
        const { error } = await supabase.from('featured_puzzles').update({
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin || '',
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd || '',
        }).eq('id', currentPuzzle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('featured_puzzles').insert({
          puzzle_catalog_id: puzzle.id,
          puzzle_asin: puzzle.asin || '',
          puzzle_title: puzzle.title,
          puzzle_image: puzzle.image_hd || '',
          position,
        });
        if (error) throw error;
      }
      toast.success('Puzzle mis en avant !');
      await onUpdate();
      onClose();
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Sélectionner un puzzle — Position {position}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un puzzle..." className="pl-10 bg-white/5 border-white/10 text-white" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-white/60 block mb-1.5">Catégorie</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2">
                <option value="all">Toutes</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">Marque</label>
              <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2">
                <option value="all">Toutes</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">Pièces</label>
              <select value={filterPieces} onChange={e => setFilterPieces(e.target.value)} className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2">
                <option value="all">Tous</option>
                <option value="0-500">0–500</option>
                <option value="500-1000">500–1000</option>
                <option value="1000-3000">1000–3000</option>
                <option value="3000+">3000+</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-1.5">Trier par</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-[#000019] border border-white/10 text-white text-sm rounded px-3 py-2">
                <option value="added">Plus ajoutés</option>
                <option value="category">Catégorie</option>
                <option value="brand">Marque</option>
                <option value="pieces">Pièces</option>
              </select>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
            ) : puzzles.length === 0 ? (
              <div className="text-center py-12"><Puzzle className="w-12 h-12 text-white/20 mx-auto mb-4" /><p className="text-white/50">Aucun puzzle trouvé</p></div>
            ) : puzzles.map(puzzle => (
              <button key={puzzle.id} onClick={() => handleSelectPuzzle(puzzle)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 hover:border-orange-500/30">
                <img src={puzzle.image_hd} alt={puzzle.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1 text-left">
                  <h4 className="text-white font-medium text-sm line-clamp-1">{puzzle.title}</h4>
                  <p className="text-white/50 text-xs">{puzzle.brand} • {puzzle.piece_count} pcs</p>
                  <p className="text-orange-400 text-xs">➕ {puzzle.added_count || 0} ajouts</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
