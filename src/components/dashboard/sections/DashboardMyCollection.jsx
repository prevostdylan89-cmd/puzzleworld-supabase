import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Grid3X3, Search, Edit2, Trash2, Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import PuzzleEditModal from '@/components/dashboard/PuzzleEditModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



export default function DashboardMyCollection() {
  const [puzzles, setPuzzles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dynamicCategories, setDynamicCategories] = useState([]);

  useEffect(() => {
    base44.entities.PuzzleCategory.list('order', 100).then(data => {
      setDynamicCategories(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }).catch(() => {});
  }, []);
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [deletingPuzzle, setDeletingPuzzle] = useState(null);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    setLoading(true);
    try {
      const allPuzzles = await base44.entities.PuzzleCatalog.list('-created_date', 500);
      setPuzzles(allPuzzles);
    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPuzzle) return;

    try {
      await base44.entities.PuzzleCatalog.delete(deletingPuzzle.id);
      toast.success('Puzzle supprimé');
      setDeletingPuzzle(null);
      loadPuzzles();
    } catch (error) {
      console.error('Error deleting puzzle:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPuzzles = puzzles
    .filter(p => {
      const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category_tag === selectedCategory || (sortBy === 'no_category' && !p.category_tag);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'pieces_asc') {
        return (a.piece_count || 0) - (b.piece_count || 0);
      } else if (sortBy === 'pieces_desc') {
        return (b.piece_count || 0) - (a.piece_count || 0);
      } else if (sortBy === 'missing_pieces') {
        const aMissing = !a.piece_count || a.piece_count === 0 ? 1 : 0;
        const bMissing = !b.piece_count || b.piece_count === 0 ? 1 : 0;
        return bMissing - aMissing;
      } else if (sortBy === 'no_category') {
        const aNo = !a.category_tag ? 1 : 0;
        const bNo = !b.category_tag ? 1 : 0;
        return bNo - aNo;
      } else if (sortBy === 'no_ean') {
        const aNo = !a.ean ? 1 : 0;
        const bNo = !b.ean ? 1 : 0;
        return bNo - aNo;
      }
      return 0; // date order (default from API)
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Collection Communautaire</h2>
          <p className="text-white/60">Gérez tous les puzzles de la plateforme</p>
        </div>
        <Button
          onClick={() => setEditingPuzzle(null) || setShowAddModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un puzzle
        </Button>
      </div>

      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-6">
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre ou marque..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-sm ${selectedCategory === 'all' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              <span>🌍</span><span className="font-medium">Tous</span>
            </button>
            {dynamicCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-sm ${
                  selectedCategory === cat.name ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/50 text-sm">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="date">Date d'ajout</option>
              <option value="pieces_asc">Pièces (croissant)</option>
              <option value="pieces_desc">Pièces (décroissant)</option>
              <option value="missing_pieces">❌ Pièces manquantes</option>
              <option value="no_category">🏷️ Sans catégorie</option>
              <option value="no_ean">📦 Sans EAN</option>
            </select>
          </div>

          <p className="text-white/50 text-sm">
            {filteredPuzzles.length} puzzle(s) trouvé(s)
          </p>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredPuzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 flex items-center gap-4 hover:border-white/10 transition-all"
            >
              <img
                src={puzzle.image_hd}
                alt={puzzle.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm line-clamp-1">{puzzle.title}</h4>
              <p className="text-white/50 text-xs">
                {puzzle.brand} • {puzzle.piece_count} pièces • {puzzle.category_tag}
              </p>
              <p className="text-orange-400 text-xs mt-1">
                ❤️ {puzzle.total_likes + puzzle.total_superlikes} likes
                {puzzle.ean ? (
                  <span className="ml-2 text-green-400">📦 EAN: {puzzle.ean}</span>
                ) : (
                  <span className="ml-2 text-red-400/70">⚠️ EAN manquant</span>
                )}
              </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingPuzzle(puzzle)}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => setDeletingPuzzle(puzzle)}
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      <PuzzleEditModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        puzzle={null}
        onUpdate={loadPuzzles}
      />

      {/* Edit Modal */}
      {editingPuzzle && (
        <PuzzleEditModal
          open={!!editingPuzzle}
          onClose={() => setEditingPuzzle(null)}
          puzzle={editingPuzzle}
          onUpdate={loadPuzzles}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPuzzle} onOpenChange={() => setDeletingPuzzle(null)}>
        <AlertDialogContent className="bg-[#0a0a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le puzzle</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Êtes-vous sûr de vouloir supprimer "{deletingPuzzle?.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}