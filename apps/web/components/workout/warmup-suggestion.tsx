'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Flame,
  ChevronDown,
  ChevronUp,
  Play,
  SkipForward,
} from 'lucide-react';

interface WarmupExercise {
  name: string;
  duration_sec?: number;
  reps?: number;
}

interface Props {
  exercises?: WarmupExercise[];
  onStart: () => void;
  onSkip: () => void;
  workoutType?: string;
}

const DEFAULT_WARMUPS: Record<string, WarmupExercise[]> = {
  upper: [
    { name: 'Arm Circles', reps: 15 },
    { name: 'Shoulder Dislocates', reps: 10 },
    { name: 'Push-ups leves', reps: 10 },
    { name: 'Band Pull-Aparts', reps: 15 },
    { name: 'Rota\u00e7\u00e3o de punho', reps: 10 },
  ],
  lower: [
    { name: 'Jumping Jacks', duration_sec: 30 },
    { name: 'Leg Swings', reps: 10 },
    { name: 'Bodyweight Squats', reps: 15 },
    { name: 'Hip Circles', reps: 10 },
    { name: 'Calf Raises', reps: 15 },
  ],
  full: [
    { name: 'Jumping Jacks', duration_sec: 30 },
    { name: 'Arm Circles', reps: 10 },
    { name: 'Inchworm', reps: 5 },
    { name: 'Bodyweight Squats', reps: 10 },
    { name: 'Cat-Cow', reps: 8 },
    { name: 'High Knees', duration_sec: 20 },
  ],
  cardio: [
    { name: 'Caminhada r\u00e1pida', duration_sec: 120 },
    { name: 'Mobilidade de tornozelo', reps: 10 },
    { name: 'Leg Swings', reps: 10 },
    { name: 'Aquecimento progressivo', duration_sec: 180 },
  ],
};

export function WarmupSuggestion({
  exercises,
  onStart,
  onSkip,
  workoutType = 'full',
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const warmup =
    exercises && exercises.length > 0
      ? exercises
      : DEFAULT_WARMUPS[workoutType] || DEFAULT_WARMUPS.full;
  const totalTime = warmup.reduce(
    (s, e) => s + (e.duration_sec || (e.reps || 10) * 3),
    0,
  );

  return (
    <div className="glass-card border border-amber-500/20 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <div>
            <p className="text-sm font-semibold">Aquecimento sugerido</p>
            <p className="text-[10px] text-muted-foreground">
              {warmup.length} exerc\u00edcios &middot; ~
              {Math.ceil(totalTime / 60)} min
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="p-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-1 pt-1">
          {warmup.map((e, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs py-1"
            >
              <span>{e.name}</span>
              <span className="text-muted-foreground">
                {e.reps ? `${e.reps}\u00d7` : `${e.duration_sec}s`}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onStart} className="flex-1">
          <Play className="h-3 w-3 mr-1" /> Aquecer
        </Button>
        <Button size="sm" variant="outline" onClick={onSkip} className="flex-1">
          <SkipForward className="h-3 w-3 mr-1" /> Pular
        </Button>
      </div>
    </div>
  );
}
