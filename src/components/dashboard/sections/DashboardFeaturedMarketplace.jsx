import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShoppingBag, Plus, Trash2, GripVertical, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DashboardFeaturedMarketplace() {
  const [featured, setFeatured] = useState([]);   // fiches sélectionnées manuellement
  const [recent, setRecent] = useState([]);        // dernières annonces actives
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les fiches en vedette actuelles
      const { data: featuredData } = await supabase
        .from('featured_marketplace')
        .select('*, marketplace_listings(id, title, photos, puzzle_image, transaction_type, price, created_by)')
        .order('position', { ascending: true })
        .limit(10);

      // Charger les 50 dernières annonces actives pour la sélection
      const { data: recentData } = await supabase
        .from('marketplace_listings')
        .select('id, title, photos, puzzle_image, transaction_type, price, created_by, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      setFeatured((featuredData || []).map(f => f.marketplace_listings).filter(Boolean));
      setRecent(recentData || []);
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const addToFeatured = async (listing) => {
    if (featured.find(f => f.id === listing.id)) {
      toast.error('Cette annonce est déjà en vedette');
      return;
    }
    if (featured.length >= 10) {
      toast.error('Maximum 10 annonces en vedette');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('featured_marketplace').insert({
        listing_id: listing.id,
        position: featured.length,
      });
      if (error) throw error;
      setFeatured(prev => [...prev, listing]);
      toast.success('Annonce ajoutée en vedette');
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const removeFromFeatured = async (listingId) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('featured_marketplace').delete().eq('listing_id', listingId);
      if (error) throw error;
      setFeatured(prev => prev.filter(f => f.id !== listingId));
      toast.success('Annonce retirée');
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Vider toute la sélection manuelle ? (les dernières annonces seront affichées automatiquement)')) return;
    setSaving(true);
    try {
      await supabase.from('featured_marketplace').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setFeatured([]);
      toast.success('Sélection vidée — affichage automatique actif');
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecent = recent.filter(l =>
    !featured.find(f => f.id === l.id) &&
    (!search || l.title?.toLowerCase().includes(search.toLowerCase()))
  );

  const typeColor = (t) => t === 'vente' ? 'bg-orange-500/20 text-orange-400' : t === 'echange' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400';
  const typeLabel = (t) => t === 'vente' ? 'Vente' : t === 'echange' ? 'Échange' : 'Don';

  const ListingThumb = ({ listing, action, actionIcon, actionClass }) => (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
        {listing.photos?.[0] || listing.puzzle_image
          ? <img src={listing.photos?.[0] || listing.puzzle_image} alt="" className="w-full h-full object-cover" />
          : <ShoppingBag className="w-6 h-6 text-white/20 m-auto mt-3" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{listing.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${typeColor(listing.transaction_type)}`}>
            {typeLabel(listing.transaction_type)}
          </span>
          {listing.transaction_type === 'vente' && listing.price != null && (
            <span className="text-orange-400 text-xs font-bold">{Number(listing.price).toFixed(2)} €</span>
          )}
          <span className="text-white/30 text-[10px] truncate">{listing.created_by}</span>
        </div>
      </div>
      <button onClick={() => action(listing)} disabled={saving}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${actionClass}`}>
        {actionIcon}
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" /> Marketplace — Page d'accueil
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {featured.length === 0
              ? '⚡ Mode auto : les 10 dernières annonces sont affichées'
              : `${featured.length}/10 annonces sélectionnées manuellement`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="ghost" size="sm" className="text-white/50 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {featured.length > 0 && (
            <Button onClick={clearAll} size="sm" className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
              Vider (auto)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche : sélection actuelle */}
        <div>
          <h3 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
            ✅ En vedette ({featured.length}/10)
            {featured.length === 0 && <span className="text-white/30 font-normal">— affichage automatique</span>}
          </h3>
          {featured.length === 0 ? (
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
              Aucune sélection manuelle.<br />Les 10 dernières annonces actives s'affichent automatiquement.
            </div>
          ) : (
            <div className="space-y-2">
              {featured.map((listing) => (
                <ListingThumb
                  key={listing.id}
                  listing={listing}
                  action={(l) => removeFromFeatured(l.id)}
                  actionIcon={<Trash2 className="w-4 h-4" />}
                  actionClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
                />
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : annonces disponibles */}
        <div>
          <h3 className="text-white/70 text-sm font-semibold mb-3">📋 Dernières annonces actives</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/10 text-white pl-9"
            />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredRecent.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">Aucune annonce disponible</p>
            ) : (
              filteredRecent.map((listing) => (
                <ListingThumb
                  key={listing.id}
                  listing={listing}
                  action={addToFeatured}
                  actionIcon={<Plus className="w-4 h-4" />}
                  actionClass="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
