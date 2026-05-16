import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, X } from 'lucide-react';

const SITE_URL = 'https://puzzleworld-supabase.pages.dev';
const SITE_NAME = 'PuzzleWorld 🧩';

export default function SharePostButton({ post }) {
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const postUrl = `${SITE_URL}/og?ogpost=${post.id}`;
  const authorName = post.author_name || post.created_by?.split('@')[0] || 'Un puzzleur';
  const postContent = post.content
    ? post.content.slice(0, 120) + (post.content.length > 120 ? '...' : '')
    : '';
  const puzzleInfo = post.puzzle_name ? ` 🧩 ${post.puzzle_name}` : '';
  const shareText = `${postContent}${puzzleInfo}\n\n— ${authorName} sur ${SITE_NAME}`;

  const encodedUrl = encodeURIComponent(postUrl);
  const encodedText = encodeURIComponent(shareText);

  // ── Détection WebView Android ──────────────────────────────────────────────
  const isAndroidWebView = typeof window !== 'undefined' && window.Android && typeof window.Android.sharePost === 'function';

  // ── Partage Android natif (ouvre le vrai menu Android) ────────────────────
  const handleAndroidShare = () => {
    window.Android.sharePost(shareText, postUrl);
  };

  // ── Web Share API (mobile navigateur hors WebView) ─────────────────────────
  const handleNativeShare = async () => {
    const shareData = { title: SITE_NAME, text: shareText, url: postUrl };
    if (post.image_url && navigator.canShare) {
      try {
        const response = await fetch(post.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'puzzle.jpg', { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
          return;
        }
      } catch {
        // fallback sans image
      }
    }
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') setShowPanel(true);
    }
  };

  // ── Copier le lien ─────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // ── CAS 1 : WebView Android → bouton unique, menu natif Android ───────────
  if (isAndroidWebView) {
    return (
      <button
        onClick={handleAndroidShare}
        className="flex items-center gap-1.5 text-white/50 hover:text-orange-400 transition-colors group"
        title="Partager"
      >
        <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Partager</span>
      </button>
    );
  }

  // ── CAS 2 : Mobile navigateur avec Web Share API ───────────────────────────
  if (typeof navigator !== 'undefined' && navigator.share) {
    return (
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-1.5 text-white/50 hover:text-orange-400 transition-colors group"
        title="Partager"
      >
        <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Partager</span>
      </button>
    );
  }

  // ── CAS 3 : Desktop → panel avec boutons réseaux ──────────────────────────
  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1.5 text-white/50 hover:text-orange-400 transition-colors group"
        title="Partager"
      >
        <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">Partager</span>
      </button>

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />

          <div className="absolute bottom-8 right-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/50 w-64">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-sm font-semibold">Partager ce post</p>
              <button onClick={() => setShowPanel(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {postContent && (
              <p className="text-white/40 text-xs mb-3 line-clamp-2 italic">"{postContent}"</p>
            )}

            <div className="flex flex-col gap-2">

              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareText); setTextCopied(true); setTimeout(() => setTextCopied(false), 3000); } catch {}
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 transition-colors w-full text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                  <Facebook size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-medium">Facebook</p>
                  <p className={`text-[10px] transition-colors ${textCopied ? 'text-green-400 font-medium' : 'text-white/40'}`}>
                    {textCopied ? '✓ Texte copié ! Colle-le dans Facebook' : 'Texte copié automatiquement'}
                  </p>
                </div>
              </button>

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
                  <p className="text-white/40 text-[10px]">Tweeter ce post</p>
                </div>
              </a>

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

              <button
                onClick={handleCopy}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors w-full text-left"
              >
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/70" />}
                </div>
                <div>
                  <p className={`text-xs font-medium transition-colors ${copied ? 'text-green-400' : 'text-white'}`}>
                    {copied ? 'Lien copié !' : 'Copier le lien'}
                  </p>
                  <p className="text-white/40 text-[10px]">Partager où tu veux</p>
                </div>
              </button>

            </div>

            <p className="text-white/20 text-[10px] text-center mt-3">🧩 Le lien inclut un aperçu PuzzleWorld</p>
          </div>
        </>
      )}
    </div>
  );
}
