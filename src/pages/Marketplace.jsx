import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import {
  ShoppingBag, Plus, Search, Filter, Heart, MessageCircle, Eye,
  X, Upload, ChevronLeft, ChevronRight, Send, ArrowLeft, Flag,
  Package, RefreshCw, Gift, MapPin, Truck, Tag, Star, Loader2,
  Check, Trash2, Edit3, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABELS = { neuf: 'Neuf', excellent: 'Excellent', bon: 'Bon état', acceptable: 'Acceptable' };
const CONDITION_COLORS = { neuf: 'text-green-400 bg-green-500/10', excellent: 'text-blue-400 bg-blue-500/10', bon: 'text-orange-400 bg-orange-500/10', acceptable: 'text-red-400 bg-red-500/10' };
const TYPE_LABELS = { vente: 'Vente', echange: 'Échange', don: 'Don' };
const TYPE_COLORS = { vente: 'text-orange-400 bg-orange-500/10', echange: 'text-blue-400 bg-blue-500/10', don: 'text-green-400 bg-green-500/10' };
const TYPE_ICONS = { vente: Tag, echange: RefreshCw, don: Gift };

const uploadPhoto = async (file, userEmail) => {
  const ext = file.name.split('.').pop();
  const path = `${userEmail}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('marketplace').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(data.path);
  return urlData.publicUrl;
};

const getInitials = (email) => email?.slice(0, 2).toUpperCase() || '??';

// ─── Composant carte annonce ───────────────────────────────────────────────────

function ListingCard({ listing, currentUser, onOpen, onFavorite, isFavorite }) {
  const TypeIcon = TYPE_ICONS[listing.transaction_type] || Tag;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(listing)}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/30 hover:bg-white/8 transition-all group"
    >
      {/* Photo */}
      <div className="aspect-square bg-white/5 relative overflow-hidden">
        {listing.photos?.[0] ? (
          <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : listing.puzzle_image ? (
          <img src={listing.puzzle_image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-white/20" />
          </div>
        )}
        {/* Badge type */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[listing.transaction_type]}`}>
          <TypeIcon className="w-3 h-3" />
          {TYPE_LABELS[listing.transaction_type]}
        </div>
        {/* Favori */}
        {currentUser && listing.created_by !== currentUser.email && (
          <button
            onClick={e => { e.stopPropagation(); onFavorite(listing.id); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isFavorite ? 'bg-red-500 text-white' : 'bg-black/40 text-white/60 hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      {/* Infos */}
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
        {listing.puzzle_brand && <p className="text-white/40 text-xs truncate">{listing.puzzle_brand} {listing.puzzle_pieces && `• ${listing.puzzle_pieces} pcs`}</p>}
        <div className="flex items-center justify-between mt-2">
          <div>
            {listing.transaction_type === 'vente' && listing.price != null ? (
              <span className="text-orange-400 font-bold">{Number(listing.price).toFixed(2)} €</span>
            ) : listing.transaction_type === 'don' ? (
              <span className="text-green-400 font-bold">Gratuit</span>
            ) : (
              <span className="text-blue-400 font-bold">Échange</span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
            {CONDITION_LABELS[listing.condition]}
          </span>
        </div>
        {listing.city && (
          <div className="flex items-center gap-1 mt-1.5 text-white/40 text-xs">
            <MapPin className="w-3 h-3" />
            {listing.city}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Modal détail annonce ──────────────────────────────────────────────────────

function ListingModal({ listing, currentUser, onClose, onContact, onReport, isFavorite, onFavorite }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sellerProfile, setSellerProfile] = useState(null);
  const allPhotos = listing.photos?.length > 0 ? listing.photos : listing.puzzle_image ? [listing.puzzle_image] : [];
  const TypeIcon = TYPE_ICONS[listing.transaction_type] || Tag;
  const isOwn = currentUser?.email === listing.created_by;

  useEffect(() => {
    supabase.from('user_profiles').select('display_name, profile_photo').eq('created_by', listing.created_by).single()
      .then(({ data }) => setSellerProfile(data));
  }, [listing.created_by]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-[#0a0a2e] border border-white/10 rounded-t-3xl lg:rounded-2xl w-full lg:max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a2e]/95 backdrop-blur-sm flex items-center justify-between p-4 border-b border-white/10 z-10">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {currentUser && !isOwn && (
              <button onClick={() => onFavorite(listing.id)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/5 text-white/60 hover:text-red-400'}`}>
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            {currentUser && !isOwn && (
              <button onClick={() => onReport(listing.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-red-400">
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Photos */}
        {allPhotos.length > 0 && (
          <div className="relative aspect-video bg-black/20">
            <img src={allPhotos[photoIndex]} alt="" className="w-full h-full object-contain" />
            {allPhotos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(i => (i - 1 + allPhotos.length) % allPhotos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => setPhotoIndex(i => (i + 1) % allPhotos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, i) => (
                    <div key={i} onClick={() => setPhotoIndex(i)} className={`w-2 h-2 rounded-full cursor-pointer ${i === photoIndex ? 'bg-orange-400' : 'bg-white/30'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Titre + badges */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[listing.transaction_type]}`}>
                <TypeIcon className="w-3 h-3" />{TYPE_LABELS[listing.transaction_type]}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${CONDITION_COLORS[listing.condition]}`}>
                {CONDITION_LABELS[listing.condition]}
              </span>
              {listing.pieces_missing > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-yellow-400 bg-yellow-500/10">
                  {listing.pieces_missing} pièce{listing.pieces_missing > 1 ? 's' : ''} manquante{listing.pieces_missing > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{listing.title}</h2>
            {listing.puzzle_brand && <p className="text-white/50 text-sm mt-0.5">{listing.puzzle_brand}{listing.puzzle_pieces && ` • ${listing.puzzle_pieces} pièces`}</p>}
          </div>

          {/* Prix */}
          <div className="text-2xl font-bold">
            {listing.transaction_type === 'vente' && listing.price != null ? (
              <span className="text-orange-400">{Number(listing.price).toFixed(2)} €</span>
            ) : listing.transaction_type === 'don' ? (
              <span className="text-green-400">Gratuit 🎁</span>
            ) : (
              <span className="text-blue-400">Échange 🔄</span>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Échange souhaité */}
          {listing.transaction_type === 'echange' && listing.exchange_wants && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 text-xs font-semibold mb-1">Recherche en échange :</p>
              <p className="text-white/80 text-sm">{listing.exchange_wants}</p>
            </div>
          )}

          {/* Livraison */}
          <div className="flex items-center gap-2 text-sm">
            <Truck className={`w-4 h-4 ${listing.shipping_offered ? 'text-green-400' : 'text-white/30'}`} />
            {listing.shipping_offered ? (
              <span className="text-green-400">
                Livraison possible {listing.shipping_price > 0 ? `(+${Number(listing.shipping_price).toFixed(2)} €)` : '(incluse)'}
              </span>
            ) : (
              <span className="text-white/40">Remise en main propre uniquement</span>
            )}
            {listing.city && (
              <>
                <span className="text-white/20">•</span>
                <MapPin className="w-4 h-4 text-white/40" />
                <span className="text-white/40">{listing.city}</span>
              </>
            )}
          </div>

          {/* Vendeur */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
              {sellerProfile?.profile_photo ? (
                <img src={sellerProfile.profile_photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm">
                  {getInitials(listing.created_by)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">{sellerProfile?.display_name || listing.created_by}</p>
              <p className="text-white/40 text-xs">Vendeur</p>
            </div>
          </div>

          {/* Bouton contacter */}
          {currentUser && !isOwn && (
            <button
              onClick={() => onContact(listing)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Contacter le vendeur
            </button>
          )}
          {!currentUser && (
            <div className="text-center text-white/40 text-sm py-2">Connectez-vous pour contacter le vendeur</div>
          )}
          {isOwn && (
            <div className="text-center text-white/40 text-sm py-2 bg-white/5 rounded-xl">C'est votre annonce</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal messagerie ──────────────────────────────────────────────────────────

function MessageModal({ listing, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const receiverEmail = listing.created_by;
  const conversationId = [currentUser.email, receiverEmail].sort().join('__listing__') + `__${listing.id}`;

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase.from('marketplace_messages')
      .select('*').eq('listing_id', listing.id)
      .or(`sender_email.eq.${currentUser.email},receiver_email.eq.${currentUser.email}`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    // Marquer comme lus
    await supabase.from('marketplace_messages')
      .update({ is_read: true })
      .eq('listing_id', listing.id).eq('receiver_email', currentUser.email).eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await supabase.from('marketplace_messages').insert({
      listing_id: listing.id,
      sender_email: currentUser.email,
      receiver_email: receiverEmail,
      content: newMessage.trim()
    });
    setNewMessage('');
    setSending(false);
    loadMessages();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end lg:items-center justify-center p-0 lg:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a2e] border border-white/10 rounded-t-3xl lg:rounded-2xl w-full lg:max-w-lg flex flex-col"
        style={{ height: '80vh' }}
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
            <p className="text-white/40 text-xs">Message au vendeur</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Démarrez la conversation</p>
            </div>
          )}
          {messages.map(msg => {
            const isMine = msg.sender_email === currentUser.email;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-4 py-2 rounded-2xl ${isMine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex-shrink-0 p-4 border-t border-white/10 flex gap-2">
          <Input
            placeholder="Votre message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="bg-white/5 border-white/20 text-white flex-1"
            style={{ fontSize: '16px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Formulaire nouvelle annonce ───────────────────────────────────────────────

function NewListingForm({ currentUser, onClose, onSuccess, editListing = null }) {
  const [form, setForm] = useState({
    title: editListing?.title || '',
    description: editListing?.description || '',
    transaction_type: editListing?.transaction_type || 'vente',
    price: editListing?.price || '',
    condition: editListing?.condition || 'bon',
    pieces_missing: editListing?.pieces_missing || 0,
    city: editListing?.city || '',
    shipping_offered: editListing?.shipping_offered || false,
    shipping_price: editListing?.shipping_price || '',
    exchange_wants: editListing?.exchange_wants || '',
    puzzle_name: editListing?.puzzle_name || '',
    puzzle_brand: editListing?.puzzle_brand || '',
    puzzle_pieces: editListing?.puzzle_pieces || ''
  });
  const [photos, setPhotos] = useState(editListing?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - photos.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadPhoto(f, currentUser.email)));
      setPhotos(p => [...p, ...urls]);
    } catch { toast.error('Erreur upload photo'); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Le titre est obligatoire');
    if (form.transaction_type === 'vente' && !form.price) return toast.error('Indiquez un prix');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        transaction_type: form.transaction_type,
        price: form.transaction_type === 'vente' ? parseFloat(form.price) : null,
        condition: form.condition,
        pieces_missing: parseInt(form.pieces_missing) || 0,
        city: form.city.trim() || null,
        shipping_offered: form.shipping_offered,
        shipping_price: form.shipping_offered && form.shipping_price ? parseFloat(form.shipping_price) : null,
        exchange_wants: form.exchange_wants.trim() || null,
        puzzle_name: form.puzzle_name.trim() || null,
        puzzle_brand: form.puzzle_brand.trim() || null,
        puzzle_pieces: form.puzzle_pieces ? parseInt(form.puzzle_pieces) : null,
        photos: photos,
        updated_at: new Date().toISOString()
      };
      if (editListing) {
        const { error } = await supabase.from('marketplace_listings').update(payload).eq('id', editListing.id);
        if (error) throw error;
        toast.success('Annonce modifiée !');
      } else {
        const { error } = await supabase.from('marketplace_listings').insert({ ...payload, created_by: currentUser.email });
        if (error) throw error;
        toast.success('Annonce publiée !');
      }
      onSuccess();
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setSaving(false);
  };

  const inputCls = "bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-orange-500/50";
  const labelCls = "text-white/60 text-xs font-medium mb-1 block";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Retour</span>
        </button>
        <h2 className="text-white font-bold text-lg">Nouvelle annonce</h2>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Publier
        </button>
      </div>

      <div className="space-y-5">
          {/* Type transaction */}
          <div>
            <label className={labelCls}>Type d'annonce *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'vente', label: 'Vente', icon: Tag, color: 'orange' },
                { key: 'echange', label: 'Échange', icon: RefreshCw, color: 'blue' },
                { key: 'don', label: 'Don', icon: Gift, color: 'green' },
              ].map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, transaction_type: key }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-sm font-medium ${form.transaction_type === key
                    ? `border-${color}-500/50 bg-${color}-500/10 text-${color}-400`
                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className={labelCls}>Titre de l'annonce *</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Puzzle Ravensburger 1000 pièces" className={inputCls} />
          </div>

          {/* Infos puzzle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Marque</label>
              <Input value={form.puzzle_brand} onChange={e => setForm(f => ({ ...f, puzzle_brand: e.target.value }))} placeholder="Ravensburger..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nombre de pièces</label>
              <Input type="number" value={form.puzzle_pieces} onChange={e => setForm(f => ({ ...f, puzzle_pieces: e.target.value }))} placeholder="1000" className={inputCls} />
            </div>
          </div>

          {/* Prix (si vente) */}
          {form.transaction_type === 'vente' && (
            <div>
              <label className={labelCls}>Prix (€) *</label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className={inputCls} />
            </div>
          )}

          {/* Échange souhaité */}
          {form.transaction_type === 'echange' && (
            <div>
              <label className={labelCls}>Ce que vous recherchez en échange</label>
              <Input value={form.exchange_wants} onChange={e => setForm(f => ({ ...f, exchange_wants: e.target.value }))} placeholder="Ex: puzzles 500 pièces paysages..." className={inputCls} />
            </div>
          )}

          {/* État */}
          <div>
            <label className={labelCls}>État *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, condition: key }))}
                  className={`p-2 rounded-xl border text-sm font-medium transition-all ${form.condition === key ? `${CONDITION_COLORS[key]} border-current/30` : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pièces manquantes */}
          <div>
            <label className={labelCls}>Pièces manquantes</label>
            <Input type="number" min="0" value={form.pieces_missing} onChange={e => setForm(f => ({ ...f, pieces_missing: e.target.value }))} placeholder="0" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Décrivez l'état, l'histoire du puzzle..."
              rows={3}
              className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${inputCls} bg-white/5 border border-white/20`}
            />
          </div>

          {/* Localisation */}
          <div>
            <label className={labelCls}>Ville</label>
            <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Paris, Lyon..." className={inputCls} />
          </div>

          {/* Livraison */}
          <div>
            <button
              onClick={() => setForm(f => ({ ...f, shipping_offered: !f.shipping_offered }))}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${form.shipping_offered ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-white/10 bg-white/5 text-white/50'}`}
            >
              <Truck className="w-5 h-5" />
              <span className="text-sm font-medium">Livraison possible</span>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.shipping_offered ? 'border-green-400 bg-green-400' : 'border-white/30'}`}>
                {form.shipping_offered && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
            {form.shipping_offered && (
              <div className="mt-2">
                <label className={labelCls}>Frais de livraison (€) — laisser vide si inclus</label>
                <Input type="number" step="0.01" min="0" value={form.shipping_price} onChange={e => setForm(f => ({ ...f, shipping_price: e.target.value }))} placeholder="0.00" className={inputCls} />
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <label className={labelCls}>Photos ({photos.length}/4)</label>
            <div className="grid grid-cols-4 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-orange-500/40 flex flex-col items-center justify-center gap-1 text-white/40 hover:text-orange-400 transition-colors"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-xs">Photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
          </div>
        </div>
    </motion.div>
  );
}

// ─── Page principale Marketplace ───────────────────────────────────────────────

export default function Marketplace() {
  const [currentUser, setCurrentUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [activeView, setActiveView] = useState('browse'); // browse | my_listings | favorites | messages
  const [selectedListing, setSelectedListing] = useState(null);
  const [contactListing, setContactListing] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [myConversations, setMyConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    loadListings();
  }, [filterType, filterCondition]);

  useEffect(() => {
    if (currentUser) {
      loadFavorites();
      loadMyConversations();
    }
  }, [currentUser]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('created_by', user.email).single();
      setCurrentUser({ ...user, ...profile, email: user.email });
    }
  };

  const loadListings = async () => {
    setLoading(true);
    let query = supabase.from('marketplace_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (filterType !== 'all') query = query.eq('transaction_type', filterType);
    if (filterCondition !== 'all') query = query.eq('condition', filterCondition);
    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  };

  const loadFavorites = async () => {
    const { data } = await supabase.from('marketplace_favorites').select('listing_id').eq('user_email', currentUser.email);
    setFavorites((data || []).map(f => f.listing_id));
  };

  const loadMyConversations = async () => {
    const { data } = await supabase.from('marketplace_messages')
      .select('listing_id, sender_email, receiver_email, content, created_at, is_read')
      .or(`sender_email.eq.${currentUser.email},receiver_email.eq.${currentUser.email}`)
      .order('created_at', { ascending: false });

    if (!data) return;

    // Grouper par listing + interlocuteur
    const convMap = {};
    for (const msg of data) {
      const otherEmail = msg.sender_email === currentUser.email ? msg.receiver_email : msg.sender_email;
      const key = `${msg.listing_id}__${otherEmail}`;
      if (!convMap[key]) convMap[key] = { listing_id: msg.listing_id, other_email: otherEmail, last_message: msg.content, last_at: msg.created_at, unread: 0 };
      if (!msg.is_read && msg.receiver_email === currentUser.email) convMap[key].unread++;
    }

    const convs = Object.values(convMap);
    // Charger les titres des annonces
    const listingIds = [...new Set(convs.map(c => c.listing_id))];
    if (listingIds.length > 0) {
      const { data: listingsData } = await supabase.from('marketplace_listings').select('id, title, photos, puzzle_image').in('id', listingIds);
      for (const conv of convs) {
        conv.listing = listingsData?.find(l => l.id === conv.listing_id);
      }
    }

    setMyConversations(convs);
    setUnreadCount(convs.reduce((sum, c) => sum + c.unread, 0));
  };

  const toggleFavorite = async (listingId) => {
    if (!currentUser) return;
    if (favorites.includes(listingId)) {
      await supabase.from('marketplace_favorites').delete().eq('user_email', currentUser.email).eq('listing_id', listingId);
      setFavorites(f => f.filter(id => id !== listingId));
    } else {
      await supabase.from('marketplace_favorites').insert({ user_email: currentUser.email, listing_id: listingId });
      setFavorites(f => [...f, listingId]);
    }
  };

  const reportListing = async (listingId) => {
    if (!currentUser) return;
    const reason = window.prompt('Raison du signalement :');
    if (!reason?.trim()) return;
    await supabase.from('marketplace_reports').insert({ listing_id: listingId, reported_by: currentUser.email, reason: reason.trim() });
    toast.success('Signalement envoyé');
    setSelectedListing(null);
  };

  const archiveListing = async (listingId) => {
    await supabase.from('marketplace_listings').update({ status: 'archived' }).eq('id', listingId);
    toast.success('Annonce archivée');
    loadListings();
  };

  const markSold = async (listingId) => {
    await supabase.from('marketplace_listings').update({ status: 'sold' }).eq('id', listingId);
    toast.success('Annonce marquée comme vendue');
    loadListings();
  };

  const filteredListings = listings.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return l.title?.toLowerCase().includes(q) || l.puzzle_brand?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q);
  });

  const myListings = listings.filter(l => l.created_by === currentUser?.email);
  const favoriteListings = listings.filter(l => favorites.includes(l.id));

  const tabCls = (v) => `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === v ? 'bg-orange-500/20 text-orange-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`;

  // Si le form est ouvert (nouvelle annonce ou modification)
  if ((showNewForm || editingListing) && currentUser) {
    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <NewListingForm
          currentUser={currentUser}
          editListing={editingListing}
          onClose={() => { setShowNewForm(false); setEditingListing(null); }}
          onSuccess={() => { setShowNewForm(false); setEditingListing(null); loadListings(); }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          </div>
          <p className="text-white/40 text-sm">Échangez et vendez vos puzzles entre passionnés</p>
        </div>
        {currentUser && (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Déposer une annonce</span>
            <span className="sm:hidden">Annonce</span>
          </button>
        )}
      </div>

      {/* Tabs nav */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl mb-6 overflow-x-auto">
        <button className={tabCls('browse')} onClick={() => setActiveView('browse')}>
          <ShoppingBag className="w-4 h-4" />
          <span>Annonces</span>
          <span className="text-white/30 text-xs">({listings.length})</span>
        </button>
        {currentUser && (
          <>
            <button className={tabCls('my_listings')} onClick={() => setActiveView('my_listings')}>
              <Package className="w-4 h-4" />
              <span>Mes annonces</span>
              {myListings.length > 0 && <span className="text-white/30 text-xs">({myListings.length})</span>}
            </button>
            <button className={tabCls('favorites')} onClick={() => setActiveView('favorites')}>
              <Heart className="w-4 h-4" />
              <span>Favoris</span>
            </button>
            <button className={tabCls('messages')} onClick={() => { setActiveView('messages'); loadMyConversations(); }}>
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
              {unreadCount > 0 && <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
            </button>
          </>
        )}
      </div>

      {/* Vue Annonces */}
      {activeView === 'browse' && (
        <>
          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="pl-9 bg-white/5 border-white/20 text-white" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-xl text-sm">
              <option value="all">Tous types</option>
              <option value="vente">Vente</option>
              <option value="echange">Échange</option>
              <option value="don">Don</option>
            </select>
            <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)} className="px-3 py-2 bg-white/5 border border-white/20 text-white rounded-xl text-sm">
              <option value="all">Tous états</option>
              <option value="neuf">Neuf</option>
              <option value="excellent">Excellent</option>
              <option value="bon">Bon état</option>
              <option value="acceptable">Acceptable</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <ShoppingBag className="w-14 h-14 text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-1">Aucune annonce</h3>
              <p className="text-white/40 text-sm">Soyez le premier à déposer une annonce !</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUser={currentUser}
                  onOpen={setSelectedListing}
                  onFavorite={toggleFavorite}
                  isFavorite={favorites.includes(listing.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Vue Mes annonces */}
      {activeView === 'my_listings' && (
        <div className="space-y-3">
          {myListings.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Package className="w-14 h-14 text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-1">Aucune annonce</h3>
              <button onClick={() => setShowNewForm(true)} className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium">
                Déposer ma première annonce
              </button>
            </div>
          ) : myListings.map(listing => (
            <div key={listing.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                {(listing.photos?.[0] || listing.puzzle_image) ? (
                  <img src={listing.photos?.[0] || listing.puzzle_image} alt="" className="w-full h-full object-cover" />
                ) : <ShoppingBag className="w-8 h-8 text-white/20 m-auto mt-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{listing.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[listing.transaction_type]}`}>{TYPE_LABELS[listing.transaction_type]}</span>
                  {listing.transaction_type === 'vente' && <span className="text-orange-400 text-sm font-bold">{Number(listing.price).toFixed(2)} €</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'text-green-400 bg-green-500/10' : 'text-white/40 bg-white/5'}`}>
                    {listing.status === 'active' ? 'Active' : listing.status === 'sold' ? 'Vendue' : 'Archivée'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditingListing(listing)} title="Modifier" className="w-9 h-9 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => markSold(listing.id)} title="Marquer vendu" className="w-9 h-9 flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => archiveListing(listing.id)} title="Archiver" className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors">
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue Favoris */}
      {activeView === 'favorites' && (
        favoriteListings.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Heart className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-1">Aucun favori</h3>
            <p className="text-white/40 text-sm">Ajoutez des annonces à vos favoris en cliquant sur ❤️</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} currentUser={currentUser} onOpen={setSelectedListing} onFavorite={toggleFavorite} isFavorite={true} />
            ))}
          </div>
        )
      )}

      {/* Vue Messages */}
      {activeView === 'messages' && (
        <AnimatePresence mode="wait">
          {!selectedConversation ? (
            <motion.div key="conv-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {myConversations.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <MessageCircle className="w-14 h-14 text-white/20 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-1">Aucun message</h3>
                  <p className="text-white/40 text-sm">Vos conversations apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myConversations.map((conv, i) => (
                    <button key={i} onClick={() => setSelectedConversation(conv)} className="w-full bg-white/5 border border-white/10 hover:border-orange-500/20 rounded-xl p-4 flex items-center gap-3 text-left transition-colors">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        {conv.listing?.photos?.[0] || conv.listing?.puzzle_image ? (
                          <img src={conv.listing.photos?.[0] || conv.listing.puzzle_image} alt="" className="w-full h-full object-cover" />
                        ) : <ShoppingBag className="w-6 h-6 text-white/20 m-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{conv.listing?.title || 'Annonce'}</p>
                        <p className="text-white/40 text-xs truncate">{conv.other_email}</p>
                        <p className="text-white/50 text-xs truncate mt-0.5">{conv.last_message}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{conv.unread}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="conv-chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => { setSelectedConversation(null); loadMyConversations(); }} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 text-sm">
                <ArrowLeft className="w-4 h-4" />
                Retour aux messages
              </button>
              {selectedConversation.listing && (
                <MessageModal
                  listing={selectedConversation.listing}
                  currentUser={currentUser}
                  onClose={() => { setSelectedConversation(null); loadMyConversations(); }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedListing && !contactListing && (
          <ListingModal
            listing={selectedListing}
            currentUser={currentUser}
            onClose={() => setSelectedListing(null)}
            onContact={(l) => { setSelectedListing(null); setContactListing(l); }}
            onReport={reportListing}
            isFavorite={favorites.includes(selectedListing.id)}
            onFavorite={toggleFavorite}
          />
        )}
        {contactListing && currentUser && (
          <MessageModal
            listing={contactListing}
            currentUser={currentUser}
            onClose={() => setContactListing(null)}
          />
        )}

      </AnimatePresence>
    </div>
  );
}
