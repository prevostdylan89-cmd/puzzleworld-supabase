import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Loader2, Puzzle, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ExchangeSection({ user }) {
  const [exchangePuzzles, setExchangePuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    try {
      const puzzles = await base44.entities.UserPuzzle.filter({ 
        created_by: user.email, 
        status: 'cemetery' 
      });
      setExchangePuzzles(puzzles);
    } catch (error) {
      console.error('Error loading exchange puzzles:', error);
    } finally {
      setLoading(false);
    }
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

  if (exchangePuzzles.length === 0) {
    return (
      <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl">
        <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">Aucun puzzle à vendre ou échanger</p>
        <p className="text-white/30 text-sm mt-2">Les puzzles que vous n'avez pas aimés apparaîtront ici</p>
      </div>
    );
  }

  const sortedPuzzles = getSortedPuzzles(exchangePuzzles);

  return (
    <>
      <div className="flex justify-end mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Trier par
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0a0a2e] border-white/10">
            <DropdownMenuItem 
              onClick={() => setSortBy('date-desc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus récent)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('date-asc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'date-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Date (Plus ancien)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('pieces-asc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-asc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Croissant)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('pieces-desc')}
              className={`text-white cursor-pointer hover:bg-white/10 ${sortBy === 'pieces-desc' ? 'bg-orange-500/20' : ''}`}
            >
              Pièces (Décroissant)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedPuzzles.map((puzzle, index) => (
        <motion.div
          key={puzzle.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group"
        >
          <div className="aspect-square overflow-hidden bg-white/5 relative">
            {puzzle.image_url ? (
              <img
                src={puzzle.image_url}
                alt={puzzle.puzzle_name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Puzzle className="w-12 h-12 text-white/20" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
              À vendre
            </div>
          </div>
          <div className="p-3">
            <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
              {puzzle.puzzle_name}
            </h3>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{puzzle.puzzle_brand}</span>
              <span>{puzzle.puzzle_pieces} pcs</span>
            </div>
          </div>
        </motion.div>
      ))}
      </div>
    </>
  );
}