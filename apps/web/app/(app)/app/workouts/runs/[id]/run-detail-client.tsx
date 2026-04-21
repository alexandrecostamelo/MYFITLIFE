'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const RunMap = dynamic(
  () => import('../../run/run-map').then((m) => m.RunMap),
  { ssr: false },
);

interface Props {
  session: Record<string, unknown>;
}

function formatPace(sec: number): string {
  if (!sec || sec <= 0 || sec > 3600) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(sec: number): string {
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function generateGPX(session: Record<string, unknown>): string {
  const points = (session.route_polyline || []) as number[][];
  let gpx =
    '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MyFitLife">\n<trk><name>' +
    String(session.activity_type) +
    '</name><trkseg>\n';
  for (const p of points) {
    gpx += `<trkpt lat="${p[0]}" lon="${p[1]}">${p[2] != null ? `<ele>${p[2]}</ele>` : ''}</trkpt>\n`;
  }
  gpx += '</trkseg></trk></gpx>';
  return gpx;
}

const LABELS: Record<string, string> = {
  running: 'Corrida',
  walking: 'Caminhada',
  cycling: 'Ciclismo',
  hiking: 'Trilha',
};

export function RunDetailClient({ session }: Props) {
  const routePolyline = Array.isArray(session.route_polyline)
    ? (session.route_polyline as number[][])
    : [];
  const points = routePolyline.map((p) => ({
    lat: p[0],
    lng: p[1],
    alt: p[2],
    timestamp: 0,
  }));
  const splits = Array.isArray(session.splits)
    ? (session.splits as {
        km: number;
        time_sec: number;
        pace_sec_per_km: number;
        elevation_change_m: number;
      }[])
    : [];

  const actType = String(session.activity_type || 'running');
  const distMeters = Number(session.distance_meters) || 0;
  const durSec = Number(session.duration_seconds) || 0;
  const avgPace = Number(session.avg_pace_sec_per_km) || 0;
  const bestPace = Number(session.best_pace_sec_per_km) || 0;
  const cal = Number(session.calories_estimated) || 0;
  const elev = Number(session.elevation_gain_m) || 0;
  const startedAt = String(session.started_at || '');

  const downloadGPX = () => {
    const gpx = generateGPX(session);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myfitlife-${actType}-${startedAt.slice(0, 10)}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-28 space-y-5">
      <Link
        href="/app/workouts/runs"
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Corridas
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-title">
            {LABELS[actType] || actType}
          </h1>
          <p className="text-sm text-muted-foreground">
            {startedAt
              ? new Date(startedAt).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </p>
        </div>
        {points.length > 2 && (
          <Button size="sm" variant="outline" onClick={downloadGPX}>
            <Download className="h-4 w-4 mr-1" /> GPX
          </Button>
        )}
      </div>

      {points.length > 2 && (
        <div className="rounded-2xl overflow-hidden h-56">
          <RunMap points={points} interactive={true} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="metric-number text-2xl">
            {(distMeters / 1000).toFixed(2)}
          </p>
          <p className="metric-label">km</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="metric-number text-2xl">{formatTime(durSec)}</p>
          <p className="metric-label">tempo</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="metric-number text-2xl">{formatPace(avgPace)}</p>
          <p className="metric-label">pace médio</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg">{cal}</p>
          <p className="metric-label">kcal</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg">{formatPace(bestPace)}</p>
          <p className="metric-label">melhor km</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg">{Math.round(elev)}m</p>
          <p className="metric-label">elevação</p>
        </div>
      </div>

      {splits.length > 0 && (
        <section className="glass-card p-4 space-y-2">
          <h2 className="section-title">Splits</h2>
          <div className="space-y-1">
            {splits.map((s) => {
              const diff = s.pace_sec_per_km - avgPace;
              const color =
                diff < -5
                  ? 'text-accent'
                  : diff > 5
                    ? 'text-red-400'
                    : 'text-muted-foreground';
              return (
                <div
                  key={s.km}
                  className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0"
                >
                  <span className="w-12">Km {s.km}</span>
                  <span className={`font-mono ${color}`}>
                    {formatPace(s.pace_sec_per_km)}/km
                  </span>
                  <span className="text-muted-foreground text-xs w-16 text-right">
                    {formatTime(s.time_sec)}
                  </span>
                  {s.elevation_change_m !== 0 && (
                    <span className="text-[10px] text-muted-foreground w-12 text-right">
                      {s.elevation_change_m > 0 ? '\u2191' : '\u2193'}
                      {Math.abs(s.elevation_change_m)}m
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
