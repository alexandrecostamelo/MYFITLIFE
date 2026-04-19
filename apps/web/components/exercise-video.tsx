'use client';

import { useState } from 'react';
import { Play, Youtube } from 'lucide-react';

function youtubeIdFromUrl(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function ExerciseVideo({ url, source }: { url: string | null; source?: string | null }) {
  const [playing, setPlaying] = useState(false);

  if (!url) return null;

  const videoSource = source || (url.includes('youtube') || url.includes('youtu.be') ? 'youtube' : 'direct');

  if (videoSource === 'youtube') {
    const id = youtubeIdFromUrl(url);
    if (!id) return null;

    if (!playing) {
      return (
        <button
          onClick={() => setPlaying(true)}
          className="group relative block w-full overflow-hidden rounded-lg bg-black"
        >
          <img
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt="Prévia do vídeo"
            className="w-full opacity-80 transition group-hover:opacity-100"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-red-600 p-3 shadow-lg">
              <Play className="h-6 w-6 fill-white text-white" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            <Youtube className="h-3 w-3" /> YouTube
          </div>
        </button>
      );
    }

    return (
      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video controls className="w-full rounded-lg">
      <source src={url} />
    </video>
  );
}
