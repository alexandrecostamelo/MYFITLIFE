'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVideoUrl, getThumbnailUrl, type ExerciseVideo } from '@/lib/exercise-videos';

interface Props {
  video: ExerciseVideo;
  autoPlay?: boolean;
}

export function VideoPlayer({ video, autoPlay = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [slowMo, setSlowMo] = useState(false);
  const [hasError, setHasError] = useState(false);

  const url = getVideoUrl(video);
  const thumb = getThumbnailUrl(video);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = slowMo ? 0.5 : 1;
    }
  }, [slowMo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setPlaying(true);
  };

  if (!url || hasError) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Vídeo indisponível
      </div>
    );
  }

  if (video.youtube_id) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={url}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vídeo do exercício"
        />
      </div>
    );
  }

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={url}
        poster={thumb || undefined}
        className="h-full w-full object-contain"
        loop
        muted={muted}
        playsInline
        autoPlay={autoPlay}
        onError={() => setHasError(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      />

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="secondary" onClick={togglePlay} className="h-9 w-9">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={slowMo ? 'default' : 'secondary'}
            onClick={() => setSlowMo((s) => !s)}
            className="h-9 px-2 font-mono text-xs"
          >
            {slowMo ? '0.5x' : '1x'}
          </Button>
          <Button size="icon" variant="secondary" onClick={restart} className="h-9 w-9">
            <Rewind className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={() => setMuted((m) => !m)} className="h-9 w-9">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
