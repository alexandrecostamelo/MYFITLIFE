'use client';

import { useEffect, useRef, useState } from 'react';

export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

type DetectorState = 'idle' | 'loading' | 'ready' | 'error';

// Singleton: load the detector once and reuse across instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let detectorPromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDetector(): Promise<any> {
  if (detectorPromise) return detectorPromise;
  detectorPromise = (async () => {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    );
    return FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      },
      runningMode: 'IMAGE',
    });
  })();
  return detectorPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFaces(result: any): DetectedFace[] {
  const faces: DetectedFace[] = [];
  for (const d of result.detections || []) {
    const bb = d.boundingBox;
    if (!bb) continue;
    faces.push({
      x: bb.originX,
      y: bb.originY,
      width: bb.width,
      height: bb.height,
      confidence: d.categories?.[0]?.score || 0,
    });
  }
  return faces;
}

export function useFaceDetection() {
  const [state, setState] = useState<DetectorState>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState('loading');
      try {
        const d = await getDetector();
        if (!cancelled) {
          detectorRef.current = d;
          setState('ready');
        }
      } catch (err) {
        console.error('[FaceDetector] load failed:', err);
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const detect = async (
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): Promise<DetectedFace[]> => {
    if (!detectorRef.current) throw new Error('Detector not ready');
    const result = detectorRef.current.detect(imageSource);
    return extractFaces(result);
  };

  return { state, detect };
}

/**
 * One-shot detection from an image URL (no React hooks needed).
 */
export async function detectFacesFromUrl(url: string): Promise<{ faces: DetectedFace[]; width: number; height: number }> {
  const detector = await getDetector();

  const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => createImageBitmap(img).then(resolve).catch(reject);
    img.onerror = reject;
    img.src = url;
  });

  const result = detector.detect(bitmap);
  const faces = extractFaces(result);
  const { width, height } = bitmap;
  bitmap.close();
  return { faces, width, height };
}
