'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCw } from 'lucide-react';
import { MUSCLE_LABELS, type MuscleKey } from '@myfitlife/core/muscles';
import { resolveDbMuscles } from '@/lib/anatomy/muscle-map';

const Anatomy3D = dynamic(
  () => import('./Anatomy3D').then((m) => ({ default: m.Anatomy3D })),
  {
    ssr: false,
    loading: () => <div className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />,
  },
);

interface Props {
  primaryGroups?: string[];
  secondaryGroups?: string[];
  height?: number;
  compact?: boolean;
}

export function AnatomyViewer({
  primaryGroups = [],
  secondaryGroups = [],
  height = 400,
  compact = false,
}: Props) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationKey, setRotationKey] = useState(0);

  const primary = useMemo(() => resolveDbMuscles(primaryGroups), [primaryGroups]);
  const secondary = useMemo(() => resolveDbMuscles(secondaryGroups), [secondaryGroups]);

  const labels = useMemo(() => {
    const pLabels = primary.map((k) => MUSCLE_LABELS[k]).filter(Boolean);
    const sLabels = secondary.map((k) => MUSCLE_LABELS[k]).filter(Boolean);
    return { primary: pLabels, secondary: sLabels };
  }, [primary, secondary]);

  return (
    <div className="space-y-3">
      <div
        key={rotationKey}
        className="rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border"
      >
        <Anatomy3D
          primaryMuscles={primary}
          secondaryMuscles={secondary}
          height={height}
          autoRotate={autoRotate}
        />
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setAutoRotate((r) => !r)}>
              {autoRotate ? (
                <Pause className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1" />
              )}
              {autoRotate ? 'Pausar' : 'Girar'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRotationKey((k) => k + 1)}>
              <RotateCw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Arraste pra girar</p>
        </div>
      )}

      {(labels.primary.length > 0 || labels.secondary.length > 0) && !compact && (
        <div className="space-y-2">
          {labels.primary.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Principal:</span>
              {labels.primary.map((l) => (
                <Badge key={l} className="bg-red-500 hover:bg-red-500 text-white text-xs">
                  {l}
                </Badge>
              ))}
            </div>
          )}
          {labels.secondary.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Secundário:</span>
              {labels.secondary.map((l) => (
                <Badge key={l} variant="secondary" className="text-xs">
                  {l}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
