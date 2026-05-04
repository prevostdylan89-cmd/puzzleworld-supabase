import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, X, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ASPECT_PRESETS = [
  { label: 'Libre', value: null },
  { label: '1:1 Carré', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '½ article', value: 3 / 4 }, // portrait for half-column
];

export default function ImageCropModal({ imageUrl, onConfirm, onClose }) {
  const imgRef = useRef(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [dragging, setDragging] = useState(null);
  const [startData, setStartData] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [noPreview, setNoPreview] = useState(false);

  const onImgLoad = () => {
    const img = imgRef.current;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplaySize({ w, h });
    setCrop({ x: 0, y: 0, w, h });
    setImgLoaded(true);
  };

  // Draw live preview
  useEffect(() => {
    if (!imgLoaded || !previewRef.current || noPreview || !displaySize.w) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const srcX = Math.max(0, Math.round(crop.x * scaleX));
    const srcY = Math.max(0, Math.round(crop.y * scaleY));
    const srcW = Math.max(1, Math.round(crop.w * scaleX));
    const srcH = Math.max(1, Math.round(crop.h * scaleY));

    const previewW = 220;
    const previewH = Math.max(1, Math.round(previewW * srcH / srcW));
    canvas.width = previewW;
    canvas.height = previewH;

    try {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, previewW, previewH);
    } catch (e) {
      setNoPreview(true);
    }
  }, [crop, imgLoaded, naturalSize, displaySize, noPreview]);

  const clamp = useCallback((c, aspect) => {
    const { w: imgW, h: imgH } = displaySize;
    const minSize = 20;
    let { x, y, w, h } = c;

    w = Math.max(minSize, w);
    h = Math.max(minSize, h);

    if (aspect) h = w / aspect;

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + w > imgW) { w = imgW - x; if (aspect) h = w / aspect; }
    if (y + h > imgH) { h = imgH - y; if (aspect) w = h * aspect; }
    if (w < minSize) w = minSize;
    if (h < minSize) h = minSize;

    return { x, y, w, h };
  }, [displaySize]);

  const handleMouseDown = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    setStartData({ mx: e.clientX, my: e.clientY, crop: { ...crop } });
  }, [crop]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !startData) return;
    const dx = e.clientX - startData.mx;
    const dy = e.clientY - startData.my;
    const { x: sx, y: sy, w: sw, h: sh } = startData.crop;
    let nc = { ...startData.crop };

    switch (dragging) {
      case 'move': nc.x = sx + dx; nc.y = sy + dy; break;
      case 'tl': nc.x = sx + dx; nc.y = sy + dy; nc.w = sw - dx; nc.h = sh - dy; break;
      case 'tr': nc.y = sy + dy; nc.w = sw + dx; nc.h = sh - dy; break;
      case 'bl': nc.x = sx + dx; nc.w = sw - dx; nc.h = sh + dy; break;
      case 'br': nc.w = sw + dx; nc.h = sh + dy; break;
      case 'tm': nc.y = sy + dy; nc.h = sh - dy; break;
      case 'bm': nc.h = sh + dy; break;
      case 'ml': nc.x = sx + dx; nc.w = sw - dx; break;
      case 'mr': nc.w = sw + dx; break;
      default: break;
    }

    setCrop(clamp(nc, aspectRatio));
  }, [dragging, startData, clamp, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setStartData(null);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const applyAspect = (ratio) => {
    setAspectRatio(ratio);
    if (ratio && displaySize.w) {
      setCrop(prev => clamp({ ...prev, h: prev.w / ratio }, ratio));
    }
  };

  const handleConfirm = async () => {
    setUploading(true);
    const img = imgRef.current;
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const srcX = Math.round(Math.max(0, crop.x * scaleX));
    const srcY = Math.round(Math.max(0, crop.y * scaleY));
    const srcW = Math.round(Math.min(crop.w * scaleX, naturalSize.w - srcX));
    const srcH = Math.round(Math.min(crop.h * scaleY, naturalSize.h - srcY));

    const canvas = document.createElement('canvas');
    canvas.width = srcW;
    canvas.height = srcH;
    const ctx = canvas.getContext('2d');

    const doUpload = async (sourceImg) => {
      ctx.drawImage(sourceImg, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      onConfirm(file_url);
    };

    // Try using the already-loaded img first
    try {
      await doUpload(img);
    } catch (e) {
      // CORS issue: re-fetch with crossOrigin
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => doUpload(tempImg);
      tempImg.onerror = () => { setUploading(false); onConfirm(imageUrl); };
      tempImg.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + '_cb=' + Date.now();
    }
  };

  const cropNatW = displaySize.w ? Math.round(crop.w * naturalSize.w / displaySize.w) : 0;
  const cropNatH = displaySize.h ? Math.round(crop.h * naturalSize.h / displaySize.h) : 0;

  const handles = imgLoaded ? [
    { type: 'tl', style: { left: crop.x - 5, top: crop.y - 5, cursor: 'nwse-resize' } },
    { type: 'tr', style: { left: crop.x + crop.w - 5, top: crop.y - 5, cursor: 'nesw-resize' } },
    { type: 'bl', style: { left: crop.x - 5, top: crop.y + crop.h - 5, cursor: 'nesw-resize' } },
    { type: 'br', style: { left: crop.x + crop.w - 5, top: crop.y + crop.h - 5, cursor: 'nwse-resize' } },
    { type: 'tm', style: { left: crop.x + crop.w / 2 - 4, top: crop.y - 4, cursor: 'ns-resize' } },
    { type: 'bm', style: { left: crop.x + crop.w / 2 - 4, top: crop.y + crop.h - 4, cursor: 'ns-resize' } },
    { type: 'ml', style: { left: crop.x - 4, top: crop.y + crop.h / 2 - 4, cursor: 'ew-resize' } },
    { type: 'mr', style: { left: crop.x + crop.w - 4, top: crop.y + crop.h / 2 - 4, cursor: 'ew-resize' } },
  ] : [];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d30] border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-orange-400" />
            <h2 className="text-white font-semibold">Rogner l'image</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Aspect presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-xs">Format :</span>
            {ASPECT_PRESETS.map(p => (
              <button key={p.label} onClick={() => applyAspect(p.value)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${aspectRatio === p.value ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-5 items-start flex-wrap lg:flex-nowrap">
            {/* Crop area */}
            <div className="flex-1 min-w-0">
              <div ref={containerRef} className="relative inline-block select-none overflow-hidden rounded-lg"
                style={{ userSelect: 'none', maxWidth: '100%' }}>
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="to crop"
                  crossOrigin="anonymous"
                  onLoad={onImgLoad}
                  className="block max-h-[45vh] max-w-full"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  draggable={false}
                />
                {imgLoaded && (
                  <>
                    {/* Dark overlay: 4 divs around crop */}
                    <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: 0, width: displaySize.w, height: crop.y }} />
                    <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: crop.y + crop.h, width: displaySize.w, bottom: 0, height: displaySize.h - crop.y - crop.h }} />
                    <div className="absolute bg-black/55 pointer-events-none" style={{ left: 0, top: crop.y, width: crop.x, height: crop.h }} />
                    <div className="absolute bg-black/55 pointer-events-none" style={{ left: crop.x + crop.w, top: crop.y, width: displaySize.w - crop.x - crop.w, height: crop.h }} />

                    {/* Crop box border + grid */}
                    <div className="absolute border-2 border-orange-400 pointer-events-none" style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}>
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                        backgroundSize: '33.33% 33.33%'
                      }} />
                    </div>

                    {/* Move handle */}
                    <div className="absolute cursor-move"
                      style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                      onMouseDown={e => handleMouseDown(e, 'move')} />

                    {/* Resize handles */}
                    {handles.map(({ type, style }) => (
                      <div key={type}
                        className="absolute w-2.5 h-2.5 bg-orange-400 border border-white rounded-sm z-10"
                        style={style}
                        onMouseDown={e => handleMouseDown(e, type)} />
                    ))}
                  </>
                )}
              </div>
              {imgLoaded && (
                <p className="text-white/30 text-xs mt-2">
                  Sélection : <span className="text-orange-400 font-medium">{cropNatW} × {cropNatH} px</span>
                  {aspectRatio && <span className="ml-2 text-white/20">· format {ASPECT_PRESETS.find(p => p.value === aspectRatio)?.label} verrouillé</span>}
                </p>
              )}
            </div>

            {/* Live preview */}
            <div className="w-56 flex-shrink-0 space-y-3">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Aperçu en direct</p>

              {noPreview ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-white/30 text-xs text-center">
                  Aperçu indisponible pour cette source
                </div>
              ) : (
                <div className="bg-black/30 rounded-lg overflow-hidden border border-white/10">
                  <canvas ref={previewRef} className="w-full h-auto block" />
                </div>
              )}

              {/* Half-column simulation */}
              <div className="space-y-1.5">
                <p className="text-white/30 text-[10px] uppercase tracking-wider">Dans une demi-colonne :</p>
                <div className="flex gap-1 h-20 rounded-lg overflow-hidden border border-white/10">
                  {/* Left half - the image */}
                  <div className="w-1/2 h-full bg-black/20 overflow-hidden rounded-l-lg">
                    {!noPreview ? (
                      <canvas ref={null} id="col-preview" className="w-full h-full object-cover" style={{ display: 'none' }} />
                    ) : null}
                    <div className="w-full h-full bg-orange-500/10 flex items-center justify-center">
                      <span className="text-orange-400/50 text-[8px] font-semibold">IMAGE</span>
                    </div>
                  </div>
                  {/* Right half - text simulation */}
                  <div className="w-1/2 h-full bg-white/3 p-1.5 space-y-1 flex flex-col justify-center">
                    <div className="h-1.5 bg-white/20 rounded w-full" />
                    <div className="h-1.5 bg-white/15 rounded w-4/5" />
                    <div className="h-1.5 bg-white/10 rounded w-full" />
                    <div className="h-1.5 bg-white/10 rounded w-3/4" />
                    <div className="h-1.5 bg-white/10 rounded w-5/6" />
                  </div>
                </div>
                <p className="text-white/20 text-[9px]">Aspect recommandé : 3:4 ou 1:1</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} className="text-white/50">Annuler</Button>
          <Button onClick={handleConfirm} disabled={uploading || !imgLoaded}
            className="bg-orange-500 hover:bg-orange-600 text-white">
            {uploading
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Upload...</>
              : <><Check className="w-4 h-4 mr-2" />Appliquer le rognage</>}
          </Button>
        </div>
      </div>
    </div>
  );
}