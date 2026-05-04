import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { Trash2, ArrowUpDown, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import WishlistPuzzleModal from '@/components/profile/WishlistPuzzleModal';
import AddSpeedRecordInline from '@/components/profile/AddSpeedRecordInline';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useScrollSafeDropdown() {
  const [open, setOpen] = useState(false);
  const pointerStartRef = useRef(null);
  const handlePointerDown = useCallback((e) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleClick = useCallback((e) => {
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      if (dx > 8 || dy > 8) { e.preventDefault(); e.stopPropagation(); return; }
    }
    setOpen(o => !o);
  }, []);
  return { open, setOpen, handlePointerDown, handleClick };
}

export default function WishlistSection({ user }) {
  const { t } = useLanguage();
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [speedRecordPuzzle, setSpeedRecordPuzzle] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const sortDropdown = useScrollSafeDropdown();
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // Subscribe to real-time changes — when a UserPuzzle is created/updated/deleted, reload
    const unsubUserPuzzle = base44.entities.UserPuzzle.subscribe((event) => {
      // Only reload when the change affects wishlist items
      if (event.type === 'create' && event.data?.status === 'wishlist') {
        loadWishlist();
      } else if (event.type === 'update' || event.type === 'delete') {
        loadWishlist();
      }
    });
    const unsubWishlist = base44.entities.Wishlist.subscribe(() => loadWishlist());
    return () => { unsubUserPuzzle(); unsubWishlist(); };
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    try {
      // Load UserPuzzle wishlist items + legacy Wishlist entity in parallel
      const [userPuzzleWishlist, oldWishlistItems] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'wishlist' }, '-created_date'),
        base44.entities.Wishlist.filter({ created_by: user.email }, '-created_date'),
      ]);

      // Normalize UserPuzzle items — no extra catalog fetch needed, data is already embedded
      // Fetch catalog data for puzzles that have a catalog_puzzle_id
      const catalogIds = userPuzzleWishlist
        .map(p => p.catalog_puzzle_id)
        .filter(Boolean);
      
      let catalogMap = {};
      if (catalogIds.length > 0) {
        try {
          const catalogEntries = await Promise.all(
            catalogIds.map(id => base44.entities.PuzzleCatalog.filter({ id }))
          );
          catalogEntries.forEach(entries => {
            if (entries.length > 0) catalogMap[entries[0].id] = entries[0];
          });
        } catch (e) {}
      }

      const normalizedUserPuzzles = userPuzzleWishlist.map((p) => {
        const catalog = p.catalog_puzzle_id ? catalogMap[p.catalog_puzzle_id] : null;
        return {
          id: p.id,
          puzzle_name: p.puzzle_name,
          puzzle_brand: p.puzzle_brand,
          puzzle_pieces: p.puzzle_pieces,
          image_url: p.image_url,
          notes: p.notes || '',
          priority: 'medium',
          created_date: p.created_date,
          _source: 'user_puzzle',
          _raw: p,
          // Use full catalog data if available, otherwise build minimal from puzzle reference
          catalogData: catalog || (p.puzzle_reference ? {
            title: p.puzzle_name,
            brand: p.puzzle_brand,
            piece_count: p.puzzle_pieces,
            image_hd: p.image_url,
            asin: p.puzzle_reference,
          } : {
            title: p.puzzle_name,
            brand: p.puzzle_brand,
            piece_count: p.puzzle_pieces,
            image_hd: p.image_url,
          }),
        };
      });

      // Legacy Wishlist items
      const normalizedOld = oldWishlistItems.map((item) => ({
        ...item,
        _source: 'wishlist',
        catalogData: null,
      }));

      // Merge and dedup by puzzle_name (UserPuzzle takes priority)
      const seen = new Set();
      const merged = [];
      for (const item of [...normalizedUserPuzzles, ...normalizedOld]) {
        const key = item.puzzle_name?.toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }

      setWishlist(merged);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMove = async (item, newStatus) => {
    try {
      if (item._source === 'user_puzzle') {
        await base44.entities.UserPuzzle.update(item.id, { status: newStatus });
      } else {
        // Old Wishlist entity: create a UserPuzzle and delete the old one
        await base44.entities.UserPuzzle.create({
          puzzle_name: item.puzzle_name,
          puzzle_brand: item.puzzle_brand || '',
          puzzle_pieces: item.puzzle_pieces || 0,
          image_url: item.image_url || '',
          status: newStatus,
        });
        await base44.entities.Wishlist.delete(item.id);
      }
      setWishlist(wishlist.filter(w => w.id !== item.id));
      const labels = { inbox: `${t('inBox2')} 📦`, done: `${t('completedTab')} 🏆` };
      toast.success(`${t('movedTo')} ${labels[newStatus]}`);
    } catch (error) {
      console.error('Error moving item:', error);
      toast.error(t('moveError'));
    }
  };

  const handleDelete = async (item) => {
    try {
      if (item._source === 'user_puzzle') {
        await base44.entities.UserPuzzle.delete(item.id);
      } else {
        await base44.entities.Wishlist.delete(item.id);
      }
      setWishlist(wishlist.filter(w => w.id !== item.id));
      toast.success(t('removedFromWishlist'));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('removeError'));
    }
  };

  const getSortedWishlist = (items) => {
    const sorted = [...items];
    
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      case 'pieces-asc':
        return sorted.sort((a, b) => (a.puzzle_pieces || 0) - (b.puzzle_pieces || 0));
      case 'pieces-desc':
        return sorted.sort((a, b) => (b.puzzle_pieces || 0) - (a.puzzle_pieces || 0));
      default:
        return sorted;
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return <p className="text-white/50 text-center py-8">Loading wishlist...</p>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 mb-2">Your wishlist is empty</p>
        <p className="text-white/30 text-sm">Add puzzles from posts to start your wishlist</p>
      </div>
    );
  }

  const handleMultiDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.length} puzzle(s) de votre wishlist ?`)) return;
    for (const id of selectedIds) {
      const item = wishlist.find(w => w.id === id);
      if (!item) continue;
      if (item._source === 'user_puzzle') await base44.entities.UserPuzzle.delete(id);
      else await base44.entities.Wishlist.delete(id);
    }
    toast.success(`${selectedIds.length} puzzle(s) supprimé(s)`);
    setIsMultiSelect(false);
    setSelectedIds([]);
    loadWishlist();
  };

  const handleMultiMove = async (newStatus) => {
    for (const id of selectedIds) {
      const item = wishlist.find(w => w.id === id);
      if (!item) continue;
      if (item._source === 'user_puzzle') {
        await base44.entities.UserPuzzle.update(id, { status: newStatus });
      } else {
        await base44.entities.UserPuzzle.create({
          puzzle_name: item.puzzle_name, puzzle_brand: item.puzzle_brand || '',
          puzzle_pieces: item.puzzle_pieces || 0, image_url: item.image_url || '', status: newStatus,
        });
        await base44.entities.Wishlist.delete(id);
      }
    }
    const labels = { inbox: `${t('inBox2')} 📦`, done: `${t('completedTab')} 🏆` };
    toast.success(`${selectedIds.length} puzzle(s) → ${labels[newStatus]}`);
    setIsMultiSelect(false);
    setSelectedIds([]);
    loadWishlist();
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const sortedWishlist = getSortedWishlist(wishlist);

  return (
    <>
      <div className="flex justify-end mb-6">
        <DropdownMenu open={sortDropdown.open} onOpenChange={sortDropdown.setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
              onPointerDown={sortDropdown.handlePointerDown}
              onClick={sortDropdown.handleClick}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {t('sortByBtn')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            <DropdownMenuItem 
              onClick={() => { setSortBy('date-desc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-desc' ? 'bg-orange-500/20' : ''}`}
            >
              {t('dateNewest')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('date-asc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-asc' ? 'bg-orange-500/20' : ''}`}
            >
              {t('dateOldest')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('pieces-asc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-asc' ? 'bg-orange-500/20' : ''}`}
            >
              {t('piecesAscSort')}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortBy('pieces-desc'); sortDropdown.setOpen(false); }}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-desc' ? 'bg-orange-500/20' : ''}`}
            >
              {t('piecesDescSort')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {sortedWishlist.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/[0.03] backdrop-blur-xl border rounded-xl overflow-hidden hover:border-orange-500/30 transition-colors group cursor-pointer relative ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/40' : 'border-white/[0.06]'}`}
              onClick={() => isMultiSelect ? toggleSelect(item.id) : setSelectedPuzzle(item)}
            >
              {/* Checkbox multi-select */}
              {isMultiSelect && (
                <div className={`absolute top-1.5 left-1.5 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-black/40 border-white/50'}`}>
                  {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              )}

              {/* 3-dot menu */}
              {!isMultiSelect && (
                <div className="absolute top-1.5 right-1.5 z-10" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="2" r="1.2"/><circle cx="6" cy="6" r="1.2"/><circle cx="6" cy="10" r="1.2"/></svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMove(item, 'inbox'); }} className="text-white hover:bg-white/10 cursor-pointer">
                        📦 {t('inBox2')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMove(item, 'done'); }} className="text-white hover:bg-white/10 cursor-pointer">
                        🏆 {t('completedTab')}
                      </DropdownMenuItem>
                      {(item.catalogData?.amazon_link || item.catalogData?.asin) && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); const link = item.catalogData.amazon_link || `https://www.amazon.fr/dp/${item.catalogData.asin}?tag=MON_PUZZLE_ID-21`; window.open(link, '_blank'); }} className="text-yellow-400 hover:bg-white/10 cursor-pointer">
                          🛒 Amazon
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSpeedRecordPuzzle({ id: item.id, puzzle_name: item.puzzle_name, puzzle_brand: item.puzzle_brand, puzzle_pieces: item.puzzle_pieces, image_url: item.image_url }); }} className="text-yellow-400 hover:bg-white/10 cursor-pointer">
                        <Zap className="w-3 h-3 mr-1" /> Ajouter un record ⚡
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsMultiSelect(true); setSelectedIds([item.id]); }} className="text-blue-400 hover:bg-white/10 cursor-pointer">
                        ☑️ Sélection multiple
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-red-400 hover:bg-white/10 cursor-pointer">
                        <Trash2 className="w-3 h-3 mr-1" /> {t('removeFromCollection')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="aspect-[3/4] overflow-hidden bg-white/5">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.puzzle_name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">⭐</div>
                )}
              </div>
              <div className="p-2">
                <h4 className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{item.puzzle_name}</h4>
                {item.puzzle_pieces > 0 && (
                  <p className="text-white/40 text-[10px] mt-0.5">{item.puzzle_pieces} pcs</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isMultiSelect && createPortal(
        <div className="fixed bottom-16 left-0 right-0 z-[9990] flex justify-center px-4 pb-2 lg:bottom-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-[#0d0d35] border border-white/15 rounded-2xl shadow-2xl flex items-center gap-2 px-3 py-2"
          >
            <span className="text-white/60 text-xs font-medium flex-shrink-0">
              {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
              <button onClick={() => handleMultiMove('inbox')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium whitespace-nowrap">
                <span>📦</span> {t('inBox2')}
              </button>
              <button onClick={() => handleMultiMove('done')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium whitespace-nowrap">
                <span>🏆</span> {t('completedTab')}
              </button>
              <button onClick={handleMultiDelete} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium whitespace-nowrap">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
            <button onClick={() => { setIsMultiSelect(false); setSelectedIds([]); }} className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>,
        document.body
      )}

      {selectedPuzzle && (
        <WishlistPuzzleModal
          open={!!selectedPuzzle}
          onClose={() => setSelectedPuzzle(null)}
          item={selectedPuzzle}
        />
      )}
      <AddSpeedRecordInline
        open={!!speedRecordPuzzle}
        onClose={() => setSpeedRecordPuzzle(null)}
        puzzle={speedRecordPuzzle}
      />
    </>
  );
}