'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MuscleBody3D } from '@/components/muscle-body-3d-loader';
import { MuscleLegend, UndertrainedList } from '@/components/muscle-legend';
import { Loader2 } from 'lucide-react';
import type { MuscleKey, MuscleActivation } from '@myfitlife/core/muscles';

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
];

export default function MusclesPage() {
  const [days, setDays] = useState(7);
  const [activation, setActivation] = useState<MuscleActivation>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MuscleKey | null>(null);

  async function load(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts/weekly-muscles?days=${d}`);
      const data = await res.json();
      setActivation(data.activation ?? {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(days); }, [days]);

  function handlePeriod(d: number) {
    setDays(d);
    setSelected(null);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-1 text-2xl font-bold">Mapa muscular</h1>
      <p className="mb-4 text-sm text-muted-foreground">Visualize quais músculos você mais trabalhou</p>

      <div className="mb-4 flex gap-2">
        {PERIODS.map(({ label, days: d }) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriod(d)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card className="mb-4 overflow-hidden p-0">
        {loading ? (
          <div className="flex h-[480px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MuscleBody3D
            activation={activation}
            highlightMuscle={selected}
            onMuscleClick={(k) => setSelected((prev) => (prev === k ? null : k))}
          />
        )}
      </Card>

      {!loading && Object.keys(activation).length === 0 && (
        <Card className="mb-4 p-4 text-center text-sm text-muted-foreground">
          Nenhum treino registrado nos últimos {days} dias.
        </Card>
      )}

      {!loading && Object.keys(activation).length > 0 && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 text-sm font-medium">Ativação por grupo muscular</h2>
          <MuscleLegend
            activation={activation}
            selected={selected}
            onSelect={(k) => setSelected((prev) => (prev === k ? null : k))}
          />
          <UndertrainedList activation={activation} />
        </Card>
      )}
    </main>
  );
}
