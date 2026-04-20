import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calculateReadiness } from '@/lib/health/readiness';

export const dynamic = 'force-dynamic';

const ZONE_COLORS: Record<string, string> = {
  green: 'text-accent',
  yellow: 'text-amber-400',
  red: 'text-red-400',
};
const ZONE_LABELS: Record<string, string> = {
  green: 'Recuperado',
  yellow: 'Atenção',
  red: 'Overtraining',
};
const ZONE_BG: Record<string, string> = {
  green: 'bg-accent',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};
const SCORE_LABELS: Record<string, string> = {
  hrv_score: 'HRV',
  rhr_score: 'FC Repouso',
  sleep_score: 'Sono',
  volume_score: 'Volume',
};

export default async function ReadinessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const readiness = await calculateReadiness(user.id);

  const { data: history } = await supabase
    .from('readiness_scores')
    .select('date, score, zone')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14);

  const historyItems = ((history || []) as Record<string, unknown>[]).reverse();

  const scores = [
    { key: 'hrv_score', value: readiness.hrv_score },
    { key: 'rhr_score', value: readiness.rhr_score },
    { key: 'sleep_score', value: readiness.sleep_score },
    { key: 'volume_score', value: readiness.volume_score },
  ];

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-5">
      <h1 className="display-title">Readiness</h1>

      {/* Big score */}
      <section className="glass-card-elevated p-6 text-center accent-glow">
        <p
          className={`text-6xl font-mono font-light ${ZONE_COLORS[readiness.zone]}`}
        >
          {readiness.score}
        </p>
        <p
          className={`text-sm font-semibold mt-1 ${ZONE_COLORS[readiness.zone]}`}
        >
          {ZONE_LABELS[readiness.zone]}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {readiness.recommendation}
        </p>
      </section>

      {/* Sub-scores */}
      <section className="grid grid-cols-2 gap-2">
        {scores.map((s) => (
          <div key={s.key} className="glass-card p-3 text-center">
            <p className="metric-number text-xl">{s.value}</p>
            <p className="metric-label">{SCORE_LABELS[s.key]}</p>
          </div>
        ))}
      </section>

      {/* Factors */}
      <section className="glass-card p-4 space-y-2">
        <h2 className="section-title">Fatores</h2>
        {readiness.factors.map((f, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            {f}
          </p>
        ))}
      </section>

      {/* 14-day history */}
      {historyItems.length > 0 && (
        <section className="glass-card p-4 space-y-2">
          <h2 className="section-title">Últimos 14 dias</h2>
          <div className="flex items-end gap-1 h-20">
            {historyItems.map((h, i) => {
              const score = Number(h.score);
              const zone = String(h.zone);
              const day = new Date(String(h.date)).getDate();
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div
                    className={`w-full rounded-sm ${ZONE_BG[zone] || 'bg-accent'}`}
                    style={{ height: `${score}%` }}
                  />
                  <span className="text-[8px] text-muted-foreground">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Raw data */}
      {readiness.hrv_avg !== null && readiness.hrv_avg > 0 && (
        <section className="glass-card p-4 space-y-1">
          <h2 className="section-title">Dados brutos</h2>
          <div className="flex justify-between text-sm">
            <span>HRV média 7d</span>
            <span className="font-mono">
              {readiness.hrv_avg?.toFixed(1)} ms
            </span>
          </div>
          {readiness.hrv_baseline !== null && (
            <div className="flex justify-between text-sm">
              <span>HRV baseline 30d</span>
              <span className="font-mono">
                {readiness.hrv_baseline?.toFixed(1)} ms
              </span>
            </div>
          )}
          {readiness.rhr_avg !== null && (
            <div className="flex justify-between text-sm">
              <span>FC repouso 7d</span>
              <span className="font-mono">
                {readiness.rhr_avg?.toFixed(0)} bpm
              </span>
            </div>
          )}
          {readiness.sleep_hours !== null && (
            <div className="flex justify-between text-sm">
              <span>Sono média</span>
              <span className="font-mono">
                {readiness.sleep_hours?.toFixed(1)}h
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Volume 7d</span>
            <span className="font-mono">{readiness.training_load_7d} min</span>
          </div>
        </section>
      )}
    </main>
  );
}
