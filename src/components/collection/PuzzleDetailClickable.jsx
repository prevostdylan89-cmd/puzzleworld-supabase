import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Heart, Bookmark, BookmarkCheck, Package, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PuzzleDetailClickable({ puzzleReference, onClose }) {
  const [puzzle, setPuzzle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (puzzleReference) {
      loadPuzzleData();
      loadUser();
    }
  }, [puzzleReference]);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const loadPuzzleData = async () => {
    setIsLoading(true);
    try {
      // Search in PuzzleCatalog by ASIN
      const puzzles = await base44.entities.PuzzleCatalog.filter({
        asin: puzzleReference
      });

      if (puzzles.length > 0) {
        setPuzzle(puzzles[0]);
        checkUserActions(puzzles[0]);
      } else {
        toast.error('Puzzle introuvable dans le catalogue');
      }
    } catch (error) {
      console.error('Error loading puzzle:', error);
      toast.error('Erreur lors du chargement du puzzle');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserActions = async (puzzleData) => {
    if (!user) return;

    try {
      const [likes, wishlist] = await Promise.all([
        base44.entities.UserPuzzleLike.filter({
          puzzle_asin: puzzleData.asin,
          created_by: user.email
        }),
        base44.entities.UserPuzzle.filter({
          puzzle_reference: puzzleData.asin,
          created_by: user.email,
          status: 'wishlist'
        })
      ]);

      setIsLiked(likes.length > 0);
      setIsInWishlist(wishlist.length > 0);
    } catch (error) {
      console.error('Error checking user actions:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Connectez-vous pour liker');
      return;
    }

    try {
      if (isLiked) {
        const likes = await base44.entities.UserPuzzleLike.filter({
          puzzle_asin: puzzle.asin,
          created_by: user.email
        });
        if (likes.length > 0) {
          await base44.entities.UserPuzzleLike.delete(likes[0].id);
          await base44.entities.PuzzleCatalog.update(puzzle.id, {
            total_likes: Math.max(0, (puzzle.total_likes || 0) - 1)
          });
          setIsLiked(false);
          toast.success('Like retiré');
        }
      } else {
        await base44.entities.UserPuzzleLike.create({
          puzzle_asin: puzzle.asin,
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand || '',
          puzzle_pieces: puzzle.piece_count || 0,
          puzzle_image: puzzle.image_hd || ''
        });
        await base44.entities.PuzzleCatalog.update(puzzle.id, {
          total_likes: (puzzle.total_likes || 0) + 1
        });
        setIsLiked(true);
        toast.success('Puzzle liké!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur');
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter à la wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        const wishlist = await base44.entities.UserPuzzle.filter({
          puzzle_reference: puzzle.asin,
          created_by: user.email,
          status: 'wishlist'
        });
        if (wishlist.length > 0) {
          await base44.entities.UserPuzzle.delete(wishlist[0].id);
          await base44.entities.PuzzleCatalog.update(puzzle.id, {
            wishlistCount: Math.max(0, (puzzle.wishlistCount || 0) - 1)
          });
          setIsInWishlist(false);
          toast.success('Retiré de la wishlist');
        }
      } else {
        await base44.entities.UserPuzzle.create({
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand || '',
          puzzle_pieces: puzzle.piece_count || 0,
          puzzle_reference: puzzle.asin,
          image_url: puzzle.image_hd || '',
          status: 'wishlist'
        });
        await base44.entities.PuzzleCatalog.update(puzzle.id, {
          wishlistCount: (puzzle.wishlistCount || 0) + 1
        });
        setIsInWishlist(true);
        toast.success('Ajouté à la wishlist!');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error('Erreur');
    }
  };

  if (!puzzleReference) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a2e] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Détails du puzzle</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : puzzle ? (
            <div className="space-y-6">
              {/* Image */}
              {puzzle.image_hd && (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                  <img
                    src={puzzle.image_hd}
                    alt={puzzle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Brand */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{puzzle.title}</h3>
                {puzzle.brand && (
                  <p className="text-orange-400 font-medium">{puzzle.brand}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-orange-400" />
                    <span className="text-white/60 text-sm">Pièces</span>
                  </div>
                  <p className="text-white text-xl font-bold">{puzzle.piece_count}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-white/60 text-sm">Popularité</span>
                  </div>
                  <p className="text-white text-xl font-bold">{puzzle.socialScore || 0}</p>
                </div>
              </div>

              {/* Category */}
              {puzzle.category_tag && (
                <div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {puzzle.category_tag}
                  </Badge>
                </div>
              )}

              {/* Description */}
              {puzzle.description && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Description</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{puzzle.description}</p>
                </div>
              )}

              {/* Amazon Info */}
              {puzzle.amazon_rating && (
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-sm">Note Amazon</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold">{puzzle.amazon_rating}/5</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">
                    {puzzle.amazon_ratings_total} avis
                  </p>
                </div>
              )}

              {/* Actions */}
              {user && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleLike}
                    className={`flex-1 ${
                      isLiked
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-green-400' : ''}`} />
                    {isLiked ? 'Liké' : 'J\'aime'}
                  </Button>
                  <Button
                    onClick={handleWishlist}
                    className={`flex-1 ${
                      isInWishlist
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {isInWishlist ? (
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                    ) : (
                      <Bookmark className="w-4 h-4 mr-2" />
                    )}
                    {isInWishlist ? 'Dans la wishlist' : 'Wishlist'}
                  </Button>
                </div>
              )}

              {/* Amazon Link */}
              {puzzle.amazon_link && (
                <Button
                  onClick={() => window.open(puzzle.amazon_link, '_blank')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Voir sur Amazon
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-white/60">
              Puzzle introuvable
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}