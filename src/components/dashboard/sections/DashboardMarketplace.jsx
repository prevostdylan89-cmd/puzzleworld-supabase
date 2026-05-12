import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { ShoppingBag, RefreshCw, Trash2, Eye, Flag, Check, X, Loader2, Tag, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TYPE_LABELS = { vente: 'Vente', echange: 'Échange', don: 'Don' };
const TYPE_COLORS = { vente: 'text-orange-400 bg-orange-500/10', echange: 'text-blue-400 bg-blue-500/10', don: 'text-green-400 bg-green-500/10' };
const STATUS_COLORS = { active: 'text-green-400 bg-green-500/10', sold: 'text-white/40 bg-white/5', archived: 'text-red-400 bg-red-500/10', reserved: 'text-yellow-400 bg-yellow-500/10' };
const STATUS_LABELS = { active: 'Active', sold: 'Vendue', archived: 'Archivée', reserved: 'Réservée' };
const CONDITION_LABELS = { neuf: 'Neuf', excellent: 'Excellent', bon: 'Bon état', acceptable: 'Acceptable' };

export default function DashboardMarketplace() {
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [selectedListing, setSelectedListing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: listingsData }, { data: reportsData }] = await Promise.all([
        supabase.from('marketplace_listings').select('*').order('created_at', { ascending: false }),
        supabase.from('marketplace_reports').select('*, marketplace_listings(title, created_by)').order('created_at', { ascending: false })
      ]);
      setListings(listingsData || []);
      setReports(reportsData || []);
    } catch (e) {
      toast.error('Erreur de chargement');
    }
    setLoading(false);
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return;
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression'); return; }
    toast.success('Annonce supprimée');
    setSelectedListing(null);
    loadAll();
  };

  const changeStatus = async (id, status) => {
    await supabase.from('marketplace_listings').update({ status }).eq('id', id);
    toast.success(`Statut → ${STATUS_LABELS[status]}`);
    loadAll();
  };

  const resolveReport = async (reportId, action) => {
    await supabase.from('marketplace_reports').update({ status: action }).eq('id', reportId);
    if (action === 'resolved') toast.success('Signalement résolu');
    else toast.success('Signalement ignoré');
    loadAll();
  };

  const filteredListings = listings.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterType !== 'all' && l.transaction_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return l.title?.toLowerCase().includes(q) || l.created_by?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingReports = reports.filter(r => r.status === 'pending');

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Marketplace</h2>
          <p className="text-white/60">
            {listings.length} annonces au total · {listings.filter(l => l.status === 'active').length} actives
            {pendingReports.length > 0 && <span className="ml-2 text-red-400">· {pendingReports.length} signalement{pendingReports.length > 1 ? 's' : ''} en attente</span>}
          </p>
        </div>
        <Button onClick={loadAll} variant="outline" size="sm" className="border-white/10 text-white/60 hover:text-white gap-2">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white'}`}
        >
          Annonces ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'reports' ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white'}`}
        >
          Signalements
          {pendingReports.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingReports.length}</span>
          )}
        </button>
      </div>

      {/* Vue Annonces */}
      {activeTab === 'listings' && (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher titre, email, ville..."
              className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-xl text-sm flex-1 min-w-48 placeholder:text-white/30"
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-xl text-sm">
              <option value="all">Tous statuts</option>
              <option value="active">Active</option>
              <option value="sold">Vendue</option>
              <option value="archived">Archivée</option>
              <option value="reserved">Réservée</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-xl text-sm">
              <option value="all">Tous types</option>
              <option value="vente">Vente</option>
              <option value="echange">Échange</option>
              <option value="don">Don</option>
            </select>
          </div>

          {/* Tableau */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Annonce</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Vendeur</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Prix</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Statut</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map(listing => (
                    <tr key={listing.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            {listing.photos?.[0] || listing.puzzle_image ? (
                              <img src={listing.photos?.[0] || listing.puzzle_image} alt="" className="w-full h-full object-cover" />
                            ) : <ShoppingBag className="w-5 h-5 text-white/20 m-2.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate max-w-48">{listing.title}</p>
                            {listing.puzzle_brand && <p className="text-white/40 text-xs">{listing.puzzle_brand} {listing.puzzle_pieces && `· ${listing.puzzle_pieces} pcs`}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/60 text-xs max-w-32 truncate">{listing.created_by}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.transaction_type]}`}>
                          {TYPE_LABELS[listing.transaction_type]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/70 text-sm">
                        {listing.transaction_type === 'vente' && listing.price != null ? `${Number(listing.price).toFixed(2)} €` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[listing.status]}`}>
                          {STATUS_LABELS[listing.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/40 text-xs">
                        {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedListing(selectedListing?.id === listing.id ? null : listing)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            title="Détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredListings.length === 0 && (
                <p className="text-white/40 text-center py-12">Aucune annonce trouvée</p>
              )}
            </div>
          </div>

          {/* Panneau détail */}
          {selectedListing && (
            <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{selectedListing.title}</h3>
                <button onClick={() => setSelectedListing(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                <div><p className="text-white/40 text-xs mb-1">Vendeur</p><p className="text-white">{selectedListing.created_by}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Type</p><p className="text-white">{TYPE_LABELS[selectedListing.transaction_type]}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Prix</p><p className="text-white">{selectedListing.price != null ? `${selectedListing.price} €` : '—'}</p></div>
                <div><p className="text-white/40 text-xs mb-1">État</p><p className="text-white">{CONDITION_LABELS[selectedListing.condition]}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Pièces manquantes</p><p className="text-white">{selectedListing.pieces_missing || 0}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Ville</p><p className="text-white">{selectedListing.city || '—'}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Livraison</p><p className="text-white">{selectedListing.shipping_offered ? `Oui (+${selectedListing.shipping_price || 0} €)` : 'Non'}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Marque</p><p className="text-white">{selectedListing.puzzle_brand || '—'}</p></div>
                <div><p className="text-white/40 text-xs mb-1">Pièces</p><p className="text-white">{selectedListing.puzzle_pieces || '—'}</p></div>
              </div>
              {selectedListing.description && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-1">Description</p>
                  <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3">{selectedListing.description}</p>
                </div>
              )}
              {selectedListing.photos?.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-2">Photos</p>
                  <div className="flex gap-2">
                    {selectedListing.photos.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                </div>
              )}
              {/* Actions statut */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
                <p className="text-white/40 text-xs w-full mb-1">Changer le statut :</p>
                {['active', 'reserved', 'sold', 'archived'].map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(selectedListing.id, s)}
                    disabled={selectedListing.status === s}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 ${STATUS_COLORS[s]}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
                <button
                  onClick={() => deleteListing(selectedListing.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors ml-auto"
                >
                  Supprimer l'annonce
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vue Signalements */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Flag className="w-14 h-14 text-white/20 mx-auto mb-4" />
              <p className="text-white font-semibold">Aucun signalement</p>
            </div>
          ) : reports.map(report => (
            <div key={report.id} className={`bg-white/[0.03] border rounded-xl p-4 ${report.status === 'pending' ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === 'pending' ? 'text-red-400 bg-red-500/10' : report.status === 'resolved' ? 'text-green-400 bg-green-500/10' : 'text-white/40 bg-white/5'}`}>
                      {report.status === 'pending' ? '⚠️ En attente' : report.status === 'resolved' ? '✅ Résolu' : '⛔ Ignoré'}
                    </span>
                    <span className="text-white/40 text-xs">{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-white font-medium text-sm truncate">
                    Annonce : {report.marketplace_listings?.title || report.listing_id}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">Vendeur : {report.marketplace_listings?.created_by}</p>
                  <p className="text-white/60 text-xs mt-1">Signalé par : {report.reported_by}</p>
                  <p className="text-white/80 text-sm mt-2 bg-white/5 rounded-lg px-3 py-2">{report.reason}</p>
                </div>
                {report.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => resolveReport(report.id, 'resolved')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Résoudre
                    </button>
                    <button
                      onClick={() => resolveReport(report.id, 'dismissed')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg text-xs font-medium transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Ignorer
                    </button>
                    <button
                      onClick={() => deleteListing(report.listing_id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
