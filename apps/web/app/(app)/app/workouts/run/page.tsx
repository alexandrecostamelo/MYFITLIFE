'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useGPSTracking } from '@/hooks/use-gps-tracking';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Trash2, Save, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

const RunMap = dynamic(
  () => import('./run-map').then((m) => m.RunMap),
  { ssr: false },
);

function formatPace(sec: number): string {
  if (!sec || sec <= 0 || sec > 3600) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

type Activity = 'running' | 'walking' | 'cycling' | 'hiking';

const ACTIVITIES: { id: Activity; label: string; icon: string }[] = [
  { id: 'running', label: 'Corrida', icon: '🏃' },
  { id: 'walking', label: 'Caminhada', icon: '🚶' },
  { id: 'cycling', label: 'Ciclismo', icon: '🚴' },
  { id: 'hiking', label: 'Trilha', icon: '🥾' },
];

export default function RunPage() {
  const router = useRouter();
  const { state, start, pause, resume, stop, discard } =
    useGPSTracking(70);
  const [activity, setActivity] = useState<Activity>('running');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/workouts/cardio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: activity,
          duration_seconds: state.duration_sec,
          distance_meters: state.distance_m,
          avg_pace_sec_per_km: state.avg_pace,
          best_pace_sec_per_km: state.best_pace,
          avg_speed_kmh: state.avg_speed_kmh,
          calories_estimated: state.calories,
          elevation_gain_m: state.elevation_gain,
          elevation_loss_m: state.elevation_loss,
          route_polyline: state.points.map((p) => [p.lat, p.lng, p.alt]),
          splits: state.splits,
        }),
      });
      router.push('/app/workouts/runs');
    } finally {
      setSaving(false);
    }
  };

  // ---------- IDLE ----------
  if (state.status === 'idle') {
    return (
      <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
        <h1 className="display-title">Cardio Outdoor</h1>
        <div className="flex gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              onClick={() => setActivity(a.id)}
              className={`flex-1 flex flex-col items-center gap-1 rounded-xl p-3 transition-colors ${
                activity === a.id
                  ? 'bg-accent/20 border border-accent/40'
                  : 'bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[10px] font-medium">{a.label}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => start()} className="w-full" size="lg">
          <Play className="h-5 w-5 mr-2" /> Iniciar{' '}
          {ACTIVITIES.find((a) => a.id === activity)?.label}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          GPS de alta precisão ativado. Mantenha o celular visível.
        </p>
      </main>
    );
  }

  // ---------- STOPPED (summary) ----------
  if (state.status === 'stopped') {
    return (
      <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
        <h1 className="display-title">Resumo</h1>

        {state.points.length > 2 && (
          <div className="rounded-2xl overflow-hidden h-48">
            <RunMap points={state.points} interactive={false} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="metric-number text-xl">
              {(state.distance_m / 1000).toFixed(2)}
            </p>
            <p className="metric-label">km</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="metric-number text-xl">
              {formatTime(state.duration_sec)}
            </p>
            <p className="metric-label">tempo</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="metric-number text-xl">
              {formatPace(state.avg_pace)}
            </p>
            <p className="metric-label">pace médio</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="font-mono text-lg">{state.calories}</p>
            <p className="metric-label">kcal</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="font-mono text-lg">
              {formatPace(state.best_pace)}
            </p>
            <p className="metric-label">melhor km</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="font-mono text-lg">{state.elevation_gain}m</p>
            <p className="metric-label">elevação</p>
          </div>
        </div>

        {state.splits.length > 0 && (
          <section className="glass-card p-4 space-y-2">
            <h2 className="section-title">Splits</h2>
            {state.splits.map((s) => (
              <div key={s.km} className="flex justify-between text-sm">
                <span>Km {s.km}</span>
                <span className="font-mono">
                  {formatPace(s.pace_sec_per_km)}/km
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatTime(s.time_sec)}
                </span>
              </div>
            ))}
          </section>
        )}

        <div className="flex gap-2">
          <Button onClick={discard} variant="outline" className="flex-1">
            <Trash2 className="h-4 w-4 mr-1" /> Descartar
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </div>
      </main>
    );
  }

  // ---------- RUNNING / PAUSED ----------
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Map area */}
      <div className="flex-1 relative">
        {state.points.length > 0 && (
          <RunMap points={state.points} interactive={false} />
        )}
        {state.points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-accent animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Aguardando sinal GPS...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-white/5 p-4 safe-area-pb space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-mono text-3xl font-light">
              {(state.distance_m / 1000).toFixed(2)}
            </p>
            <p className="metric-label">km</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-light">
              {formatTime(state.duration_sec)}
            </p>
            <p className="metric-label">tempo</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-light">
              {formatPace(state.current_pace)}
            </p>
            <p className="metric-label">pace</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="font-mono">{formatPace(state.avg_pace)}</p>
            <p className="text-[10px] text-muted-foreground">pace médio</p>
          </div>
          <div>
            <p className="font-mono">{state.calories}</p>
            <p className="text-[10px] text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="font-mono">{state.avg_speed_kmh}</p>
            <p className="text-[10px] text-muted-foreground">km/h</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {state.status === 'running' ? (
            <button
              onClick={pause}
              className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
            >
              <Pause className="h-7 w-7 text-black" />
            </button>
          ) : (
            <button
              onClick={resume}
              className="h-16 w-16 rounded-full bg-accent flex items-center justify-center shadow-lg accent-glow"
            >
              <Play className="h-7 w-7 text-accent-foreground" />
            </button>
          )}
          <button
            onClick={stop}
            className="h-16 w-16 rounded-full bg-destructive flex items-center justify-center shadow-lg"
          >
            <Square className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
