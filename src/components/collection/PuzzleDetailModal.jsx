import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, CheckCircle, Plus, Trophy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, base44 } from '@/api/supabaseClient';
import { useLanguage } from '@/components/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

const AFFILIATE_TAG = 'MON_PUZZLE_ID-21';

function ImageZoomOverlay({ src, alt, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center cursor-zoom-out"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
        onClick={onClose}
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={src}
        alt={alt}
        style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}

export default function PuzzleDetailModal({ open, onClose, puzzle }) {
  const { t } = useLanguage();
  const { isGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [addingStatus, setAddingStatus] = useState(null);

  useEffect(() => {
    if (open && puzzle) {
      loadUserData();
      setProductData({
        title: puzzle.title,
        brand: puzzle.brand,
        main_image: { link: puzzle.image_hd },
        feature_bullets: puzzle.description ? [puzzle.description] : [],
        link: puzzle.amazon_link,
        buybox_winner: puzzle.amazon_price ? {
          price: { value: puzzle.amazon_price, currency: '€' },
          availability: { type: 'in_stock' }
        } : null
      });
      checkWishlistStatus();
      setLoading(false);
    } else {
      setProductData(null);
      setIsWishlisted(false);
    }
  }, [open, puzzle]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const checkWishlistStatus = async () => {
    if (!puzzle?.asin) return;
    try {
      const currentUser = await base44.auth.me();
      const wishlists = await base44.entities.Wishlist.filter({
        puzzle_name: puzzle.title,
        created_by: currentUser.email
      });
      setIsWishlisted(wishlists.length > 0);
    } catch (error) {
      console.log('Error checking status:', error);
    }
  };

  const getAffiliateLink = () => {
    if (puzzle?.amazon_link) return puzzle.amazon_link;
    if (puzzle?.asin) return `https://www.amazon.fr/dp/${puzzle.asin}?tag=${AFFILIATE_TAG}`;
    return '#';
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error(t('loginToWishlist'));
      return;
    }
    try {
      if (isWishlisted) {
        const wishlists = await base44.entities.Wishlist.filter({
          puzzle_name: puzzle.title,
          created_by: user.email
        });
        if (wishlists.length > 0) {
          await base44.entities.Wishlist.delete(wishlists[0].id);
          setIsWishlisted(false);
          toast.success(t('puzzleRemovedFromWishlist'));
        }
      } else {
        await base44.entities.Wishlist.create({
          puzzle_name: puzzle.title,
          puzzle_brand: puzzle.brand,
          puzzle_pieces: puzzle.piece_count,
          image: puzzle.image_hd,
          priority: 'medium'
        });
        setIsWishlisted(true);
        toast.success(t('puzzleAddedToWishlist'));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(t('wishlistUpdateFailed'));
    }
  };

  const handleAddToCollection = async (status) => {
    if (!user) {
      toast.error(t('loginToAdd'));
      return;
    }
    setAddingStatus(status);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Utilisateur non connecté');
        setAddingStatus(null);
        return;
      }

      const { error } = await supabase.from('user_puzzles').insert({
        user_id: authUser.id,
        created_by: authUser.email,
        catalog_puzzle_id: puzzle.id || null,
        puzzle_name: puzzle.title,
        puzzle_brand: puzzle.brand || null,
        puzzle_pieces: puzzle.piece_count || null,
        image_url: puzzle.image_hd || null,
        puzzle_reference: puzzle.asin || puzzle.ean || null,
        amazon_link: puzzle.amazon_link || null,
        status,
        end_date: status === 'done' ? new Date().toISOString().split('T')[0] : null,
      });

      if (error) throw error;

      if (status === 'inbox') {
        toast.success('📦 Ajouté dans "Dans sa boîte" !');
      } else if (status === 'done') {
        toast.success('✅ Ajouté dans "Terminé" !');
      }
    } catch (error) {
      console.error('Erreur ajout collection:', error);
      toast.error('Erreur lors de l\'ajout à la collection');
    }
    setAddingStatus(null);
  };

  if (!puzzle) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          </div>
        ) : productData ? (
          <>
            <div className="relative w-full bg-white/5 cursor-zoom-in" onClick={() => setShowImageZoom(true)}>
              <img
                src={productData.main_image?.link || puzzle.image_hd}
                alt={productData.title}
                className="w-full h-80 object-contain"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 text-xs text-white/70 flex items-center gap-1">
                <span>🔍</span> Agrandir
              </div>
            </div>

            {showImageZoom && (
              <ImageZoomOverlay
                src={productData.main_image?.link || puzzle.image_hd}
                alt={productData.title}
                onClose={() => setShowImageZoom(false)}
              />
            )}

            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {productData.title || puzzle.title}
                </h2>
                {productData.brand && (
                  <p className="text-orange-400 font-semibold">
                    {t('byBrand')}{productData.brand}
                  </p>
                )}
              </div>

              {puzzle.piece_count && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-2xl">🧩</span>
                  <span className="text-white font-semibold">{puzzle.piece_count} {t('puzzlePiecesCount')}</span>
                </div>
              )}

              {productData.feature_bullets && productData.feature_bullets.length > 0 && (
                <div>
                  <h3 className="text-white/70 font-semibold mb-3">{t('features')}</h3>
                  <ul className="space-y-2">
                    {productData.feature_bullets.slice(0, 5).map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2 text-white/80 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wide">Ajouter à ma collection</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleAddToCollection('inbox')}
                    disabled={addingStatus !== null}
                    variant="outline"
                    className="flex-1 h-11 border-2 border-blue-500/40 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500"
                  >
                    {addingStatus === 'inbox' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                    Dans sa boîte
                  </Button>
                  <Button
                    onClick={() => handleAddToCollection('done')}
                    disabled={addingStatus !== null}
                    variant="outline"
                    className="flex-1 h-11 border-2 border-green-500/40 text-green-300 hover:bg-green-500/20 hover:border-green-500"
                  >
                    {addingStatus === 'done' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                    Terminé
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleWishlist}
                variant="outline"
                className={`w-full h-12 border-2 transition-all ${
                  isWishlisted
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/30'
                    : 'border-white/20 text-white hover:bg-white/5'
                }`}
              >
                ⭐ {isWishlisted ? t('wishlist') : 'Ajouter à la Wishlist'}
              </Button>

              <Button
                onClick={() => window.open(getAffiliateLink(), '_blank')}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-12 text-lg font-semibold"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {t('viewOnAmazon')}
              </Button>

              <p className="text-white/40 text-xs text-center">
                {t('amazonDisclaimer')}
              </p>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-white/60">{t('loadError')}</p>
            <Button onClick={onClose} variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/5">
              {t('close')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}