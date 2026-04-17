'use client';

import { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onPhotoSelected: (file: File) => void;
  disabled?: boolean;
};

export function PhotoCapture({ onPhotoSelected, disabled }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert('Foto muito grande. Máximo 10MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    onPhotoSelected(file);
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }

  return (
    <div>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-md" />
          <button
            onClick={clear}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => cameraInputRef.current?.click()}
            className="flex h-24 flex-col gap-1"
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Tirar foto</span>
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => galleryInputRef.current?.click()}
            className="flex h-24 flex-col gap-1"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Galeria</span>
          </Button>
        </div>
      )}
    </div>
  );
}
