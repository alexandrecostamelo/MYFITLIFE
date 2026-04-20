'use client';

import { useState } from 'react';
import { EditableWorkoutChips } from '@/components/ui/editable-workout-chips';
import { Button } from '@/components/ui/button';
import { Clock, Flame, Dumbbell, Zap, ChevronRight } from 'lucide-react';

export interface PreviewExercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration_sec?: number;
  estimated_kcal?: number;
  superset_group?: string;
  thumbnail_url?: string;
}

interface Props {
  title: string;
  exercises: PreviewExercise[];
  totalMinutes: number;
  totalKcal: number;
  editable?: boolean;
  onStart: (exercises: PreviewExercise[]) => void;
  onAddExercise?: () => void;
}

export function WorkoutPreview({
  title,
  exercises: initial,
  totalMinutes,
  totalKcal,
  editable = true,
  onStart,
  onAddExercise,
}: Props) {
  const [exercises, setExercises] = useState(initial);

  const remove = (id: string) =>
    setExercises((prev) => prev.filter((e) => e.id !== id));

  const updatedKcal = exercises.reduce(
    (s, e) => s + (e.estimated_kcal || 0),
    0
  );

  let lastSuperset = '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalMinutes}min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />~{updatedKcal} kcal
          </span>
        </div>
      </div>

      {/* Editable chips */}
      {editable && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Remova ou adicione exercícios:
          </p>
          <EditableWorkoutChips
            exercises={exercises}
            onRemove={remove}
            onAdd={onAddExercise || (() => {})}
            editable={editable}
          />
        </div>
      )}

      {/* Exercise list with supersets */}
      <div className="space-y-1">
        {exercises.map((ex, idx) => {
          const showSupersetLabel =
            !!ex.superset_group && ex.superset_group !== lastSuperset;
          lastSuperset = ex.superset_group || '';

          return (
            <div key={ex.id}>
              {showSupersetLabel && (
                <div className="flex items-center gap-2 py-1.5">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    Superset
                  </span>
                  <div className="flex-1 h-px bg-amber-400/20" />
                </div>
              )}
              <div className="glass-card p-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5 text-right">
                  {idx + 1}
                </span>
                {ex.thumbnail_url ? (
                  <img
                    src={ex.thumbnail_url}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ex.sets ? `${ex.sets} sets` : ''}
                    {ex.reps ? ` \u00D7 ${ex.reps} reps` : ''}
                    {ex.duration_sec ? ` \u00B7 ${ex.duration_sec}s` : ''}
                  </p>
                </div>
                {ex.estimated_kcal != null && ex.estimated_kcal > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {ex.estimated_kcal} kcal
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <Button onClick={() => onStart(exercises)} className="w-full" size="lg">
        Iniciar treino <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
