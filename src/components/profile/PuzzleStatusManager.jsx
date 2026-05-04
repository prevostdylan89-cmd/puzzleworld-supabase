import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Package, 
  Play, 
  CheckCircle, 
  Trash2,
  Plus,
  ArrowRight,
  Calendar,
  Camera,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PuzzleStatusManager({ user }) {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('wishlist');

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const allPuzzles = await base44.entities.UserPuzzle.filter({ 
        created_by: user.email 
      });
      setPuzzles(allPuzzles);
    } catch (error) {
      console.error('Error loading puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'text-pink-400' },
    { id: 'inbox', label: 'Dans la Boîte', icon: Package, color: 'text-blue-400' },
    { id: 'in_progress', label: 'Sur la Table', icon: Play, color: 'text-orange-400' },
    { id: 'done', label: 'Terminé', icon: CheckCircle, color: 'text-green-400' },
    { id: 'cemetery', label: 'Cimetière / Troc', icon: Trash2, color: 'text-gray-400' }
  ];

  const getPuzzlesByStatus = (status) => {
    return puzzles.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 whitespace-nowrap ${
              activeSection === section.id
                ? 'bg-orange-500 text-white'
                : 'border-white/20 text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'text-white' : section.color}`} />
            {section.label}
            <Badge className="bg-white/10 text-white border-0">
              {getPuzzlesByStatus(section.id).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Add Puzzle Button */}
      <AddPuzzleDialog onAdd={loadPuzzles} defaultStatus={activeSection} />

      {/* Active Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <PuzzleSection
            status={activeSection}
            puzzles={getPuzzlesByStatus(activeSection)}
            onUpdate={loadPuzzles}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PuzzleSection({ status, puzzles, onUpdate }) {
  if (puzzles.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
        <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">Aucun puzzle dans cette section</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {puzzles.map((puzzle) => (
        <PuzzleCard 
          key={puzzle.id} 
          puzzle={puzzle} 
          onUpdate={onUpdate}
          readOnly={status === 'cemetery'}
        />
      ))}
    </div>
  );
}

function PuzzleCard({ puzzle, onUpdate, readOnly }) {
  const [showActions, setShowActions] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getDifficultyLevel = (pieces) => {
    if (!pieces) return 'unknown';
    if (pieces <= 500) return 'easy';
    if (pieces <= 1000) return 'medium';
    if (pieces <= 2000) return 'hard';
    return 'expert';
  };

  const moveToStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'in_progress' && !puzzle.start_date) {
        updateData.start_date = new Date().toISOString().split('T')[0];
      }
      
      if (newStatus === 'done' && !puzzle.end_date) {
        updateData.end_date = new Date().toISOString().split('T')[0];
      }
      
      if (newStatus === 'cemetery' && !puzzle.cemetery_date) {
        updateData.cemetery_date = new Date().toISOString().split('T')[0];
      }

      await base44.entities.UserPuzzle.update(puzzle.id, updateData);

      // Track puzzle completion in Google Analytics via GTM
      if (newStatus === 'done') {
        const difficulty = getDifficultyLevel(puzzle.puzzle_pieces);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'puzzle_completed',
          puzzle_name: puzzle.puzzle_name,
          puzzle_brand: puzzle.puzzle_brand || 'unknown',
          puzzle_pieces: puzzle.puzzle_pieces,
          difficulty_level: difficulty,
        });
      }

      toast.success('Statut mis à jour');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableActions = () => {
    switch (puzzle.status) {
      case 'wishlist':
        return [{ label: 'Ajouter à ma boîte', status: 'inbox' }];
      case 'inbox':
        return [
          { label: 'Commencer', status: 'in_progress' },
          { label: 'Vendre/Échanger', status: 'cemetery' }
        ];
      case 'in_progress':
        return [
          { label: 'Marquer terminé', status: 'done' },
          { label: 'Remettre dans la boîte', status: 'inbox' }
        ];
      case 'done':
        return [{ label: 'Vendre/Échanger', status: 'cemetery' }];
      default:
        return [];
    }
  };

  return (
    <motion.div
      layout
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all"
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-white/5 relative">
        {puzzle.progress_photo || puzzle.image_url ? (
          <img
            src={puzzle.progress_photo || puzzle.image_url}
            alt={puzzle.puzzle_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {puzzle.status === 'cemetery' && (
          <div className="absolute top-2 right-2">
            <Badge className={`${
              puzzle.cemetery_type === 'sold' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-blue-500/90 text-white'
            }`}>
              {puzzle.cemetery_type === 'sold' ? 'Vendu' : 'Échangé'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="text-white font-semibold mb-1 line-clamp-1">
          {puzzle.puzzle_name}
        </h4>
        <p className="text-white/50 text-sm mb-2">
          {puzzle.puzzle_brand} • {puzzle.puzzle_pieces} pcs
        </p>

        {/* Dates */}
        {puzzle.start_date && (
          <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            Début: {format(new Date(puzzle.start_date), 'dd MMM yyyy', { locale: fr })}
          </p>
        )}
        {puzzle.end_date && (
          <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3" />
            Fin: {format(new Date(puzzle.end_date), 'dd MMM yyyy', { locale: fr })}
          </p>
        )}
        {puzzle.cemetery_date && (
          <p className="text-white/40 text-xs flex items-center gap-1 mb-2">
            <Calendar className="w-3 h-3" />
            Sorti: {format(new Date(puzzle.cemetery_date), 'dd MMM yyyy', { locale: fr })}
          </p>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="flex gap-2 mt-3">
            {getAvailableActions().map((action) => (
              <Button
                key={action.status}
                onClick={() => moveToStatus(action.status)}
                disabled={updating}
                size="sm"
                className="flex-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs"
              >
                {action.label}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ))}
            {puzzle.status === 'in_progress' && (
              <UpdateProgressDialog puzzle={puzzle} onUpdate={onUpdate} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AddPuzzleDialog({ onAdd, defaultStatus }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    puzzle_name: '',
    puzzle_brand: '',
    puzzle_pieces: '',
    puzzle_reference: '',
    image_url: '',
    status: defaultStatus
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await base44.entities.UserPuzzle.create({
        ...formData,
        puzzle_pieces: parseInt(formData.puzzle_pieces)
      });
      
      toast.success('Puzzle ajouté');
      setOpen(false);
      setFormData({ puzzle_name: '', puzzle_brand: '', puzzle_pieces: '', puzzle_reference: '', image_url: '', status: defaultStatus });
      onAdd();
    } catch (error) {
      console.error('Error adding puzzle:', error);
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un puzzle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Ajouter un puzzle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nom du puzzle"
            value={formData.puzzle_name}
            onChange={(e) => setFormData({...formData, puzzle_name: e.target.value})}
            required
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Marque"
            value={formData.puzzle_brand}
            onChange={(e) => setFormData({...formData, puzzle_brand: e.target.value})}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            type="number"
            placeholder="Nombre de pièces"
            value={formData.puzzle_pieces}
            onChange={(e) => setFormData({...formData, puzzle_pieces: e.target.value})}
            required
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Référence"
            value={formData.puzzle_reference}
            onChange={(e) => setFormData({...formData, puzzle_reference: e.target.value})}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="URL de l'image"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            className="bg-white/5 border-white/10 text-white"
          />
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a2e] border-white/10">
              <SelectItem value="wishlist" className="text-white">Wishlist</SelectItem>
              <SelectItem value="inbox" className="text-white">Dans la Boîte</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateProgressDialog({ puzzle, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(puzzle.progress_photo || '');

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await base44.entities.UserPuzzle.update(puzzle.id, {
        progress_photo: photoUrl
      });
      toast.success('Photo mise à jour');
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
          <Camera className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Mettre à jour la progression</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="URL de la photo"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
          <Button onClick={handleUpdate} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}