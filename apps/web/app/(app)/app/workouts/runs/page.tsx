import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatPace(sec: number): string {
  if (!sec || sec <= 0) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const LABELS: Record<string, string> = {
  running: '🏃 Corrida',
  walking: '🚶 Caminhada',
  cycling: '🚴 Ciclismo',
  hiking: '🥾 Trilha',
};

export default async function RunsHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sessions } = await supabase
    .from('cardio_sessions')
    .select(
      'id, activity_type, started_at, distance_meters, duration_seconds, avg_pace_sec_per_km, calories_estimated, elevation_gain_m',
    )
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(50);

  const items = (sessions || []) as Record<string, unknown>[];

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display-title">Corridas</h1>
        <Link
          href="/app/workouts/run"
          className="text-sm text-accent font-medium"
        >
          + Nova
        </Link>
      </div>

      {items.map((s) => {
        const actType = String(s.activity_type);
        const dist = Number(s.distance_meters) || 0;
        const dur = Number(s.duration_seconds) || 0;
        const pace = Number(s.avg_pace_sec_per_km) || 0;
        const cal = Number(s.calories_estimated) || 0;
        const elev = Number(s.elevation_gain_m) || 0;
        const startedAt = String(s.started_at);

        return (
          <div key={String(s.id)} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {LABELS[actType] || actType}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(startedAt).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <p className="font-mono text-lg font-light">
                {(dist / 1000).toFixed(2)}{' '}
                <span className="text-xs text-muted-foreground">km</span>
              </p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{Math.round(dur / 60)} min</span>
              <span>{formatPace(pace)}/km</span>
              <span>{cal} kcal</span>
              {elev > 0 && <span>↑{elev}m</span>}
            </div>
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma corrida registrada.{' '}
          <Link href="/app/workouts/run" className="text-accent">
            Comece agora
          </Link>
          .
        </p>
      )}
    </main>
  );
}
