import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Puzzle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PuzzleDetailModal from './PuzzleDetailModal';

export default function CommunityPuzzleCard({ puzzle, showAffiliateLink = false }) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const amazonAffiliateLink = puzzle.asin 
    ? `https://www.amazon.fr/dp/${puzzle.asin}?tag=VOTRE_TAG`
    : null;

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden hover:border-orange-500/30 transition-all group cursor-pointer"
      >
        <div 
          onClick={() => setShowDetailModal(true)}
          className="aspect-square overflow-hidden bg-white/5"
        >
          {puzzle.image_hd ? (
            <img
              src={puzzle.image_hd}
              alt={puzzle.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Puzzle className="w-12 h-12 text-white/20" />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
            {puzzle.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span>{puzzle.brand || 'Unknown'}</span>
            <span>{puzzle.piece_count} pcs</span>
          </div>
          
          {/* Amazon Rating */}
          {puzzle.amazon_rating && (
            <div className="flex items-center gap-1 text-xs text-yellow-400 mb-1">
              <span>⭐ {puzzle.amazon_rating.toFixed(1)}</span>
              {puzzle.amazon_ratings_total > 0 && (
                <span className="text-white/40">({puzzle.amazon_ratings_total})</span>
              )}
            </div>
          )}
          
          {puzzle.wishlistCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-400/80 mb-2">
              <span>⭐ {puzzle.wishlistCount}</span>
            </div>
          )}
          {showAffiliateLink && amazonAffiliateLink && (
            <a 
              href={amazonAffiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                size="sm" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs h-7"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Voir sur Amazon
              </Button>
            </a>
          )}
        </div>
      </motion.div>

      <PuzzleDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        puzzle={puzzle}
      />
    </>
  );
}