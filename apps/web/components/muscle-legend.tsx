'use client';

import type { MuscleKey, MuscleActivation } from '@myfitlife/core/muscles';
import { MUSCLE_LABELS } from '@myfitlife/core/muscles';

interface Props {
  activation: MuscleActivation;
  onSelect?: (muscle: MuscleKey) => void;
  selected?: MuscleKey | null;
}

function pct(v: number) {
  return Math.round(v * 100);
}

function colorClass(v: number) {
  if (v <= 0) return 'bg-gray-600';
  if (v < 0.35) return 'bg-blue-500';
  if (v < 0.7) return 'bg-amber-500';
  return 'bg-red-500';
}

export function MuscleLegend({ activation, onSelect, selected }: Props) {
  const sorted = (Object.entries(activation) as [MuscleKey, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-3 w-8 rounded" style={{ background: 'linear-gradient(to right, #3b82f6, #f59e0b, #ef4444)' }} />
        <span>baixo → médio → alto</span>
      </div>
      {sorted.map(([key, val]) => (
        <button
          key={key}
          onClick={() => onSelect?.(key)}
          className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-muted ${selected === key ? 'bg-muted ring-1 ring-primary' : ''}`}
        >
          <div className={`h-3 w-3 flex-shrink-0 rounded-sm ${colorClass(val)}`} />
          <span className="flex-1 truncate">{MUSCLE_LABELS[key] ?? key}</span>
          <span className="text-xs text-muted-foreground">{pct(val)}%</span>
          <div className="h-1.5 w-16 overflow-hidden rounded bg-gray-200">
            <div className={`h-full ${colorClass(val)}`} style={{ width: `${pct(val)}%` }} />
          </div>
        </button>
      ))}
    </div>
  );
}

export function UndertrainedList({ activation }: { activation: MuscleActivation }) {
  const allKeys: MuscleKey[] = [
    'chest', 'lats', 'shoulders_front', 'shoulders_side', 'shoulders_rear',
    'biceps', 'triceps', 'abs', 'glutes', 'quads', 'hamstrings', 'calves',
  ];
  const undertrained = allKeys.filter((k) => (activation[k] ?? 0) < 0.2);
  if (undertrained.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Grupos pouco trabalhados</p>
      <div className="flex flex-wrap gap-1">
        {undertrained.map((k) => (
          <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {MUSCLE_LABELS[k] ?? k}
          </span>
        ))}
      </div>
    </div>
  );
}
