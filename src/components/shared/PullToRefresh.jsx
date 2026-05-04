import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const THRESHOLD = 120;       // Distance nécessaire pour déclencher le refresh
const MIN_PULL_START = 50;   // Mouvement minimum avant d'activer le pull (évite les faux déclenchements)
const MAX_ANGLE = 35;        // Angle max en degrés par rapport à vertical (évite les glissements horizontaux)

export default function PullToRefresh({ children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(null);
  const startXRef = useRef(null);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const el = document.getElementById('pull-scroll-container');
    if (!el) return;

    const isInsideScrollableChild = (target) => {
      let node = target;
      while (node && node !== el) {
        if (node.scrollTop > 0) return true;
        const style = window.getComputedStyle(node);
        const overflow = style.overflow + style.overflowY;
        if (/(auto|scroll)/.test(overflow) && node.scrollHeight > node.clientHeight) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const onTouchStart = (e) => {
      // Strict : le container doit être exactement à 0 ET pas en train de refresh
      if (el.scrollTop !== 0 || isRefreshingRef.current || isInsideScrollableChild(e.target)) {
        startYRef.current = null;
        startXRef.current = null;
        isPullingRef.current = false;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = false;
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;

      // Si l'utilisateur a scrollé entre temps, annuler
      if (el.scrollTop > 0) {
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
        startYRef.current = null;
        startXRef.current = null;
        return;
      }

      const dy = e.touches[0].clientY - startYRef.current;
      const dx = e.touches[0].clientX - startXRef.current;

      // Mouvement vers le haut → annuler
      if (dy <= 0) {
        if (isPullingRef.current) {
          isPullingRef.current = false;
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      // Vérifier l'angle du geste : si trop horizontal, ne pas activer
      const angle = Math.abs(Math.atan2(Math.abs(dx), dy) * (180 / Math.PI));
      if (!isPullingRef.current && angle > MAX_ANGLE) {
        // Geste trop horizontal → annuler complètement
        startYRef.current = null;
        startXRef.current = null;
        return;
      }

      // Activer le pull seulement après un geste intentionnel vers le bas
      if (!isPullingRef.current && dy > MIN_PULL_START) {
        isPullingRef.current = true;
      }

      if (isPullingRef.current) {
        e.preventDefault();
        const dist = Math.min(dy * 0.35, THRESHOLD + 20);
        pullDistanceRef.current = dist;
        setPullDistance(dist);
      }
    };

    const onTouchEnd = () => {
      if (!isPullingRef.current) return;

      if (pullDistanceRef.current >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } else {
        setPullDistance(0);
      }

      startYRef.current = null;
      startXRef.current = null;
      isPullingRef.current = false;
      pullDistanceRef.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const triggered = pullDistance >= THRESHOLD;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Indicateur pull-to-refresh */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${pullDistance}px`,
          overflow: 'hidden',
          zIndex: 100,
          transition: pullDistance === 0 ? 'height 0.2s ease' : 'none',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(249,115,22,0.15)',
            border: '2px solid rgba(249,115,22,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
            transition: 'none',
          }}
        >
          {isRefreshing ? (
            <Loader2 style={{ width: 16, height: 16, color: '#f97316', animation: 'spin 1s linear infinite' }} />
          ) : (
            <RefreshCw style={{ width: 16, height: 16, color: triggered ? '#f97316' : '#9a9a9a' }} />
          )}
        </div>
      </div>

      {/* Contenu décalé */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}