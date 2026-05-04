import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function CompletedPuzzlesSection({ user }) {
  const [puzzles, setPuzzles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPuzzles();
  }, [user]);

  const loadPuzzles = async () => {
    if (!user) return;
    
    try {
      const completedPuzzles = await base44.entities.CompletedPuzzle.filter(
        { created_by: user.email },
        '-created_date'
      );
      setPuzzles(completedPuzzles);
    } catch (error) {
      console.error('Error loading puzzles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPuzzles = puzzles.filter(puzzle => {
    const query = searchQuery.toLowerCase();
    return (
      puzzle.puzzle_name?.toLowerCase().includes(query) ||
      puzzle.puzzle_brand?.toLowerCase().includes(query) ||
      puzzle.puzzle_pieces?.toString().includes(query)
    );
  });

  if (isLoading) {
    return <p className="text-white/50 text-center py-8">Loading puzzles...</p>;
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, brand, or pieces..."
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
      </div>

      {/* Results Count */}
      <p className="text-white/50 text-sm mb-4">
        {filteredPuzzles.length} puzzle{filteredPuzzles.length !== 1 ? 's' : ''} found
      </p>

      {/* Puzzles Grid */}
      {filteredPuzzles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50">
            {searchQuery ? 'No puzzles match your search' : 'No completed puzzles yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPuzzles.map((puzzle, index) => (
            <motion.div
              key={puzzle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-orange-500/30 transition-colors"
            >
              {puzzle.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={puzzle.image_url}
                    alt={puzzle.puzzle_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="text-white font-semibold mb-1">{puzzle.puzzle_name}</h4>
                {puzzle.puzzle_brand && (
                  <p className="text-white/50 text-sm mb-2">{puzzle.puzzle_brand}</p>
                )}
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>{puzzle.puzzle_pieces} pieces</span>
                  {puzzle.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                      {puzzle.rating}
                    </span>
                  )}
                </div>
                {puzzle.created_date && (
                  <div className="flex items-center gap-1 text-xs text-white/30 mt-2">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(puzzle.created_date), { addSuffix: true })}
                  </div>
                )}
                {puzzle.notes && (
                  <p className="text-white/60 text-sm mt-2 line-clamp-2">{puzzle.notes}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}