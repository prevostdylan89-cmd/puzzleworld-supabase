import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Barcode, Edit, Star, Image as ImageIcon, Check, Edit2, Camera, X } from 'lucide-react';
import ManualAddPuzzleModal from './ManualAddPuzzleModal';
import PersonalPuzzleAddModal from './PersonalPuzzleAddModal';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Package } from 'lucide-react';

export default function ScanPuzzleModal({ open, onClose, onPuzzleAdded, skipCollectionAdd = false }) {
  const queryClient = useQueryClient();
  const { isGuest } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!isGuest) base44.auth.me().then(setCurrentUser).catch(() => {});
  }, [isGuest]);

  const { remaining, isLimitReached, consumeCredit, loading: creditsLoading, getResetInfo, DAILY_LIMIT } = useScanCredits(currentUser);
  const [activeTab, setActiveTab] = useState('scanner');
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualData, setManualData] = useState({
    name: '',
    brand: '',
    pieces: '',
    image: '',
    sku: ''
  });
  const [barcode, setBarcode] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [existingPuzzle, setExistingPuzzle] = useState(null);
  const [scanMessage, setScanMessage] = useState(null); // { type: 'error'|'community'|'pending'|'new', text: '' }
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
  const userPhotoInputRef = useRef(null);
  const [speedHours, setSpeedHours] = useState('');
  const [speedMinutes, setSpeedMinutes] = useState('');
  const [speedSeconds, setSpeedSeconds] = useState('');
  const [showSpeedInput, setShowSpeedInput] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [open]);

  const handleActivateCamera = async () => {
    setCameraReady(true);
    try {
      setScanning(true);
      
      // Wait a bit for the DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrcodeScanner = new Html5Qrcode("reader");
      html5QrcodeScannerRef.current = html5QrcodeScanner;

      await html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.EAN_8 
          ]
        },
        async (decodedText) => {
          console.log("Code détecté : " + decodedText);
          
          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          // Stop scanner immediately
          try {
            await html5QrcodeScanner.stop();
          } catch (e) {
            console.log("Error stopping scanner:", e);
          }
          
          setScanning(false);
          setCameraReady(false);
          
          // Start API fetch
          await fetchPuzzleData(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanning(false);
      setCameraReady(false);
      toast.error('Impossible de démarrer la caméra. Vérifiez les permissions.');
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeScannerRef.current && scanning) {
      try {
        await html5QrcodeScannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    // Corriger le zoom anormal causé par html5-qrcode sur mobile
    document.body.style.transform = '';
    document.body.style.zoom = '';
    document.documentElement.style.transform = '';
    document.documentElement.style.zoom = '';
    // Forcer le viewport à sa valeur initiale
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    // Stop camera if active
    if (cameraReady) {
      await stopScanner();
      setCameraReady(false);
      setScanning(false);
    }

    setLoading(true);
    toast.info('Analyse de l\'image en cours...');

    try {
      // Compress/resize image if too large (> 2MB)
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }

      // Create a temporary scanner instance for file scanning
      const tempScanner = new Html5Qrcode("file-reader-temp");
      
      const decodedText = await tempScanner.scanFile(processedFile, true);
      
      console.log("Code détecté depuis l'image : " + decodedText);
      
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      toast.success('Code-barres détecté !');
      await fetchPuzzleData(decodedText);
    } catch (error) {
      console.error('Error scanning file:', error);
      setLoading(false);
      
      // Basculer vers l'onglet manuel en cas d'échec
      toast.error('Code-barres illisible sur cette photo, merci de saisir les infos manuellement');
      setActiveTab('manual');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 1500px)
          const maxDim = 1500;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const cleanTitle = (title, brand, pieces) => {
    let cleanedTitle = title;
    
    // Enlever la marque du titre
    if (brand) {
      cleanedTitle = cleanedTitle.replace(new RegExp(brand, 'gi'), '').trim();
    }
    
    // Enlever le nombre de pièces
    if (pieces) {
      cleanedTitle = cleanedTitle.replace(/\d+\s*(pièces?|pieces?)/gi, '').trim();
    }
    
    // Enlever les dimensions (ex: 70x50, 70 x 50 cm, etc)
    cleanedTitle = cleanedTitle.replace(/\d+\s*[xX×]\s*\d+\s*(cm|mm)?/g, '').trim();
    
    // Nettoyer les tirets, virgules et espaces multiples
    cleanedTitle = cleanedTitle.replace(/^[\s\-,]+|[\s\-,]+$/g, '').replace(/\s+/g, ' ');
    
    return cleanedTitle;
  };

  const fetchPuzzleData = async (code) => {
    setBarcode(code);
    setLoading(true);
    setPuzzleData(null);
    setExistingPuzzle(null);
    setScanMessage(null);

    // ÉTAPE 1 : Vérifier si déjà dans la collection personnelle de l'utilisateur
    if (!skipCollectionAdd) {
      try {
        const user = await base44.auth.me();
        const existingInCollection = await base44.entities.UserPuzzle.filter({
          puzzle_reference: code,
          created_by: user.email
        });
        if (existingInCollection.length > 0) {
          setScanMessage({ type: 'error', text: '⚠️ Vous possédez déjà ce puzzle dans votre collection !' });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking user collection:', err);
      }
    }

    // ÉTAPE 2 : Vérification dans la base catalogue par EAN ET par ASIN (avant d'appeler Rainforest)
    try {
      // Chercher par EAN d'abord, puis par ASIN si rien trouvé
      let catalogResults = await base44.entities.PuzzleCatalog.filter({ ean: code });
      if (catalogResults.length === 0) {
        // Le code scanné pourrait être un ASIN (10 caractères alphanumériques commençant par B)
        catalogResults = await base44.entities.PuzzleCatalog.filter({ asin: code });
      }

      if (catalogResults.length > 0) {
        const catalogPuzzle = catalogResults[0];

        // Si le puzzle est en attente de validation, on stoppe ICI sans appel API
        if (catalogPuzzle.status === 'pending') {
          setScanMessage({
            type: 'pending',
            text: '🕐 Ce puzzle est déjà dans notre base de données, mais il est en cours de validation par notre équipe. Nous faisons le maximum pour le mettre en ligne rapidement !'
          });
          setLoading(false);
          return; // ← Pas d'appel API Rainforest
        }

        // Puzzle actif dans le catalogue communautaire
        setScanMessage({
          type: 'community',
          text: '✨ Super ! Ce puzzle fait déjà partie de la collection communautaire.'
        });
        setExistingPuzzle(catalogPuzzle);
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
          link: catalogPuzzle.asin ? `https://www.amazon.fr/dp/${catalogPuzzle.asin}?tag=puzzleworld-21` : '',
        };
        setPuzzleData(puzzleInfo);
        setLoading(false);
        if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);
        return;
      }
    } catch (err) {
      console.error('Error checking catalog:', err);
    }

    // ÉTAPE 3 : Puzzle inconnu → vérifier les crédits puis appel Rainforest
    if (isLimitReached) {
      const { dateStr, timeStr } = getResetInfo();
      setScanMessage({
        type: 'limit',
        text: `⏳ Limite journalière atteinte (${DAILY_LIMIT} scans/jour). Vos crédits se rechargent le ${dateStr} à ${timeStr}.`
      });
      setLoading(false);
      return;
    }

    try {
      let response;
      try {
        response = await base44.functions.invoke('lookupPuzzleByEan', { ean: code });
      } catch (axiosError) {
        const errData = axiosError?.response?.data;
        if (errData?.error === 'not_a_puzzle') {
          setScanMessage({ type: 'error', text: '🚫 ' + errData.message });
          setLoading(false);
          return;
        }
        if (errData?.error && (errData.error.includes('non trouvé') || errData.error.includes('introuvable') || axiosError?.response?.status === 404)) {
          setScanMessage({ type: 'error', text: '😕 Désolé, ce puzzle n\'est pas encore dans notre base. Ajoutez-le manuellement !' });
          setActiveTab('manual');
        } else {
          setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes ou ajoutez manuellement.' });
          setActiveTab('manual');
        }
        setLoading(false);
        return;
      }

      const result = response.data;

      if (result.error) {
        if (result.error === 'not_a_puzzle') {
          setScanMessage({ type: 'error', text: '🚫 ' + result.message });
          setLoading(false);
          return;
        }
        if (result.error.includes('trouvé') || result.error.includes('introuvable')) {
          setScanMessage({ type: 'error', text: '😕 Désolé, ce puzzle n\'est pas encore dans notre base. Ajoutez-le manuellement !' });
          setActiveTab('manual');
        } else {
          setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes.' });
        }
        setLoading(false);
        return;
      }

      // Puzzle trouvé dans le catalogue mais en attente (détecté via ASIN après appel Rainforest)
      if (result.status === 'pending' || result.source === 'catalog_pending') {
        setScanMessage({
          type: 'pending',
          text: '🕐 Ce puzzle est déjà dans notre base de données, mais il est en cours de validation par notre équipe. Nous faisons le maximum pour le mettre en ligne rapidement !'
        });
        setLoading(false);
        return;
      }

      // ÉTAPE 4 : Puzzle trouvé → consommer un crédit maintenant seulement
      await consumeCredit();

      const puzzleInfo = {
        catalog_id: result.catalog_id,
        name: result.title,
        title: result.title,
        brand: result.brand,
        image: result.image_hd,
        image_hd: result.image_hd,
        pieces: result.piece_count,
        piece_count: result.piece_count,
        asin: result.asin,
        ean: result.ean || code,
        sku: result.asin || code,
        dimensions: result.dimensions || '',
        category_tag: result.category_tag,
        amazon_price: result.amazon_price,
        amazon_rating: result.amazon_rating,
        link: result.asin ? `https://www.amazon.fr/dp/${result.asin}?tag=puzzleworld-21` : '',
        isPending: result.source === 'rainforest_new',
      };

      setPuzzleData(puzzleInfo);
      setLoading(false);

      if (skipCollectionAdd && onPuzzleAdded) onPuzzleAdded(puzzleInfo);
    } catch (error) {
      console.error('fetchPuzzleData error:', error);
      setScanMessage({ type: 'error', text: '😴 Désolé, notre scanner est fatigué ! Réessayez dans quelques secondes.' });
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualData.name || !manualData.pieces) {
      toast.error('Veuillez remplir au moins le nom et le nombre de pièces');
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
      piece_count: parseInt(manualData.pieces)
    };
    
    setPuzzleData(data);
    
    // If in post mode, call callback immediately
    if (skipCollectionAdd && onPuzzleAdded) {
      onPuzzleAdded(data);
    }
  };

  const handleUserPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUserPhoto(file_url);
      toast.success('Photo ajoutée !');
    } catch (err) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAddPuzzle = async (finalize = false) => {
    if (!puzzleData || !selectedStatus) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }

    // Ajouter au lot en attente
    const speedTotal = (parseInt(speedHours)||0)*3600 + (parseInt(speedMinutes)||0)*60 + (parseInt(speedSeconds)||0);
    const newBatch = [...pendingBatch, { 
      puzzleData: { ...puzzleData }, 
      selectedStatus, 
      rating: scanRating || null, 
      userPhoto: userPhoto || null,
      speedRecord: speedTotal > 0 ? { hours: parseInt(speedHours)||0, minutes: parseInt(speedMinutes)||0, seconds: parseInt(speedSeconds)||0, total_seconds: speedTotal } : null
    }];
    setPendingBatch(newBatch);

    if (finalize) {
      // Sauvegarder tout le lot
      await saveBatch(newBatch);
    } else {
      // Proposer de scanner un autre
      setShowAddAnother(true);
    }
  };

  const saveBatch = async (batch) => {
    try {
      setLoading(true);
      for (const { puzzleData: pd, selectedStatus: status, rating, userPhoto: photo, speedRecord } of batch) {
        let catalogPuzzleId = pd.catalog_id || null;
        if (!catalogPuzzleId && pd.isPending) {
          const newEntry = await base44.entities.PuzzleCatalog.create({
            title: pd.title || pd.name,
            brand: pd.brand || '',
            piece_count: pd.piece_count || pd.pieces || 0,
            image_hd: pd.image_hd || pd.image || '',
            ean: pd.ean || '',
            asin: pd.asin || '',
            category_tag: pd.category_tag || 'Autre',
            amazon_price: pd.amazon_price || null,
            amazon_rating: pd.amazon_rating || null,
            status: 'pending',
          });
          catalogPuzzleId = newEntry.id;
        }
        const refCode = pd.ean || pd.asin || pd.sku || barcode;

        const newUserPuzzle = await base44.entities.UserPuzzle.create({
          puzzle_name: pd.name || pd.title || '',
          puzzle_brand: pd.brand || '',
          puzzle_pieces: pd.pieces || pd.piece_count || 0,
          image_url: pd.image || pd.image_hd || '',
          puzzle_reference: refCode,
          catalog_puzzle_id: catalogPuzzleId,
          status,
          rating: rating || null,
          progress_photo: photo || null,
        });

        // Save speed record if provided
        if (speedRecord) {
          await base44.entities.SpeedRecord.create({
            puzzle_id: newUserPuzzle.id,
            puzzle_name: pd.name || pd.title || '',
            puzzle_brand: pd.brand || '',
            puzzle_pieces: pd.pieces || pd.piece_count || 0,
            image_url: pd.image || pd.image_hd || '',
            category_tag: pd.category_tag || '',
            hours: speedRecord.hours,
            minutes: speedRecord.minutes,
            seconds: speedRecord.seconds,
            total_seconds: speedRecord.total_seconds,
            record_date: new Date().toISOString().split('T')[0],
          });
        }

        if (catalogPuzzleId) {
          const catalogEntries = await base44.entities.PuzzleCatalog.filter({ id: catalogPuzzleId });
          if (catalogEntries.length > 0) {
            const cat = catalogEntries[0];
            const updates = { added_count: (cat.added_count || 0) + 1 };
            if (status === 'wishlist') updates.wishlistCount = (cat.wishlistCount || 0) + 1;
            await base44.entities.PuzzleCatalog.update(catalogPuzzleId, updates);
          }
        }
      }

      setLoading(false);
      setShowAddAnother(false);
      setShowSuccess(true);
      toast.success(`✅ ${batch.length} puzzle${batch.length > 1 ? 's' : ''} ajouté${batch.length > 1 ? 's' : ''} à votre collection !`);
      queryClient.invalidateQueries({ queryKey: ['userPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['completedPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['wishlistPuzzles'] });
      queryClient.invalidateQueries({ queryKey: ['globalPuzzles'] });
    } catch (error) {
      setLoading(false);
      console.error('Error saving batch:', error);
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
    setActiveTab(isMobile ? 'scanner' : 'manual');
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
    setActiveTab(isMobile ? 'scanner' : 'manual');
  };

  const handleNotMyPuzzle = () => {
    setShowNotMyPuzzle(true);
  };

  const handleGoManual = () => {
    setShowManualModal(true);
    setShowNotMyPuzzle(false);
  };

  const handleManualModalSubmit = (newPuzzleData) => {
    setShowManualModal(false);
    setShowNotMyPuzzle(false);
    setScanMessage(null);
    setPuzzleData(newPuzzleData);
    setPuzzleConfirmed(true);
  };



  const handleBarcodeSubmit = async () => {
    if (barcodeInput.length !== 13) {
      toast.error('Le code-barres doit contenir 13 chiffres');
      return;
    }
    await fetchPuzzleData(barcodeInput);
  };

  return (
    <div>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0a2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Ajouter un Puzzle</DialogTitle>
        </DialogHeader>

        {/* Guest mode block */}
        {isGuest && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <span className="text-5xl">🔒</span>
            <h3 className="text-white font-bold text-lg">Fonctionnalité réservée aux membres</h3>
            <p className="text-white/50 text-sm">Créez un compte gratuit pour scanner et ajouter des puzzles à votre collection.</p>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-6"
            >
              Se connecter / Créer un compte
            </Button>
            <button onClick={onClose} className="text-white/30 text-sm hover:text-white/60 transition-colors">Fermer</button>
          </div>
        )}

        {/* Main content — hidden for guests */}
        {!isGuest && (<>
        {/* Message d'état (erreur, communauté, nouveau) — affiché quand pas de puzzleData visible */}
        {!puzzleData && !showSuccess && scanMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 text-center text-sm font-medium border ${
              scanMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : scanMessage.type === 'community'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : scanMessage.type === 'limit'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                : scanMessage.type === 'pending'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}
          >
            {scanMessage.text}
          </motion.div>
        )}

        {/* Compteur de crédits restants */}
        {!isGuest && !creditsLoading && !showSuccess && (
          <div className={`flex items-center justify-center gap-2 text-xs rounded-lg px-3 py-2 ${
            remaining === 0
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : remaining <= 2
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
              : 'bg-white/5 text-white/40 border border-white/10'
          }`}>
            <span>🔍</span>
            <span>
              {remaining === 0
                ? `Limite atteinte — ${DAILY_LIMIT} scans utilisés aujourd'hui`
                : `${remaining} scan${remaining > 1 ? 's' : ''} API restant${remaining > 1 ? 's' : ''} aujourd'hui`}
            </span>
          </div>
        )}

        {!puzzleData && !showSuccess && scanMessage?.type !== 'pending' && (
          <>
            {isMobile ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10 w-full">
                  <TabsTrigger 
                    value="scanner" 
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1"
                  >
                    <Barcode className="w-4 h-4 mr-2" />
                    Scanner
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manual"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Saisie Manuelle
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="scanner" className="mt-4">
              <div className="space-y-4">
                {/* Hidden div for file scanning */}
                <div id="file-reader-temp" style={{ display: 'none' }}></div>

                {!cameraReady && !loading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                      <Barcode className="w-12 h-12 text-orange-400" />
                    </div>
                    <Button
                      onClick={handleActivateCamera}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      📸 Activer la Caméra
                    </Button>

                    <div className="w-full max-w-sm">
                      <div className="text-white/50 text-sm text-center mb-3">ou saisir le code-barres</div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="13 chiffres"
                            value={barcodeInput}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                              setBarcodeInput(value);
                            }}
                            className="bg-white/5 border-white/10 text-white text-center tracking-wider"
                            maxLength={13}
                          />
                        </div>
                        <Button
                          onClick={handleBarcodeSubmit}
                          disabled={barcodeInput.length !== 13}
                          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {cameraReady && (
                  <>
                    <div 
                      id="reader" 
                      ref={scannerRef}
                      className="w-full rounded-lg overflow-hidden bg-black/50 border border-white/10"
                      style={{ minHeight: '300px' }}
                    />
                    <p className="text-white/50 text-sm text-center">
                      Positionnez le code-barres devant la caméra
                    </p>
                  </>
                )}
                
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
                    <p className="text-white font-semibold">Recherche du puzzle en cours...</p>
                    <p className="text-white/50 text-sm">Nous récupérons les informations</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Nom du Puzzle *</label>
                  <Input
                    placeholder="Ex: Tour Eiffel au coucher de soleil"
                    value={manualData.name}
                    onChange={(e) => setManualData({...manualData, name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Marque</label>
                  <Input
                    placeholder="Ex: Ravensburger"
                    value={manualData.brand}
                    onChange={(e) => setManualData({...manualData, brand: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Nombre de Pièces *</label>
                  <Input
                    type="number"
                    placeholder="Ex: 1000"
                    value={manualData.pieces}
                    onChange={(e) => setManualData({...manualData, pieces: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Image URL</label>
                  <Input
                    placeholder="https://..."
                    value={manualData.image}
                    onChange={(e) => setManualData({...manualData, image: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Référence / SKU</label>
                  <Input
                    placeholder="Ex: 12345678"
                    value={manualData.sku}
                    onChange={(e) => setManualData({...manualData, sku: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Button
                  onClick={handleManualSubmit}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Continuer
                </Button>
              </div>
            </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="text-center mb-6">
                  <Barcode className="w-16 h-16 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-white text-lg font-semibold mb-1">Saisir le code-barres</h3>
                  <p className="text-white/60 text-sm">Entrez les 13 chiffres du code-barres</p>
                </div>

                {/* Visual guide */}
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                  <p className="text-white/70 text-xs text-center mb-3">Les chiffres se trouvent sous les barres :</p>
                  <div className="flex flex-col items-center gap-2">
                    {/* Barcode bars */}
                    <div className="flex gap-[2px] justify-center">
                      {[1,0,1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,0].map((bar, i) => (
                        <div 
                          key={i} 
                          className={`w-1 h-12 ${bar ? 'bg-black' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                    {/* Numbers with red box */}
                    <div className="relative">
                      <div className="absolute -top-1 -left-1 right-[-4px] bottom-[-4px] border-2 border-red-500 rounded animate-pulse"></div>
                      <div className="text-black font-mono text-sm tracking-wider bg-white px-2 py-1 rounded">
                        5 412345 678901
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="13 chiffres"
                      value={barcodeInput}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                        setBarcodeInput(value);
                      }}
                      className="bg-white/5 border-white/10 text-white text-center tracking-wider text-lg"
                      maxLength={13}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    onClick={handleBarcodeSubmit}
                    disabled={barcodeInput.length !== 13 || loading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'OK'}
                  </Button>
                </div>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
                    <p className="text-white font-semibold">Recherche du puzzle en cours...</p>
                  </div>
                )}
              </div>
            )}
            </>
            )}

          {/* Encadré puzzle personnalisé */}
          {!puzzleData && !showSuccess && !skipCollectionAdd && scanMessage?.type !== 'pending' && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowPersonalModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all group"
              >
                <span className="text-2xl">🧩</span>
                <div className="text-left">
                  <p className="text-purple-300 text-sm font-medium group-hover:text-purple-200">Ajouter un puzzle personnalisé</p>
                  <p className="text-white/30 text-xs">Non scannable · Visible uniquement dans votre collection</p>
                </div>
              </button>
            </div>
          )}

        {puzzleData && !showSuccess && !skipCollectionAdd && (
          <div className="space-y-4">
            {/* Image */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.4 }}
              className="rounded-lg overflow-hidden border border-white/10 bg-black/20 relative"
            >
              {puzzleData.image ? (
                <img 
                  src={puzzleData.image} 
                  alt={puzzleData.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-white/5">
                  <ImageIcon className="w-12 h-12 text-white/30" />
                </div>
              )}
            </motion.div>

            {/* Badge statut puzzle */}
            {scanMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className={`rounded-xl p-4 text-center text-sm font-medium border ${
                  scanMessage.type === 'community'
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                }`}
              >
                {scanMessage.text}
              </motion.div>
            )}

            {/* Informations du puzzle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-3"
            >
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <label className="text-white/50 text-xs mb-1 block">Nom du puzzle</label>
                <p className="text-white text-sm leading-relaxed break-words">{puzzleData.name || 'Non renseigné'}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <label className="text-white/50 text-xs mb-1 block">Marque</label>
                <p className="text-white text-sm">{puzzleData.brand || 'Non renseigné'}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/50 text-xs">Nombre de pièces</label>
                  {!editingPieces && (
                    <button
                      onClick={() => { setEditingPieces(true); setEditedPieces(String(puzzleData.pieces || '')); }}
                      className="text-orange-400 text-xs hover:text-orange-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Modifier
                    </button>
                  )}
                </div>
                {editingPieces ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={editedPieces}
                      onChange={(e) => setEditedPieces(e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const val = parseInt(editedPieces);
                        if (val > 0) {
                          setPuzzleData(prev => ({ ...prev, pieces: val, piece_count: val }));
                        }
                        setEditingPieces(false);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 h-8 px-3"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-white text-sm">{puzzleData.pieces ? `${puzzleData.pieces} pièces` : 'Non renseigné'}</p>
                )}
              </div>
              {puzzleData.dimensions && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <label className="text-white/50 text-xs mb-1 block">Dimensions</label>
                  <p className="text-white text-sm">{puzzleData.dimensions}</p>
                </div>
              )}
            </motion.div>

            {/* Étape de confirmation */}
            {showNotMyPuzzle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 bg-orange-500/5 border border-orange-500/20 rounded-xl p-5"
              >
                <div className="text-center">
                  <span className="text-3xl mb-3 block">🤔</span>
                  <p className="text-white font-semibold mb-1">Ce puzzle ne correspond pas ?</p>
                  <p className="text-white/50 text-sm">Vous pouvez l'ajouter manuellement avec les bonnes informations. Il sera mis en attente de validation.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleGoManual}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    ✏️ Ajouter manuellement
                  </Button>
                  <Button
                    onClick={() => setShowNotMyPuzzle(false)}
                    variant="ghost"
                    className="w-full text-white/50 hover:text-white hover:bg-white/5 text-sm"
                  >
                    ← Retour
                  </Button>
                </div>
              </motion.div>
            ) : !puzzleConfirmed ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="space-y-3"
              >
                <p className="text-white/70 text-sm text-center font-medium">C'est bien votre puzzle ?</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setPuzzleConfirmed(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✅ Oui, c'est lui !
                  </Button>
                  <Button
                    onClick={handleNotMyPuzzle}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                  >
                    ❌ Non, ce n'est pas lui
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* Status Selection */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Note ⭐ */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <label className="text-sm text-white/70 mb-3 block">Ma note pour ce puzzle (optionnel)</label>
                  <StarRating value={scanRating} onChange={setScanRating} size="lg" />
                  {scanRating > 0 && (
                    <p className="text-white/40 text-xs mt-2">
                      {['', 'Pas aimé 😕', 'Bof 😐', 'Bien 🙂', 'Très bien 😊', 'Excellent ! 🤩'][scanRating]}
                    </p>
                  )}
                </div>

                {/* 📷 Ma photo du puzzle */}
                <input ref={userPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUserPhotoUpload} />
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <label className="text-sm text-white/70 mb-3 block">📷 Ma photo du puzzle (optionnel)</label>
                  {userPhoto ? (
                    <div className="relative">
                      <img src={userPhoto} alt="Ma photo" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setUserPhoto(null)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => userPhotoInputRef.current?.click()}
                        className="absolute bottom-1.5 right-1.5 text-[10px] bg-orange-500/80 hover:bg-orange-500 text-white px-2 py-1 rounded-md transition-colors"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => userPhotoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</>
                      ) : (
                        <><Camera className="w-4 h-4" /> Ajouter ma photo du puzzle</>
                      )}
                    </button>
                  )}
                  <p className="text-white/30 text-xs mt-2">Votre photo personnelle · L'image officielle sera choisie par l'admin</p>
                </div>

                {/* ⚡ Temps record (optionnel) */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <button
                    type="button"
                    onClick={() => setShowSpeedInput(!showSpeedInput)}
                    className="w-full flex items-center justify-between"
                  >
                    <label className="text-sm text-white/70 cursor-pointer flex items-center gap-2">
                      <span className="text-orange-400">⚡</span> Temps record (optionnel)
                    </label>
                    <span className="text-white/30 text-xs">{showSpeedInput ? '▲ Masquer' : '▼ Ajouter'}</span>
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
                  {showSpeedInput && (parseInt(speedHours)||parseInt(speedMinutes)||parseInt(speedSeconds)) ? (
                    <p className="text-orange-400 text-sm text-center mt-2 font-mono">
                      ⚡ {(() => { const t = (parseInt(speedHours)||0)*3600+(parseInt(speedMinutes)||0)*60+(parseInt(speedSeconds)||0); const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60; return h>0?`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`:m>0?`${m}m ${String(s).padStart(2,'0')}s`:`${s}s`; })()}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm text-white/70 mb-3 block">Où voulez-vous ajouter ce puzzle ?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('wishlist')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedStatus === 'wishlist'
                          ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-yellow-500/50 hover:bg-yellow-500/10'
                      }`}
                    >
                      <span className="text-3xl">⭐</span>
                      <span className="text-sm font-medium">Wishlist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('inbox')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedStatus === 'inbox'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-blue-500/50 hover:bg-blue-500/10'
                      }`}
                    >
                      <span className="text-3xl">📦</span>
                      <span className="text-sm font-medium">Je l'ai chez moi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('in_progress')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedStatus === 'in_progress'
                          ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-orange-500/50 hover:bg-orange-500/10'
                      }`}
                    >
                      <span className="text-3xl">🧩</span>
                      <span className="text-sm font-medium">En cours</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('done')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedStatus === 'done'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-green-500/50 hover:bg-green-500/10'
                      }`}
                    >
                      <span className="text-3xl">✅</span>
                      <span className="text-sm font-medium">Terminé</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleAddPuzzle(false)}
                    disabled={!selectedStatus}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Barcode className="w-4 h-4 mr-2" />
                    Ajouter + Scanner un autre
                  </Button>
                  <Button
                    onClick={() => handleAddPuzzle(true)}
                    disabled={!selectedStatus}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Valider {pendingBatch.length > 0 ? `(${pendingBatch.length + 1} puzzle${pendingBatch.length + 1 > 1 ? 's' : ''})` : ''}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {showAddAnother && !showSuccess && (
          <div className="space-y-6 py-6">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 12 }}
                className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-white font-bold text-lg mb-1">Puzzle ajouté au lot !</h3>
              <p className="text-white/50 text-sm">{pendingBatch.length} puzzle{pendingBatch.length > 1 ? 's' : ''} en attente de sauvegarde</p>
            </div>

            {/* Résumé du lot */}
            <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10 max-h-40 overflow-y-auto">
              {pendingBatch.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  {item.puzzleData.image ? (
                    <img src={item.puzzleData.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🧩</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{item.puzzleData.name || item.puzzleData.title}</p>
                    <p className="text-white/40 text-xs">{item.selectedStatus === 'wishlist' ? '⭐ Wishlist' : item.selectedStatus === 'inbox' ? '📦 J\'ai chez moi' : item.selectedStatus === 'in_progress' ? '🧩 En cours' : '✅ Terminé'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleReset}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <Barcode className="w-4 h-4 mr-2" />
                Scanner un autre puzzle
              </Button>
              <Button
                onClick={() => saveBatch(pendingBatch)}
                disabled={loading}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/5"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Terminer & Sauvegarder ({pendingBatch.length} puzzle{pendingBatch.length > 1 ? 's' : ''})
              </Button>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="space-y-6 py-8">
            {/* Icône puzzle avec rebond */}
            <div className="flex justify-center items-center mb-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.1 }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40"
              >
                <span className="text-5xl">🧩</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-2">{pendingBatch.length > 0 ? `${pendingBatch.length} puzzles ajoutés !` : 'Puzzle ajouté !'}</h3>
              <p className="text-white/60 mb-2">Votre collection a été mise à jour</p>
              {puzzleData?.isPending && (
                <p className="text-yellow-400 text-sm mb-6">🎉 Merci d'avoir ajouté ce puzzle ! Il est en attente de validation par notre équipe avant d'apparaître dans le catalogue.</p>
              )}
              {!puzzleData?.isPending && <div className="mb-6" />}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleReset}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  📸 Scanner un autre puzzle
                </Button>

                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/5"
                >
                  ✓ Terminer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        </>)}
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