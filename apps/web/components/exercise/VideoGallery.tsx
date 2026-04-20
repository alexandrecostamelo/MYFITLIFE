'use client';

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { videoTypeLabel, type ExerciseVideo } from '@/lib/exercise-videos';

interface Props {
  videos: ExerciseVideo[];
}

export function VideoGallery({ videos }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!videos || videos.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
        Vídeo em breve
      </div>
    );
  }

  const active = videos[activeIdx];

  return (
    <div className="space-y-3">
      <VideoPlayer video={active} />

      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {videos.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setActiveIdx(i)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                i === activeIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70'
              }`}
            >
              {videoTypeLabel(v.video_type)}
            </button>
          ))}
        </div>
      )}

      {active.video_type === 'mistakes' && (
        <span className="inline-block rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
          Erros comuns — preste atenção
        </span>
      )}
    </div>
  );
}
