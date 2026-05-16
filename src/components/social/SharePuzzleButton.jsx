import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, X } from 'lucide-react';

const SITE_URL = 'https://puzzleworld-supabase.pages.dev';
const SITE_NAME = 'PuzzleWorld 🧩';

/**
 * SharePuzzleButton — Partage d'une fiche puzzle sur les réseaux sociaux
 * Props :
 *   puzzle  — objet user_puzzle (puzzle_name, puzzle_brand, puzzle_pieces, image_url, progress_photo, id)
 *   variant — 'button' (bouton plein, dans la modal) | 'menu-item' (ligne de dropdown, dans PuzzleCard)
 */
export default function SharePuzzleButton({ puzzle, variant = 'button' }) {
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Texte & URL de partage ─────────────────────────────────────────────────
  const puzzleUrl = `${SITE_URL}/profile`; // pas de page puzzle publique → on renvoie vers le profil
  const brandPart = puzzle.puzzle_brand ? ` de ${puzzle.puzzle_brand}` : '';
  const piecesPart = puzzle.puzzle_pieces ? ` (${puzzle.puzzle_pieces} pcs)` : '';
  const shareText = `Je viens de terminer "${puzzle.puzzle_name}"${brandPart}${piecesPart} 🧩 Découvrez ma collection sur ${SITE_NAME} !`;
  const imageUrl = puzzle.progress_photo || puzzle.image_url || null;

  const encodedUrl  = encodeURIComponent(puzzleUrl);
  const encodedText = encodeURIComponent(shareText);

  // ── Détection WebView Android ──────────────────────────────────────────────
  const isAndroidWebView =
    typeof window !== 'undefined' &&
    window.Android &&
    typeof window.Android.sharePost === 'function';

  // ── Partage Android natif ──────────────────────────────────────────────────
  const handleAndroidShare = (e) => {
    if (e) e.stopPropagation();
    window.Android.sharePost(shareText, puzzleUrl);
  };

  // ── Web Share API (mobile navigateur) ─────────────────────────────────────
  const handleNativeShare = async (e) => {
    if (e) e.stopPropagation();
    const shareData = { title: SITE_NAME, text: shareText, url: puzzleUrl };
    if (imageUrl && navigator.canShare) {
      try {
        const response = await fetch(imageUrl);
        const blob     = await response.blob();
        const file     = new File([blob], 'puzzle.jpg', { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
          return;
        }
      } catch { /* fallback sans image */ }
    }
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') setShowPanel(true);
    }
  };

  // ── Copier le lien ─────────────────────────────────────────────────────────
  const handleCopy = async (e) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(puzzleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT "menu-item" — simple ligne cliquable pour le DropdownMenu
  // ══════════════════════════════════════════════════════════════════════════
  if (variant === 'menu-item') {
    const handleClick = (e) => {
      if (e) e.stopPropagation();
      if (isAndroidWebView)                         handleAndroidShare(e);
      else if (typeof navigator !== 'undefined' && navigator.share) handleNativeShare(e);
      else                                          setShowPanel(true);
    };

    return (
      <>
        <button
          onClick={handleClick}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-purple-400 hover:bg-white/10 rounded transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Partager sur les réseaux
        </button>

        {/* Panel desktop (si Web Share API indisponible) */}
        {showPanel && (
          <SharePanel
            shareText={shareText}
            encodedUrl={encodedUrl}
            encodedText={encodedText}
            puzzleName={puzzle.puzzle_name}
            onClose={() => setShowPanel(false)}
            onCopy={handleCopy}
            copied={copied}
            anchorBottom={false}
          />
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT "button" — bouton plein dans UserPuzzleDetailModal
  // ══════════════════════════════════════════════════════════════════════════

  // Android WebView → bouton direct
  if (isAndroidWebView) {
    return (
      <button
        onClick={handleAndroidShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Partager sur les réseaux 📲
      </button>
    );
  }

  // Mobile navigateur → Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    return (
      <button
        onClick={handleNativeShare}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Partager sur les réseaux 📲
      </button>
    );
  }

  // Desktop → bouton qui ouvre le panel
  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Partager sur les réseaux 📲
      </button>

      {showPanel && (
        <SharePanel
          shareText={shareText}
          encodedUrl={encodedUrl}
          encodedText={encodedText}
          puzzleName={puzzle.puzzle_name}
          onClose={() => setShowPanel(false)}
          onCopy={handleCopy}
          copied={copied}
          anchorBottom={true}
        />
      )}
    </div>
  );
}

// ── Panel réseaux sociaux (commun aux deux variants desktop) ─────────────────
function SharePanel({ shareText, encodedUrl, encodedText, puzzleName, onClose, onCopy, copied, anchorBottom }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute ${anchorBottom ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/50`}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold">Partager ce puzzle</p>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {puzzleName && (
          <p className="text-white/40 text-xs mb-3 line-clamp-2 italic">🧩 {puzzleName}</p>
        )}

        <div className="flex flex-col gap-2">
          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
              <Facebook size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-medium">Facebook</p>
              <p className="text-white/40 text-[10px]">Partager sur ta page</p>
            </div>
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-black border border-white/20 flex items-center justify-center flex-shrink-0">
              <Twitter size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-medium">X (Twitter)</p>
              <p className="text-white/40 text-[10px]">Tweeter ce puzzle</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-medium">WhatsApp</p>
              <p className="text-white/40 text-[10px]">Envoyer en message</p>
            </div>
          </a>

          {/* Copier le lien */}
          <button
            onClick={onCopy}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors w-full text-left"
          >
            <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
              {copied
                ? <Check size={14} className="text-green-400" />
                : <Copy size={14} className="text-white/70" />}
            </div>
            <div>
              <p className={`text-xs font-medium transition-colors ${copied ? 'text-green-400' : 'text-white'}`}>
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </p>
              <p className="text-white/40 text-[10px]">Partager où tu veux</p>
            </div>
          </button>
        </div>

        <p className="text-white/20 text-[10px] text-center mt-3">🧩 Partagé depuis PuzzleWorld</p>
      </div>
    </>
  );
}
