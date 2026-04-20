'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { resolveDbMuscles } from '@/lib/anatomy/muscle-map';
import type { MuscleKey } from '@myfitlife/core/muscles';

const Anatomy3D = dynamic(
  () => import('@/components/anatomy/Anatomy3D').then((m) => ({ default: m.Anatomy3D })),
  {
    ssr: false,
    loading: () => <div className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />,
  },
);

type HeatmapData = {
  heatmap: Record<string, number>;
  top_muscles: Array<{ region: string; label: string; sets: number }>;
  underworked: Array<{ region: string; label: string }>;
  total_sets: number;
  days: number;
};

export function HeatmapClient() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights/muscle-heatmap?days=${days}`)
      .then((r) => r.json())
      .then((result) => setData(result))
      .finally(() => setLoading(false));
  }, [days]);

  const intensity: Partial<Record<MuscleKey, number>> = {};
  if (data?.heatmap) {
    for (const [region, level] of Object.entries(data.heatmap)) {
      const keys = resolveDbMuscles([region]);
      for (const k of keys) {
        intensity[k] = Math.max(intensity[k] || 0, (level as number) / 5);
      }
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-4 pb-24 space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mapa muscular 3D</h1>
          <p className="text-sm text-muted-foreground">
            Músculos mais trabalhados nos últimos {days} dias
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(d)}
            className="flex-1"
          >
            {d} dias
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.total_sets === 0 ? (
        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
          Nenhum treino registrado nos últimos {days} dias.
        </div>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border">
            <Anatomy3D
              primaryMuscles={[]}
              secondaryMuscles={[]}
              intensity={intensity}
              height={450}
              autoRotate
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {data.total_sets} séries · Arraste pra girar · Scroll pra zoom
          </p>

          {data.top_muscles.length > 0 && (
            <section className="rounded-xl border bg-card p-3">
              <h2 className="font-semibold text-sm mb-2">Mais trabalhados</h2>
              <div className="space-y-1.5">
                {data.top_muscles.map((m) => {
                  const keys = resolveDbMuscles([m.region]);
                  const pct = keys.length > 0 ? (intensity[keys[0]] || 0) * 100 : 0;
                  return (
                    <div key={m.region} className="flex items-center gap-2 text-xs">
                      <span className="min-w-24 truncate">{m.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground font-mono min-w-14 text-right">
                        {m.sets} séries
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {data.underworked.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3">
              <h2 className="font-semibold text-sm mb-1 text-amber-900 dark:text-amber-200">
                Pouco trabalhados
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {data.underworked.map((m) => (
                  <span
                    key={m.region}
                    className="rounded bg-white dark:bg-amber-900 px-2 py-0.5 text-xs"
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
