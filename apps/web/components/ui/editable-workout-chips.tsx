'use client';

import { X, Plus } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  reps?: number;
  duration_sec?: number;
}

interface Props {
  exercises: Exercise[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  editable?: boolean;
}

export function EditableWorkoutChips({ exercises, onRemove, onAdd, editable = true }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {exercises.map((ex) => (
        <div
          key={ex.id}
          className="group inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors"
        >
          <span>{ex.name}</span>
          {ex.reps != null && <span className="text-accent/60">&times;{ex.reps}</span>}
          {ex.duration_sec != null && <span className="text-accent/60">{ex.duration_sec}s</span>}
          {editable && (
            <button
              onClick={() => onRemove(ex.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors"
        >
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      )}
    </div>
  );
}
