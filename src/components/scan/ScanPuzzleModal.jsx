import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Image as ImageIcon, Check, Edit2, Camera, X } from 'lucide-react';
import ManualAddPuzzleModal from './ManualAddPuzzleModal';
import PersonalPuzzleAddModal from './PersonalPuzzleAddModal';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/api/supabaseClient';
import { searchAmazon, getProductByAsin } from '@/api/scraperApi';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useScanCredits } from '@/hooks/useScanCredits';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StarRating from '@/components/shared/StarRating';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2 } from 'lucide-react';

export default function ScanPuzzleModal({ open, onClose, onPuzzleAdded, skipCollectionAdd = false }) {
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth();
  const { remaining, isLimitReached, consumeCredit, loading: creditsLoading, getResetInfo, DAILY_LIMIT } = useScanCredits(user);

  const [activeTab, setActiveTab] = useState('scanner');
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualData, setManualData] = useState({ name: '', brand: '', pieces: '', image: '', sku: '' });
  const [barcode, setBarcode] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [existingPuzzle, setExistingPuzzle] = useState(null);
  const [scanMessage, setScanMessage] = useState(null);
  const [puzzleConfirmed, setPuzzleConfirmed] = useState(false);
  const [showNotMyPuzzle, setShowNotMyPuzzle] = useState(false);
  const [editingPieces, setEditingPieces] = useState(false);
  const [editedPieces, setEditedPieces] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [pendingBatch, setPendingBatch] = useState([]);
  const [showAddAnother, setShowAddAnother] = useState(false);
  const [scanRating, setScanRating] = useState(0);
  const [userPhoto, setUserPhoto] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingManualImage, setIsUploadingManualImage] = useState(false);
  const userPhotoInputRef = useRef(null);
  const manualImageRef = useRef(null);
  const [speedHours, setSpeedHours] = useState('');
  const [speedMinutes, setSpeedMinutes] = useState('');
  const [speedSeconds, setSpeedSeconds] = useState('');
  const [showSpeedInput, setShowSpeedInput] = useState(false);

  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [open]);

  const handleActivateCamera = async () => {
    setCameraReady(true);
    try {
      setScanning(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      const html5QrcodeScanner = new Html5Qrcode("reader");
      html5QrcodeScannerRef.current = html5QrcodeScanner;
      await html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8]
        },
        async (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(200);
          try { await html5QrcodeScanner.stop(); } catch (e) {}
          setScanning(false);
          setCameraReady(false);
          await fetchPuzzleData(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setCameraReady(false);
      toast.error('Impossible de demarrer la camera.');
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeScannerRef.current && scanning) {
      try { await html5QrcodeScannerRef.current.stop(); } catch (err) {}
    }
    document.body.style.transform = '';
    document.body.style.zoom = '';
    document.documentElement.style.transform = '';
    document.documentElement.style.zoom = '';
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  };

  const fetchPuzzleData = async (code) => {
    setBarcode(code);
    setLoading(true);
    setPuzzleData(null);
    setExistingPuzzle(null);
    setScanMessage(null);
    // FIX: reset confirmation à chaque nouveau scan
    setPuzzleConfirmed(false);
    setShowNotMyPuzzle(false);

    // ETAPE 1 : Verifier si deja dans la collection
    if (!skipCollectionAdd && user) {
      try {
        const { data: userPuzzles } = await supabase
          .from('user_puzzles')
          .select('id')
          .eq('puzzle_reference', code)
          .eq('created_by', user.email)
          .limit(1);
        if (userPuzzles && userPuzzles.length > 0) {
          setScanMessage({ type: 'error', text: 'Vous possedez deja ce puzzle dans votre collection !' });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking collection:', err);
      }
    }

    // ETAPE 2 : Verifier dans le catalogue
    try {
      let { data: catalogResults } = await supabase
        .from('puzzle_catalog')
        .select('*')
        .eq('ean', code)
        .limit(1);

      if (!catalogResults || catalogResults.length === 0) {
        const { data: asinResults } = await supabase
          .from('puzzle_catalog')
          .select('*')
          .eq('asin', code)
          .limit(1);
        catalogResults = asinResults;
      }

      if (catalogResults && catalogResults.length > 0) {
        const catalogPuzzle = catalogResults[0];

        if (catalogPuzzle.status === 'pending') {
          setScanMessage({ type: 'pending', text: 'Ce puzzle est deja dans notre base, mais en cours de validation.' });
          setLoading(false);
          return;
        }

        setScanMessage({ type: 'community', text: 'Super ! Ce puzzle fait deja partie de la collection communautaire.' });
        setExistingPuzzle(catalogPuzzle);
        // FIX: toujours demander confirmation, même pour les puzzles du catalogue
        setPuzzleConfirmed(false);
        const puzzleInfo = {
          catalog_id: catalogPuzzle.id,
          name: catalogPuzzle.title,
          title: catalogPuzzle.title,
          brand: catalogPuzzle.brand,
          image: catalogPuzzle.image_hd,
          image_hd: catalogPuzzle.image_hd,
          pieces: catalogPuzzle.piece_count,
          piece_count: catalogPuzzle.piece_count,
          asin: catalogPuzzle.asin,
          ean: catalogPuzzle.ean || code,
          sku: catalogPuzzle.asin || code,
          category_tag: catalogPuzzle.category_tag,
          amazon_price: catalogPuzzle.amazon_price,
          amazon_rating: catalogPuzzle.amazon_rating,
          link: catalogPuzzle.asin ? `https://www.amazon.com/dp/${catalogPuzzle.asin}` : '',
        };
        setPuzzleData(puzzleInfo);
        setLoading(false);
        if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);
        return;
      }
    } catch (err) {
      console.error('Error checking catalog:', err);
    }

    // ETAPE 3 : Verifier les credits
    if (isLimitReached) {
      const { dateStr, timeStr } = getResetInfo();
      setScanMessage({ type: 'limit', text: `Limite journaliere atteinte (${DAILY_LIMIT} scans/jour). Rechargement le ${dateStr} a ${timeStr}.` });
      setLoading(false);
      return;
    }

    // ETAPE 4 : Recherche Amazon via ScraperAPI
    try {
      let results = await searchAmazon(code);
      console.log('Search results:', results);

      if (!results || results.length === 0) {
        results = await searchAmazon(`puzzle ${code}`);
        console.log('Search fallback:', results);
      }

      if (!results || results.length === 0) {
        setScanMessage({ type: 'error', text: 'Puzzle non trouve sur Amazon. Ajoutez-le manuellement !' });
        setActiveTab('manual');
        setLoading(false);
        return;
      }

      const item = results[0];
      await consumeCredit();

      let brand = item.brand || '';
      let pieces = null;
      let imageUrl = item.image?.link || item.thumbnail || '';
      let title = item.title || item.name || '';
      let asin = item.asin || '';

      // ETAPE 5 : getProductByAsin pour données complètes
      if (asin) {
        try {
          const detail = await getProductByAsin(asin);
          console.log('Product detail:', detail);

          if (detail?.title) title = detail.title;
          if (detail?.brand) brand = detail.brand;

          if (detail?.main_image?.link) {
            imageUrl = detail.main_image.link;
          } else if (detail?.images?.[0]?.link) {
            imageUrl = detail.images[0].link;
          }

          if (!pieces && detail?.title) {
            const titleMatch = detail.title.match(/(\d[\d\s]*)\s*[Pp]i[èe]ces?/);
            if (titleMatch) pieces = parseInt(titleMatch[1].replace(/\s/g, ''));
          }

          if (!pieces && detail?.feature_bullets_flat) {
            const match = detail.feature_bullets_flat.match(/(\d+)\s*[Pp]i[èe]ces?/);
            if (match) pieces = parseInt(match[1]);
          }

          if (!pieces && detail?.feature_bullets?.length) {
            for (const bullet of detail.feature_bullets) {
              const match = bullet.match(/(\d+)\s*[Pp]i[èe]ces?/);
              if (match) { pieces = parseInt(match[1]); break; }
            }
          }

          if (!pieces) {
            const titleMatch = title.match(/(\d[\d\s]*)\s*[Pp]i[èe]ces?/);
            if (titleMatch) pieces = parseInt(titleMatch[1].replace(/\s/g, ''));
          }

        } catch (e) {
          console.error('getProductByAsin error:', e);
        }
      }

      const puzzleInfo = {
        name: title,
        title,
        brand,
        image: imageUrl,
        image_hd: imageUrl,
        pieces,
        piece_count: pieces,
        asin,
        ean: code,
        sku: asin || code,
        amazon_price: item.price?.value || null,
        amazon_rating: item.rating || null,
        link: asin ? `https://www.amazon.com/dp/${asin}` : '',
        isPending: true,
      };

      setPuzzleData(puzzleInfo);
      // FIX: toujours demander confirmation pour les puzzles ScraperAPI aussi
      setPuzzleConfirmed(false);
      setLoading(false);
      if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);

    } catch (error) {
      console.error('Search error:', error);
      setScanMessage({ type: 'error', text: 'Puzzle non trouve. Ajoutez-le manuellement !' });
      setActiveTab('manual');
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualData.name || !manualData.pieces) {
      toast.error('Veuillez remplir au moins le nom et le nombre de pieces');
      return;
    }
    const data = {
      name: manualData.name,
      brand: manualData.brand,
      pieces: parseInt(manualData.pieces),
      image: manualData.image,
      sku: manualData.sku,
      asin: manualData.sku,
      title: manualData.name,
      image_hd: manualData.image,
      piece_count: parseInt(manualData.pieces),
      isPending: true,
    };
    setPuzzleData(data);
    // Saisie manuelle : l'utilisateur a saisi lui-même, confirmation directe
    setPuzzleConfirmed(true);
    if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(data);
  };

  const handleUserPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('puzzle-photos').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('puzzle-photos').getPublicUrl(fileName);
      setUserPhoto(urlData.publicUrl);
      toast.success('Photo ajoutee !');
    } catch (err) {
      toast.error('Erreur upload photo');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Bridge Android pour l'image manuelle
  useEffect(() => {
    const handleAndroidManualImage = (e) => {
      const { target, url } = e.detail || {};
      if (target !== 'manual_puzzle') return;
      if (!url) return;
      setManualData(prev => ({ ...prev, image: url }));
      setIsUploadingManualImage(false);
      toast.success('Image ajoutée !');
    };
    window.addEventListener('android-image-selected', handleAndroidManualImage);
    const prevReceive = window.receiveImageFromAndroid;
    window.receiveImageFromAndroid = (target, url) => {
      window.dispatchEvent(new CustomEvent('android-image-selected', { detail: { target, url } }));
    };
    return () => {
      window.removeEventListener('android-image-selected', handleAndroidManualImage);
      if (prevReceive) window.receiveImageFromAndroid = prevReceive;
    };
  }, []);

  const handleManualImageClick = () => {
    if (window.Android && window.Android.openImagePicker) {
      setIsUploadingManualImage(true);
      window.Android.openImagePicker('manual_puzzle');
    } else {
      setTimeout(() => manualImageRef.current?.click(), 50);
    }
  };

  const handleManualImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsUploadingManualImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `puzzles/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setManualData(prev => ({ ...prev, image: data.publicUrl }));
      toast.success('Image uploadée !');
    } catch {
      toast.error("Erreur upload image");
    } finally {
      setIsUploadingManualImage(false);
    }
  };

  const handleAddPuzzle = async (finalize = false) => {
    if (!puzzleData || !selectedStatus) {
      toast.error('Veuillez selectionner un statut');
      return;
    }
    const speedTotal = (parseInt(speedHours) || 0) * 3600 + (parseInt(speedMinutes) || 0) * 60 + (parseInt(speedSeconds) || 0);
    const newBatch = [...pendingBatch, {
      puzzleData: { ...puzzleData },
      selectedStatus,
      rating: scanRating || null,
      userPhoto: userPhoto || null,
      speedRecord: speedTotal > 0 ? {
        hours: parseInt(speedHours) || 0,
        minutes: parseInt(speedMinutes) || 0,
        seconds: parseInt(speedSeconds) || 0,
        total_seconds: speedTotal
      } : null
    }];
    setPendingBatch(newBatch);
    if (finalize) {
      await saveBatch(newBatch);
    } else {
      setShowAddAnother(true);
    }
  };

  const saveBatch = async (batch) => {
    try {
      setLoading(true);
      for (const { puzzleData: pd, selectedStatus: status, rating, userPhoto: photo, speedRecord } of batch) {
        let catalogPuzzleId = pd.catalog_id || null;

        if (!catalogPuzzleId && pd.isPending) {
          // ✅ Anti-doublon : vérifier EAN et ASIN avant d'insérer dans puzzle_catalog
          const ean = pd.ean || '';
          const asin = pd.asin || '';
          let existingCatalog = null;

          if (ean) {
            const { data } = await supabase.from('puzzle_catalog').select('id, status').eq('ean', ean).limit(1);
            existingCatalog = data?.[0] || null;
          }
          if (!existingCatalog && asin) {
            const { data } = await supabase.from('puzzle_catalog').select('id, status').eq('asin', asin).limit(1);
            existingCatalog = data?.[0] || null;
          }

          if (existingCatalog) {
            // Réutiliser l'entrée existante (même si pending)
            catalogPuzzleId = existingCatalog.id;
          } else {
            const { data: newEntry, error: catError } = await supabase
              .from('puzzle_catalog')
              .insert([{
                title: pd.title || pd.name || '',
                brand: pd.brand || '',
                piece_count: pd.piece_count || pd.pieces || 0,
                image_hd: pd.image_hd || pd.image || '',
                ean: pd.ean || '',
                asin: pd.asin || '',
                category_tag: pd.category_tag || 'Autre',
                amazon_price: pd.amazon_price || null,
                amazon_rating: pd.amazon_rating || null,
                status: 'pending',
              }])
              .select()
              .single();
            if (catError) console.error('Catalog insert error:', catError);
            if (newEntry) catalogPuzzleId = newEntry.id;
          }
        }

        const refCode = pd.ean || pd.asin || pd.sku || barcode;

        const { data: newUserPuzzle, error: upError } = await supabase
          .from('user_puzzles')
          .insert([{
            puzzle_name: pd.name || pd.title || '',
            puzzle_brand: pd.brand || '',
            puzzle_pieces: pd.pieces || pd.piece_count || 0,
            image_url: pd.image || pd.image_hd || '',
            puzzle_reference: refCode,
            catalog_puzzle_id: catalogPuzzleId,
            status,
            rating: rating || null,
            progress_photo: photo || null,
            created_by: user.email,
          }])
          .select()
          .single();

        if (upError) console.error('UserPuzzle insert error:', upError);

        if (speedRecord && newUserPuzzle) {
          await supabase.from('speed_records').insert([{
            puzzle_id: newUserPuzzle.id,
            puzzle_name: pd.name || pd.title || '',
            puzzle_brand: pd.brand || '',
            puzzle_pieces: pd.pieces || pd.piece_count || 0,
            image: pd.image || pd.image_hd || '',
            category_tag: pd.category_tag || '',
            hours: speedRecord.hours,
            minutes: speedRecord.minutes,
            seconds: speedRecord.seconds,
            total_seconds: speedRecord.total_seconds,
            record_date: new Date().toISOString().split('T')[0],
            created_by: user.email,
          }]);
        }

        if (catalogPuzzleId) {
          const { data: cat } = await supabase
            .from('puzzle_catalog')
            .select('added_count, wishlistCount')
            .eq('id', catalogPuzzleId)
            .single();
          if (cat) {
            const updates = { added_count: (cat.added_count || 0) + 1 };
            if (status === 'wishlist') updates.wishlistCount = (cat.wishlistCount || 0) + 1;
            await supabase.from('puzzle_catalog').update(updates).eq('id', catalogPuzzleId);
          }
        }
      }

      setLoading(false);
      setShowAddAnother(false);
      setShowSuccess(true);
      toast.success(`${batch.length} puzzle${batch.length > 1 ? 's' : ''} ajoute${batch.length > 1 ? 's' : ''} !`);
      queryClient.invalidateQueries({ queryKey: ['userPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['completedPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['wishlistPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['globalPuzzles'] });
    } catch (error) {
      setLoading(false);
      console.error('saveBatch error:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleClose = () => {
    stopScanner();
    setPuzzleData(null);
    setShowSuccess(false);
    setCameraReady(false);
    setSelectedStatus('');
    setBarcode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    setBarcodeInput('');
    setExistingPuzzle(null);
    setScanMessage(null);
    setPendingBatch([]);
    setShowAddAnother(false);
    setUserPhoto(null);
    setSpeedHours('');
    setSpeedMinutes('');
    setSpeedSeconds('');
    setShowSpeedInput(false);
    setPuzzleConfirmed(false);
    setShowNotMyPuzzle(false);
    setActiveTab('scanner');
    onClose();
  };

  const handleReset = () => {
    stopScanner();
    setPuzzleData(null);
    setShowSuccess(false);
    setSelectedStatus('');
    setBarcode('');
    setManualData({ name: '', brand: '', pieces: '', image: '', sku: '' });
    setBarcodeInput('');
    setExistingPuzzle(null);
    setScanMessage(null);
    setPuzzleConfirmed(false);
    setShowNotMyPuzzle(false);
    setShowAddAnother(false);
    setEditingPieces(false);
    setEditedPieces('');
    setScanRating(0);
    setUserPhoto(null);
    setSpeedHours('');
    setSpeedMinutes('');
    setSpeedSeconds('');
    setShowSpeedInput(false);
    setCameraReady(false);
    setScanning(false);
    setActiveTab('scanner');
  };

  const handleBarcodeSubmit = async () => {
    if (barcodeInput.length !== 13 && barcodeInput.length !== 14) {
      toast.error('Le code-barres doit contenir 13 ou 14 chiffres');
      return;
    }
    await fetchPuzzleData(barcodeInput);
  };

  const handleManualModalSubmit = (newPuzzleData) => {
    setShowManualModal(false);
    setShowNotMyPuzzle(false);
    setScanMessage(null);
    setPuzzleData(newPuzzleData);
    setPuzzleConfirmed(true);
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
          </DialogHeader>

          {isGuest && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <span className="text-5xl">🔒</span>
              <h3 className="text-white font-bold text-lg">Fonctionnalite reservee aux membres</h3>
              <p className="text-white/50 text-sm">Creez un compte gratuit pour scanner et ajouter des puzzles.</p>
              <Button onClick={() => window.location.href = '/login'} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl px-6">
                Se connecter
              </Button>
              <button onClick={onClose} className="text-white/30 text-sm hover:text-white/60">Fermer</button>
            </div>
          )}

          {!isGuest && (
            <>
              {!puzzleData && !showSuccess && scanMessage && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 text-center text-sm font-medium border ${
                    scanMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : scanMessage.type === 'community' ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : scanMessage.type === 'limit' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                    : scanMessage.type === 'pending' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  }`}
                >
                  {scanMessage.text}
                </motion.div>
              )}

              {!creditsLoading && !showSuccess && (
                <div className={`flex items-center justify-center gap-2 text-xs rounded-lg px-3 py-2 ${
                  remaining === 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : remaining <= 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'bg-white/5 text-white/40 border border-white/10'
                }`}>
                  <span>🔍</span>
                  <span>{remaining === 0 ? `Limite atteinte - ${DAILY_LIMIT} scans utilises aujourd'hui` : `${remaining} scan${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} aujourd'hui`}</span>
                </div>
              )}

              {!puzzleData && !showSuccess && scanMessage?.type !== 'pending' && (
                <>
                  <>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="bg-white/5 border border-white/10 w-full">
                        <TabsTrigger value="scanner" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1">
                          <Barcode className="w-4 h-4 mr-2" />Scanner
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1">
                          <Edit className="w-4 h-4 mr-2" />Saisie Manuelle
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="scanner" className="mt-4">
                        <div className="space-y-4">
                          <div id="file-reader-temp" style={{ display: 'none' }}></div>
                          {!cameraReady && !loading && (
                            <div className="flex flex-col items-center justify-center py-8 space-y-6">
                              <div className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                                <Barcode className="w-12 h-12 text-orange-400" />
                              </div>
                              <Button onClick={handleActivateCamera} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                Activer la Camera
                              </Button>
                              <div className="w-full max-w-sm">
                                <div className="text-white/50 text-sm text-center mb-3">ou saisir le code-barres</div>
                                <div className="flex gap-2">
                                  <Input type="text" placeholder="13 ou 14 chiffres" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, '').slice(0, 14))} className="bg-white/5 border-white/10 text-white text-center tracking-wider" maxLength={14} />
                                  <Button onClick={handleBarcodeSubmit} disabled={barcodeInput.length !== 13 && barcodeInput.length !== 14} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50">OK</Button>
                                </div>
                              </div>
                            </div>
                          )}
                          {cameraReady && (
                            <>
                              <div id="reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden bg-black/50 border border-white/10" style={{ minHeight: '300px' }} />
                              <p className="text-white/50 text-sm text-center">Positionnez le code-barres devant la camera</p>
                            </>
                          )}
                          {loading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                              <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
                              <p className="text-white font-semibold">Recherche en cours...</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="manual" className="mt-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-white/70 text-sm mb-2 block">Nom du Puzzle *</label>
                            <Input placeholder="Ex: Tour Eiffel" value={manualData.name} onChange={(e) => setManualData({...manualData, name: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                          </div>
                          <div>
                            <label className="text-white/70 text-sm mb-2 block">Marque</label>
                            <Input placeholder="Ex: Ravensburger" value={manualData.brand} onChange={(e) => setManualData({...manualData, brand: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                          </div>
                          <div>
                            <label className="text-white/70 text-sm mb-2 block">Nombre de Pieces *</label>
                            <Input type="number" placeholder="Ex: 1000" value={manualData.pieces} onChange={(e) => setManualData({...manualData, pieces: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                          </div>
                          <div>
                            <label className="text-white/70 text-sm mb-2 block">Image</label>
                            <div className="flex gap-2 items-center mb-2">
                              {manualData.image && (
                                <img src={manualData.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                              )}
                              <button
                                type="button"
                                onClick={handleManualImageClick}
                                disabled={isUploadingManualImage}
                                className="flex-1 px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/50 text-sm hover:border-orange-500/50 hover:text-orange-400 transition-colors disabled:opacity-50"
                              >
                                {isUploadingManualImage ? '⏳ Upload...' : '📁 Choisir une image'}
                              </button>
                              <input ref={manualImageRef} type="file" accept="image/*" className="hidden" onChange={handleManualImageFileChange} />
                            </div>
                            <Input placeholder="ou coller une URL..." value={manualData.image} onChange={(e) => setManualData({...manualData, image: e.target.value})} className="bg-white/5 border-white/10 text-white text-xs" />
                          </div>
                          <div>
                            <label className="text-white/70 text-sm mb-2 block">Reference / SKU</label>
                            <Input placeholder="Ex: 12345678" value={manualData.sku} onChange={(e) => setManualData({...manualData, sku: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                          </div>
                          <Button onClick={handleManualSubmit} className="w-full bg-orange-500 hover:bg-orange-600">Continuer</Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                </>
              )}

              {!puzzleData && !showSuccess && !skipCollectionAdd && scanMessage?.type !== 'pending' && (
                <div className="mt-4">
                  <button type="button" onClick={() => setShowPersonalModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all group"
                  >
                    <span className="text-2xl">🧩</span>
                    <div className="text-left">
                      <p className="text-purple-300 text-sm font-medium">Ajouter un puzzle personnalise</p>
                      <p className="text-white/30 text-xs">Non scannable - Visible uniquement dans votre collection</p>
                    </div>
                  </button>
                </div>
              )}

              {puzzleData && !showSuccess && !skipCollectionAdd && (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    {puzzleData.image ? (
                      <img src={puzzleData.image} alt={puzzleData.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-white/5">
                        <ImageIcon className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                  </motion.div>

                  {scanMessage && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl p-4 text-center text-sm font-medium border ${
                        scanMessage.type === 'community' ? 'bg-green-500/10 border-green-500/30 text-green-300'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                      }`}
                    >
                      {scanMessage.text}
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <label className="text-white/50 text-xs mb-1 block">Nom du puzzle</label>
                      <p className="text-white text-sm leading-relaxed break-words">{puzzleData.name || 'Non renseigne'}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <label className="text-white/50 text-xs mb-1 block">Marque</label>
                      <p className="text-white text-sm">{puzzleData.brand || 'Non renseigne'}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-white/50 text-xs">Nombre de pieces</label>
                        {!editingPieces && (
                          <button onClick={() => { setEditingPieces(true); setEditedPieces(String(puzzleData.pieces || '')); }} className="text-orange-400 text-xs hover:text-orange-300 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Modifier
                          </button>
                        )}
                      </div>
                      {editingPieces ? (
                        <div className="flex gap-2 mt-1">
                          <Input type="number" value={editedPieces} onChange={(e) => setEditedPieces(e.target.value)} className="bg-white/10 border-white/20 text-white h-8 text-sm" autoFocus />
                          <Button size="sm" onClick={() => { const val = parseInt(editedPieces); if (val > 0) setPuzzleData(prev => ({ ...prev, pieces: val, piece_count: val })); setEditingPieces(false); }} className="bg-orange-500 hover:bg-orange-600 h-8 px-3">
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-white text-sm">{puzzleData.pieces ? `${puzzleData.pieces} pieces` : 'Non renseigne - utilisez Modifier'}</p>
                      )}
                    </div>
                    {puzzleData.link && (
                      <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                        <label className="text-white/50 text-xs mb-1 block">Lien Amazon</label>
                        <a href={puzzleData.link} target="_blank" rel="noopener noreferrer" className="text-orange-400 text-sm hover:text-orange-300 underline break-all">
                          Voir sur Amazon
                        </a>
                      </div>
                    )}
                  </motion.div>

                  {showNotMyPuzzle ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
                      <div className="text-center">
                        <span className="text-3xl mb-3 block">🤔</span>
                        <p className="text-white font-semibold mb-1">Ce puzzle ne correspond pas ?</p>
                        <p className="text-white/50 text-sm">Ajoutez-le manuellement avec les bonnes informations.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => setShowManualModal(true)} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">Ajouter manuellement</Button>
                        <Button onClick={() => setShowNotMyPuzzle(false)} variant="ghost" className="w-full text-white/50 hover:text-white text-sm">Retour</Button>
                      </div>
                    </motion.div>
                  ) : !puzzleConfirmed ? (
                    // FIX: confirmation affichée pour TOUS les puzzles scannés (catalogue + ScraperAPI)
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <p className="text-white/70 text-sm text-center font-medium">C'est bien votre puzzle ?</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => setPuzzleConfirmed(true)} className="bg-green-600 hover:bg-green-700 text-white">Oui, c'est lui !</Button>
                        <Button onClick={() => setShowNotMyPuzzle(true)} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">Non, ce n'est pas lui</Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <label className="text-sm text-white/70 mb-3 block">Ma note (optionnel)</label>
                        <StarRating value={scanRating} onChange={setScanRating} size="lg" />
                      </div>

                      <input ref={userPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUserPhotoUpload} />
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <label className="text-sm text-white/70 mb-3 block">Ma photo du puzzle (optionnel)</label>
                        {userPhoto ? (
                          <div className="relative">
                            <img src={userPhoto} alt="Ma photo" className="w-full h-32 object-cover rounded-lg" />
                            <button type="button" onClick={() => setUserPhoto(null)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => userPhotoInputRef.current?.click()} disabled={isUploadingPhoto} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:border-orange-500/50 hover:text-orange-400 transition-all disabled:opacity-50">
                            {isUploadingPhoto ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload...</> : <><Camera className="w-4 h-4" /> Ajouter ma photo</>}
                          </button>
                        )}
                      </div>

                      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <button type="button" onClick={() => setShowSpeedInput(!showSpeedInput)} className="w-full flex items-center justify-between">
                          <label className="text-sm text-white/70 cursor-pointer">Temps record (optionnel)</label>
                          <span className="text-white/30 text-xs">{showSpeedInput ? 'Masquer' : 'Ajouter'}</span>
                        </button>
                        {showSpeedInput && (
                          <div className="mt-3 flex gap-2 items-center">
                            <div className="flex-1">
                              <Input type="number" placeholder="0" min="0" value={speedHours} onChange={e => setSpeedHours(e.target.value)} className="bg-white/10 border-white/20 text-white text-center h-9" />
                              <p className="text-white/30 text-[10px] text-center mt-0.5">h</p>
                            </div>
                            <span className="text-white/30 font-bold mb-3">:</span>
                            <div className="flex-1">
                              <Input type="number" placeholder="0" min="0" max="59" value={speedMinutes} onChange={e => setSpeedMinutes(e.target.value)} className="bg-white/10 border-white/20 text-white text-center h-9" />
                              <p className="text-white/30 text-[10px] text-center mt-0.5">min</p>
                            </div>
                            <span className="text-white/30 font-bold mb-3">:</span>
                            <div className="flex-1">
                              <Input type="number" placeholder="0" min="0" max="59" value={speedSeconds} onChange={e => setSpeedSeconds(e.target.value)} className="bg-white/10 border-white/20 text-white text-center h-9" />
                              <p className="text-white/30 text-[10px] text-center mt-0.5">sec</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-white/70 mb-3 block">Ou ajouter ce puzzle ?</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'wishlist', emoji: '⭐', label: 'Wishlist', active: 'border-yellow-500 bg-yellow-500/20 text-yellow-400' },
                            { value: 'inbox', emoji: '📦', label: "Je l'ai chez moi", active: 'border-blue-500 bg-blue-500/20 text-blue-400' },
                            { value: 'done', emoji: '✅', label: 'Termine', active: 'border-green-500 bg-green-500/20 text-green-400' },
                          ].map(({ value, emoji, label, active }) => (
                            <button key={value} type="button" onClick={() => setSelectedStatus(value)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selectedStatus === value ? active : 'border-white/10 bg-white/5 text-white/70'}`}
                            >
                              <span className="text-3xl">{emoji}</span>
                              <span className="text-sm font-medium">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button onClick={() => handleAddPuzzle(false)} disabled={!selectedStatus} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white disabled:opacity-50">
                          <Barcode className="w-4 h-4 mr-2" />Ajouter + Scanner un autre
                        </Button>
                        {/* FIX: "Valider" seul si 1er puzzle, "Valider (N puzzles)" si lot en cours */}
                        <Button onClick={() => handleAddPuzzle(true)} disabled={!selectedStatus} variant="outline" className="w-full border-white/20 text-white hover:bg-white/5 disabled:opacity-50">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {pendingBatch.length > 0 ? `Valider (${pendingBatch.length + 1} puzzles)` : 'Valider'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {showAddAnother && !showSuccess && (
                <div className="space-y-6 py-6">
                  <div className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </motion.div>
                    <h3 className="text-white font-bold text-lg mb-1">Puzzle ajoute au lot !</h3>
                    <p className="text-white/50 text-sm">{pendingBatch.length} puzzle{pendingBatch.length > 1 ? 's' : ''} en attente</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button onClick={handleReset} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      <Barcode className="w-4 h-4 mr-2" />Scanner un autre puzzle
                    </Button>
                    <Button onClick={() => saveBatch(pendingBatch)} disabled={loading} variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Terminer ({pendingBatch.length} puzzle{pendingBatch.length > 1 ? 's' : ''})
                    </Button>
                  </div>
                </div>
              )}

              {showSuccess && (
                <div className="space-y-6 py-8">
                  <div className="flex justify-center items-center mb-6">
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40">
                      <span className="text-5xl">🧩</span>
                    </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">Puzzle ajoute !</h3>
                    <p className="text-white/60 mb-6">Votre collection a ete mise a jour</p>
                    <div className="flex flex-col gap-3">
                      <Button onClick={handleReset} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white">Scanner un autre puzzle</Button>
                      <Button onClick={handleClose} variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">Terminer</Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {showManualModal && (
        <ManualAddPuzzleModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
          onSubmit={handleManualModalSubmit}
          prefillBarcode={barcode}
        />
      )}

      <PersonalPuzzleAddModal
        open={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        onAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['userPuzzles'] });
          handleClose();
        }}
      />
    </div>
  );
}
