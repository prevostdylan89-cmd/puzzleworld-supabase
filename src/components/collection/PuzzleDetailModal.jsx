import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X, CheckCircle, Trophy, Package, Star } from 'lucide-react';
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
  const [user, setUser] = useState(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  // État des 3 boutons : null = non ajouté, sinon l'id de la ligne user_puzzles
  const [statusMap, setStatusMap] = useState({ wishlist: null, inbox: null, done: null });
  const [togglingStatus, setTogglingStatus] = useState(null); // quel bouton est en cours

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
    } else {
      setProductData(null);
      setStatusMap({ wishlist: null, inbox: null, done: null });
    }
  }, [open, puzzle]);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadCollectionStatus(currentUser.email);
    } catch {
      // non connecté
    }
  };

  // Vérifie si ce puzzle est déjà dans user_puzzles pour chaque statut
  const loadCollectionStatus = async (email) => {
    if (!puzzle) return;
    try {
      const newMap = { wishlist: null, inbox: null, done: null };
      let rows = [];

      // Requête 1 : par catalog_puzzle_id (le plus fiable)
      if (puzzle.id) {
        const { data } = await supabase
          .from('user_puzzles')
          .select('id, status')
          .eq('created_by', email)
          .eq('catalog_puzzle_id', puzzle.id);
        rows = data || [];
      }

      // Requête 2 : par puzzle_name si rien trouvé via catalog_puzzle_id
      if (rows.length === 0 && puzzle.title) {
        const { data } = await supabase
          .from('user_puzzles')
          .select('id, status')
          .eq('created_by', email)
          .eq('puzzle_name', puzzle.title);
        rows = data || [];
      }

      for (const row of rows) {
        if (row.status in newMap) newMap[row.status] = row.id;
      }
      setStatusMap(newMap);
    } catch (e) {
      console.error('loadCollectionStatus error:', e);
    }
  };

  const getAffiliateLink = () => {
    if (puzzle?.amazon_link) return puzzle.amazon_link;
    if (puzzle?.asin) return `https://www.amazon.fr/dp/${puzzle.asin}?tag=${AFFILIATE_TAG}`;
    return '#';
  };

  // Toggle : si déjà coché → supprime, sinon → insère
  const handleToggleStatus = async (status) => {
    if (!user) {
      toast.error(t('loginToAdd') || 'Connectez-vous pour ajouter à votre collection');
      return;
    }
    setTogglingStatus(status);

    try {
      const existingId = statusMap[status];

      if (existingId) {
        // Déjà dans la collection → on retire
        const { error } = await supabase
          .from('user_puzzles')
          .delete()
          .eq('id', existingId);
        if (error) throw error;

        setStatusMap(prev => ({ ...prev, [status]: null }));

        const labels = { wishlist: 'Wishlist', inbox: 'Dans sa boîte', done: 'Terminé' };
        toast.success(`Retiré de "${labels[status]}"`);
      } else {
        // Pas encore → on ajoute
        const { data: newRow, error } = await supabase
          .from('user_puzzles')
          .insert({
            created_by: user.email,
            catalog_puzzle_id: puzzle.id || null,
            puzzle_name: puzzle.title,
            puzzle_brand: puzzle.brand || null,
            puzzle_pieces: puzzle.piece_count || null,
            image_url: puzzle.image_hd || null,
            puzzle_reference: puzzle.asin || puzzle.ean || null,
            status,
            end_date: status === 'done' ? new Date().toISOString().split('T')[0] : null,
          })
          .select('id')
          .single();

        if (error) throw error;

        setStatusMap(prev => ({ ...prev, [status]: newRow.id }));

        // Mettre à jour les compteurs du catalogue
        if (puzzle.id) {
          const { data: cat } = await supabase
            .from('puzzle_catalog')
            .select('added_count, wishlistCount')
            .eq('id', puzzle.id)
            .single();
          if (cat) {
            const updates = { added_count: (cat.added_count || 0) + 1 };
            if (status === 'wishlist') updates.wishlistCount = (cat.wishlistCount || 0) + 1;
            await supabase.from('puzzle_catalog').update(updates).eq('id', puzzle.id);
          }
        }

        const toasts = {
          wishlist: '⭐ Ajouté à la Wishlist !',
          inbox: '📦 Ajouté dans "Dans sa boîte" !',
          done: '✅ Ajouté dans "Terminé" !',
        };
        toast.success(toasts[status]);
      }
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast.error('Erreur lors de la mise à jour de la collection');
    } finally {
      setTogglingStatus(null);
    }
  };

  if (!puzzle) return null;

  const isToggling = (s) => togglingStatus === s;

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

              {/* ── Boutons collection toggle ── */}
              <div>
                <p className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wide">
                  {user ? 'Ma collection' : 'Connectez-vous pour gérer votre collection'}
                </p>
                <div className="flex gap-3">
                  {/* Dans sa boîte */}
                  <button
                    onClick={() => handleToggleStatus('inbox')}
                    disabled={isToggling('inbox')}
                    className={`flex-1 h-11 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all
                      ${statusMap.inbox
                        ? 'border-blue-500 bg-blue-500/30 text-blue-300'
                        : 'border-blue-500/40 text-blue-300/70 hover:bg-blue-500/20 hover:border-blue-500'
                      }`}
                  >
                    {isToggling('inbox')
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : statusMap.inbox
                        ? <Package className="w-4 h-4 fill-current" />
                        : <Package className="w-4 h-4" />
                    }
                    {statusMap.inbox ? '✓ Dans sa boîte' : 'Dans sa boîte'}
                  </button>

                  {/* Terminé */}
                  <button
                    onClick={() => handleToggleStatus('done')}
                    disabled={isToggling('done')}
                    className={`flex-1 h-11 rounded-xl border-2 font-medium text-sm flex items-center justify-center gap-2 transition-all
                      ${statusMap.done
                        ? 'border-green-500 bg-green-500/30 text-green-300'
                        : 'border-green-500/40 text-green-300/70 hover:bg-green-500/20 hover:border-green-500'
                      }`}
                  >
                    {isToggling('done')
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trophy className="w-4 h-4" />
                    }
                    {statusMap.done ? '✓ Terminé' : 'Terminé'}
                  </button>
                </div>

                {/* Wishlist */}
                <button
                  onClick={() => handleToggleStatus('wishlist')}
                  disabled={isToggling('wishlist')}
                  className={`mt-3 w-full h-12 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all
                    ${statusMap.wishlist
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                      : 'border-white/20 text-white/70 hover:bg-white/5 hover:border-white/40'
                    }`}
                >
                  {isToggling('wishlist')
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Star className={`w-4 h-4 ${statusMap.wishlist ? 'fill-yellow-400' : ''}`} />
                  }
                  {statusMap.wishlist ? '⭐ Dans ma Wishlist' : 'Ajouter à la Wishlist'}
                </button>
              </div>

              {/* Lien Amazon */}
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
