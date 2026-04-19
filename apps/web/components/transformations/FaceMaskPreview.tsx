'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFaceDetection, type DetectedFace } from '@/lib/hooks/useFaceDetection';

interface Props {
  /** Public URL of the progress photo (from Supabase storage) */
  photoUrl: string;
  /** Whether to render the mask overlay on the canvas */
  showMask: boolean;
  onFacesDetected: (faces: DetectedFace[], imageWidth: number, imageHeight: number) => void;
}

function drawMaskedCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  faces: DetectedFace[],
  showMask: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  if (!showMask) return;

  if (faces.length > 0) {
    for (const f of faces) {
      const cx = f.x + f.width / 2;
      const cy = f.y + f.height / 2;
      const rx = (f.width / 2) * 1.15;
      const ry = (f.height / 2) * 1.25;
      ctx.fillStyle = 'rgba(0,0,0,0.95)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Heuristic fallback: match server-side buildAnonymizeSVG
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const cx = w / 2;
    const cy = h * 0.22;
    const rx = w * 0.18;
    const ry = h * 0.13;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function FaceMaskPreview({ photoUrl, showMask, onFacesDetected }: Props) {
  const { state, detect } = useFaceDetection();
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image and run detection when detector is ready
  useEffect(() => {
    if (state !== 'ready') return;
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    imgRef.current = img;

    img.onload = async () => {
      setImgReady(true);
      setDetecting(true);
      try {
        const bitmap = await createImageBitmap(img);
        const detected = await detect(bitmap);
        bitmap.close();
        if (cancelled) return;
        setFaces(detected);
        onFacesDetected(detected, img.naturalWidth, img.naturalHeight);
      } catch (err) {
        console.error('[FaceMaskPreview] detection error:', err);
        if (!cancelled) onFacesDetected([], img.naturalWidth, img.naturalHeight);
      } finally {
        if (!cancelled) setDetecting(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setImgReady(true);
        setDetecting(false);
      }
    };
    img.src = photoUrl;

    return () => { cancelled = true; };
  }, [state, photoUrl, detect, onFacesDetected]);

  // Redraw canvas whenever faces or showMask changes
  useEffect(() => {
    if (!imgReady || !canvasRef.current || !imgRef.current) return;
    drawMaskedCanvas(canvasRef.current, imgRef.current, faces, showMask);
  }, [faces, showMask, imgReady]);

  // Notify parent when detector errors so it can still submit (will use server fallback)
  const notifyError = useCallback(() => {
    onFacesDetected([], 0, 0);
  }, [onFacesDetected]);

  useEffect(() => {
    if (state === 'error') notifyError();
  }, [state, notifyError]);

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-square max-w-[280px] overflow-hidden rounded-lg border bg-muted">
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
        {/* Show original image if canvas not yet drawn */}
        {!imgReady && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {(state === 'loading' || detecting) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              Detectando rostos...
            </div>
          </div>
        )}
      </div>
      <div className="text-[11px]">
        {state === 'error' && (
          <p className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            Detecção indisponível — máscara padrão será aplicada
          </p>
        )}
        {state === 'ready' && !detecting && faces.length === 0 && imgReady && (
          <p className="text-muted-foreground">
            Nenhum rosto detectado — máscara padrão será aplicada por precaução
          </p>
        )}
        {state === 'ready' && faces.length > 0 && (
          <p className="flex items-center gap-1 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
            {faces.length} rosto(s) detectado(s) e será(ão) anonimizado(s)
          </p>
        )}
      </div>
    </div>
  );
}
