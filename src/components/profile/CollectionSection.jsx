import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/components/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Package, CheckCircle, Loader2, Puzzle, MoreVertical, Trash2, ArrowRight, ArrowUpDown, Camera, ImagePlus, X, Tag, Zap, Share2 } from 'lucide-react';
import AddSpeedRecordInline from '@/components/profile/AddSpeedRecordInline';
import ShareToFeedModal from '@/components/profile/ShareToFeedModal';
import StarRating from '@/components/shared/StarRating';
import UserCategoriesManager from '@/components/profile/UserCategoriesManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

// Hook to prevent dropdown from opening when user is scrolling
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
      if (dx > 8 || dy > 8) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    setOpen(o => !o);
  }, []);

  return { open, setOpen, handlePointerDown, handleClick };
}

export default function CollectionSection({ user }) {
  const { t } = useLanguage();
  const [wishlistPuzzles, setWishlistPuzzles] = useState([]);
  const [inboxPuzzles, setInboxPuzzles] = useState([]);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const sortDropdown = useScrollSafeDropdown();
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState(null);
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPuzzles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const [wishlist, inbox, completed, cats] = await Promise.all([
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'wishlist' }),
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'inbox' }),
        base44.entities.UserPuzzle.filter({ created_by: user.email, status: 'done' }),
        base44.entities.UserCategory.filter({ created_by: user.email }),
      ]);

      setWishlistPuzzles(wishlist);
      setInboxPuzzles(inbox);
      setCompletedPuzzles(completed);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSorted = (puzzles) => {
    let list = filterCategoryId
      ? puzzles.filter(p => p.user_category_id === filterCategoryId)
      : puzzles;
    return getSortedPuzzles(list);
  };

  const getSortedPuzzles = (puzzles) => {
    const sorted = [...puzzles];
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  const handleOptimisticMove = (puzzleId, newStatus) => {
    const allPuzzles = [...wishlistPuzzles, ...inboxPuzzles, ...completedPuzzles];
    const puzzle = allPuzzles.find(p => p.id === puzzleId);
    if (!puzzle) return;

    setWishlistPuzzles(prev => prev.filter(p => p.id !== puzzleId));
    setInboxPuzzles(prev => prev.filter(p => p.id !== puzzleId));
    setCompletedPuzzles(prev => prev.filter(p => p.id !== puzzleId));

    const updated = { ...puzzle, status: newStatus };
    if (newStatus === 'done') setCompletedPuzzles(prev => [...prev, updated]);
    else if (newStatus === 'inbox') setInboxPuzzles(prev => [...prev, updated]);
    else if (newStatus === 'wishlist') setWishlistPuzzles(prev => [...prev, updated]);
  };

  const sortedWishlistPuzzles = getFilteredAndSorted(wishlistPuzzles);
  const sortedInboxPuzzles = getFilteredAndSorted(inboxPuzzles);
  const sortedCompletedPuzzles = getFilteredAndSorted(completedPuzzles);

  const handleMultiDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.length} puzzle(s) de votre collection ?`)) return;
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await base44.entities.UserPuzzle.delete(id);
        deleted++;
      } catch (e) {
        // Already deleted or not found, skip silently
      }
    }
    toast.success(`${deleted} puzzle(s) supprimé(s)`);
    setIsMultiSelect(false);
    setSelectedIds([]);
    loadPuzzles();
  };

  const handleMultiMove = async (newStatus) => {
    for (const id of selectedIds) {
      await base44.entities.UserPuzzle.update(id, { status: newStatus });
    }
    toast.success(`${selectedIds.length} puzzle(s) déplacé(s)`);
    setIsMultiSelect(false);
    setSelectedIds([]);
    loadPuzzles();
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Tabs defaultValue="inbox" className="w-full" onValueChange={() => { setIsMultiSelect(false); setSelectedIds([]); }}>
      {/* Catégories personnelles */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCategoriesManager(v => !v)}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-full px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
          >
            <Tag className="w-3 h-3" /> Mes catégories
          </button>
          {categories.length > 0 && (
            <>
              <button
                onClick={() => setFilterCategoryId(null)}
                className={`text-xs rounded-full px-2.5 py-1 border transition-all ${!filterCategoryId ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}
              >
                Tous
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border transition-all`}
                  style={{
                    borderColor: filterCategoryId === cat.id ? cat.color : `${cat.color}40`,
                    backgroundColor: filterCategoryId === cat.id ? `${cat.color}30` : `${cat.color}10`,
                    color: cat.color,
                  }}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </>
          )}
        </div>
        {showCategoriesManager && (
          <div className="mt-3 bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <UserCategoriesManager user={user} onCategoriesChange={setCategories} />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="inbox" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            {t('inBox2')} ({inboxPuzzles.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('completedTab')} ({completedPuzzles.length})
          </TabsTrigger>
        </TabsList>

        <DropdownMenu open={sortDropdown.open} onOpenChange={sortDropdown.setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-white/20 text-white bg-transparent hover:bg-white/5"
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

      <TabsContent value="inbox">
        {inboxPuzzles.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">{t('noInboxPuzzle')}</p>
            <p className="text-white/30 text-sm mt-2">{t('scanToAdd')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {sortedInboxPuzzles.map((puzzle, index) => (
              <PuzzleCard
                key={puzzle.id} puzzle={puzzle} index={index}
                onUpdate={loadPuzzles} onOptimisticMove={handleOptimisticMove}
                isMultiSelect={isMultiSelect} isSelected={selectedIds.includes(puzzle.id)}
                onToggleSelect={() => toggleSelect(puzzle.id)}
                onEnterMultiSelect={() => { setIsMultiSelect(true); setSelectedIds([puzzle.id]); }}
                categories={categories}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completedPuzzles.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
            <CheckCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">{t('noCompletedPuzzle')}</p>
            <p className="text-white/30 text-sm mt-2">{t('completeFirstPuzzle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {sortedCompletedPuzzles.map((puzzle, index) => (
              <PuzzleCard
                key={puzzle.id} puzzle={puzzle} index={index}
                onUpdate={loadPuzzles} onOptimisticMove={handleOptimisticMove}
                isMultiSelect={isMultiSelect} isSelected={selectedIds.includes(puzzle.id)}
                onToggleSelect={() => toggleSelect(puzzle.id)}
                onEnterMultiSelect={() => { setIsMultiSelect(true); setSelectedIds([puzzle.id]); }}
                categories={categories}
              />
            ))}
          </div>
        )}
      </TabsContent>

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
              <button onClick={() => handleMultiMove('wishlist')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-medium whitespace-nowrap">
                <span>⭐</span> Wishlist
              </button>
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
    </Tabs>
  );
}

function UserPuzzleDetailModal({ open, onClose, puzzle, onUpdate, categories = [] }) {
  const { t } = useLanguage();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localRating, setLocalRating] = useState(0);
  const [localCategoryId, setLocalCategoryId] = useState(null);
  const [showSpeedRecord, setShowSpeedRecord] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (puzzle) {
      setLocalPhoto(puzzle.progress_photo || null);
      setLocalRating(puzzle.rating || 0);
      setLocalCategoryId(puzzle.user_category_id || null);
    }
  }, [puzzle]);

  const handleRatingChange = async (newRating) => {
    setLocalRating(newRating);
    await base44.entities.UserPuzzle.update(puzzle.id, { rating: newRating || null });
    if (onUpdate) onUpdate();
  };

  const handleCategoryChange = async (catId) => {
    const newCatId = catId === localCategoryId ? null : catId;
    setLocalCategoryId(newCatId);
    await base44.entities.UserPuzzle.update(puzzle.id, { user_category_id: newCatId });
    if (onUpdate) onUpdate();
  };

  if (!puzzle) return null;

  const displayImage = (puzzle.status === 'done' && localPhoto) ? localPhoto : puzzle.image_url;


  const handleChangePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserPuzzle.update(puzzle.id, { progress_photo: file_url });
      setLocalPhoto(file_url);
      toast.success(t('photoAdded'));
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(t('uploadError'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Supprimer la photo personnelle et revenir à la photo originale ?')) return;
    try {
      await base44.entities.UserPuzzle.update(puzzle.id, { progress_photo: null });
      setLocalPhoto(null);
      toast.success('Photo supprimée');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(t('uploadError'));
    }
  };

  return (
    <>
    <AddSpeedRecordInline open={showSpeedRecord} onClose={() => setShowSpeedRecord(false)} puzzle={puzzle} />
    <ShareToFeedModal open={showShare} onClose={() => setShowShare(false)} puzzle={puzzle} photoUrl={localPhoto || puzzle?.image_url} />
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChangePhoto} />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {displayImage && (
          <div className="w-full bg-white/5 relative">
            <img src={displayImage} alt={puzzle.puzzle_name} className="w-full h-64 object-contain" />
          </div>
        )}

        {/* Boutons photo pour puzzles terminés */}
        {puzzle.status === 'done' && (
          <div className="flex gap-2 px-6 pt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {isUploadingPhoto ? 'Upload...' : localPhoto ? t('changeMyPhoto') : t('addMyPhotoBtn')}
            </button>
            {localPhoto && (
              <button
                onClick={handleDeletePhoto}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer la photo
              </button>
            )}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{puzzle.puzzle_name}</h2>
            {puzzle.puzzle_brand && (
              <p className="text-orange-400 font-semibold mt-1">{t('byBrand')}{puzzle.puzzle_brand}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {puzzle.puzzle_pieces && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <span>🧩</span>
                <span className="text-white font-semibold">{puzzle.puzzle_pieces} {t('puzzlePiecesCount')}</span>
              </div>
            )}
            {puzzle.puzzle_reference && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <span className="text-white/60 text-sm">{t('puzzleRef')}{puzzle.puzzle_reference}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <span className="text-white/60 text-sm capitalize">
                {puzzle.status === 'inbox' ? t('inTheBox') : puzzle.status === 'done' ? t('completedStatus') : puzzle.status}
              </span>
            </div>
          </div>

          {/* Note ⭐ */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <p className="text-white/50 text-xs">Ma note</p>
            <StarRating value={localRating} onChange={handleRatingChange} size="md" />
            {localRating === 0 && <p className="text-white/30 text-xs">Pas encore noté</p>}
          </div>

          {/* Record ⚡ */}
          <button
            onClick={() => setShowSpeedRecord(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Ajouter un record ⚡
          </button>

          {/* Partager sur le feed */}
          <button
            onClick={() => setShowShare(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Partager sur le feed social 🎉
          </button>

          {/* Catégorie personnelle */}
          {categories.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-white/50 text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Catégorie personnelle</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className="flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border transition-all"
                    style={{
                      borderColor: localCategoryId === cat.id ? cat.color : `${cat.color}40`,
                      backgroundColor: localCategoryId === cat.id ? `${cat.color}30` : `${cat.color}10`,
                      color: cat.color,
                    }}
                  >
                    {cat.icon} {cat.name}
                    {localCategoryId === cat.id && ' ✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {puzzle.notes && (
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm">{puzzle.notes}</p>
            </div>
          )}

          {puzzle.start_date && (
            <p className="text-white/50 text-sm">{t('startedOn')}{new Date(puzzle.start_date).toLocaleDateString()}</p>
          )}
          {puzzle.end_date && (
            <p className="text-white/50 text-sm">{t('completedOn')}{new Date(puzzle.end_date).toLocaleDateString()}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function PuzzleCard({ puzzle, index, onUpdate, onOptimisticMove, isMultiSelect, isSelected, onToggleSelect, onEnterMultiSelect, categories }) {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showSpeedRecord, setShowSpeedRecord] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const fileInputRef = useRef(null);

  const handleCompletionPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserPuzzle.update(puzzle.id, { progress_photo: file_url });
      toast.success(t('photoAdded'));
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(t('uploadError'));
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleMove = async (newStatus) => {
    if (isUpdating) return;
    onOptimisticMove(puzzle.id, newStatus);
    setIsUpdating(true);
    try {
      await base44.entities.UserPuzzle.update(puzzle.id, { status: newStatus });
      if (newStatus === 'done') {
        const user = await base44.auth.me();
        await base44.auth.updateMe({ xp: (user.xp || 0) + 100 });
        toast.success(t('xpGained'));
      } else if (newStatus === 'inbox') {
        toast.success(t('puzzleBoxed'));
      } else if (newStatus === 'wishlist') {
        toast.success(t('puzzleWishlisted'));
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(t('updateError'));
      onOptimisticMove(puzzle.id, puzzle.status);
    } finally {
      setIsUpdating(false);
    }
  };

  const moveOptions = [
    { status: 'wishlist', label: '⭐ Wishlist', hidden: puzzle.status === 'wishlist' },
    { status: 'inbox', label: `📦 ${t('inBox2')}`, hidden: puzzle.status === 'inbox' },
    { status: 'done', label: `🏆 ${t('completedTab')}`, hidden: puzzle.status === 'done' },
  ].filter(o => !o.hidden);

  const handleShareToFeed = (e) => {
    if (e) e.stopPropagation();
    setShowShare(true);
  };

  const handleDelete = async () => {
    if (isUpdating) return;
    
    if (!confirm(t('removeConfirm'))) {
      return;
    }
    
    setIsUpdating(true);
    try {
      await base44.entities.UserPuzzle.delete(puzzle.id);
      toast.success(t('removeSuccess'));
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error(t('removeError'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
    <UserPuzzleDetailModal open={showDetail} onClose={() => setShowDetail(false)} puzzle={puzzle} onUpdate={onUpdate} categories={categories} />
    <AddSpeedRecordInline open={showSpeedRecord} onClose={() => setShowSpeedRecord(false)} puzzle={puzzle} />
    <ShareToFeedModal open={showShare} onClose={() => setShowShare(false)} puzzle={puzzle} photoUrl={puzzle.progress_photo || puzzle.image_url} />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => isMultiSelect ? onToggleSelect() : setShowDetail(true)}
      className={`bg-white/[0.03] backdrop-blur-xl border rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group relative cursor-pointer ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/40' : 'border-white/[0.06]'}`}
    >
      {/* Checkbox multi-select */}
      {isMultiSelect && (
        <div className={`absolute top-1.5 left-1.5 z-20 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-black/40 border-white/50'}`}>
          {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
      )}

      {/* Menu d'actions */}
      {!isMultiSelect && (
      <div className="absolute top-1.5 right-1.5 z-10" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white opacity-100 transition-opacity"
              disabled={isUpdating}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            {moveOptions.map(({ status, label }) => (
              <DropdownMenuItem
                key={status}
                onClick={() => handleMove(status)}
                className="text-white cursor-pointer hover:bg-white/10"
              >
                {label}
              </DropdownMenuItem>
            ))}
            {puzzle.status === 'done' && (
              <>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-400 cursor-pointer hover:bg-white/10"
                disabled={isUploadingPhoto}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingPhoto ? 'Upload...' : puzzle.progress_photo ? t('changeMyPhoto') : t('addMyPhotoBtn')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowSpeedRecord(true)}
                className="text-yellow-400 cursor-pointer hover:bg-white/10"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ajouter un record ⚡
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleShareToFeed(e)}
                className="text-green-400 cursor-pointer hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager sur le feed
              </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => onEnterMultiSelect()}
              className="text-blue-400 cursor-pointer hover:bg-white/10"
            >
              ☑️ Sélection multiple
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-400 cursor-pointer hover:bg-white/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('removeFromCollection')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCompletionPhotoUpload}
      />

      <div className="aspect-[3/4] overflow-hidden bg-white/5 relative">
        {/* For done puzzles: show completion photo if available, then puzzle image */}
        {(puzzle.status === 'done' && puzzle.progress_photo) ? (
          <>
            <img
              src={puzzle.progress_photo}
              alt={`${puzzle.puzzle_name} - terminé`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-1 right-1 bg-green-500/80 rounded-full p-1">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </>
        ) : puzzle.image_url ? (
          <>
            <img
              src={puzzle.image_url}
              alt={puzzle.puzzle_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {puzzle.status === 'done' && (
              <div
                className="absolute bottom-1 left-1 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                <div className="w-6 h-6 rounded-full bg-orange-500/90 flex items-center justify-center shadow-lg">
                  <ImagePlus className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={puzzle.status === 'done' ? (e) => { e.stopPropagation(); fileInputRef.current?.click(); } : undefined}
          >
            {puzzle.status === 'done' ? (
              <div className="flex flex-col items-center gap-2 text-white/30 hover:text-orange-400 transition-colors">
                <ImagePlus className="w-10 h-10" />
                <span className="text-xs">{t('addMyPhotoBtn')}</span>
              </div>
            ) : (
              <Puzzle className="w-12 h-12 text-white/20" />
            )}
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-white text-[11px] font-semibold line-clamp-2 mb-0.5 leading-tight">
          {puzzle.puzzle_name}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span className="truncate max-w-[60%]">{puzzle.puzzle_brand}</span>
          <span>{puzzle.puzzle_pieces} pcs</span>
        </div>
        {puzzle.rating > 0 && (
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill={s <= puzzle.rating ? '#f59e0b' : 'none'} stroke={s <= puzzle.rating ? '#f59e0b' : '#6b7280'} strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            ))}
          </div>
        )}
      </div>
    </motion.div>
    </>
  );
}