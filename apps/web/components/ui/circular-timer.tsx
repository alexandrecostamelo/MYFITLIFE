'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';

interface Props {
  totalSeconds: number;
  exerciseName: string;
  nextExercise?: string;
  onComplete?: () => void;
  onSkip?: () => void;
  size?: number;
}

export function CircularTimer({
  totalSeconds,
  exerciseName,
  nextExercise,
  onComplete,
  onSkip,
  size = 240,
}: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(true);
  }, [totalSeconds, exerciseName]);

  useEffect(() => {
    clearTimer();
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearTimer();
            onComplete?.();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return clearTimer;
  }, [running, remaining > 0, clearTimer, onComplete]);

  const progress = remaining / totalSeconds;
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  const center = size / 2;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Exercise name */}
      <p className="text-sm font-semibold text-foreground text-center">{exerciseName}</p>

      {/* Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 linear"
          />
        </svg>
        {/* Center time */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-5xl font-light tracking-tight text-foreground">
            {display}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setRunning(!running)}
          className="h-14 w-14 rounded-full glass-card-elevated flex items-center justify-center transition-transform active:scale-95"
        >
          {running ? (
            <Pause className="h-6 w-6 text-foreground" />
          ) : (
            <Play className="h-6 w-6 text-foreground ml-0.5" />
          )}
        </button>
        <button
          onClick={() => {
            clearTimer();
            setRemaining(0);
            onSkip?.();
          }}
          className="h-12 w-12 rounded-full glass-card flex items-center justify-center transition-transform active:scale-95"
        >
          <SkipForward className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Next exercise preview */}
      {nextExercise && (
        <p className="text-xs text-muted-foreground">
          Próximo: <span className="text-foreground font-medium">{nextExercise}</span>
        </p>
      )}
    </div>
  );
}
