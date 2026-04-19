'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MuscleBody3D } from '@/components/muscle-body-3d-loader';
import type { MuscleActivation } from '@myfitlife/core/muscles';
import { MUSCLE_LABELS } from '@myfitlife/core/muscles';

export function MuscleWidget() {
  const [activation, setActivation] = useState<MuscleActivation>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workouts/weekly-muscles?days=7')
      .then((r) => r.json())
      .then((d) => setActivation(d.activation ?? {}))
      .finally(() => setLoading(false));
  }, []);

  const topMuscles = (Object.entries(activation) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="text-sm font-medium">Mapa muscular — 7 dias</h2>
          {!loading && topMuscles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Mais trabalhados: {topMuscles.map(([k]) => MUSCLE_LABELS[k as keyof typeof MUSCLE_LABELS] ?? k).join(', ')}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/muscles">Ver mais</Link>
        </Button>
      </div>

      {!loading && Object.keys(activation).length > 0 ? (
        <div style={{ height: 240, pointerEvents: 'none' }}>
          <MuscleBody3D activation={activation} />
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
          {loading ? 'Carregando...' : 'Nenhum treino nos últimos 7 dias.'}
        </div>
      )}
    </Card>
  );
}
