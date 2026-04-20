import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Retenção — Admin' };

const REASON_LABELS: Record<string, string> = {
  too_expensive: 'Caro',
  not_using: 'Sem uso',
  technical_issues: 'Problemas',
  changed_goals: 'Objetivos',
  missing_feature: 'Falta feature',
  switching: 'Troca app',
  other: 'Outro',
};

const OFFER_LABELS: Record<string, string> = {
  discount_50_2mo: '50% off 2mo',
  pause_30d: 'Pausa 30d',
  pause_60d: 'Pausa 60d',
  pause_90d: 'Pausa 90d',
  downgrade_pro: 'Downgrade Pro',
  downgrade_monthly: 'Downgrade mensal',
  premium_trial: 'Trial Premium',
  switch_professional: 'Trocar pro',
  none: '\u2014',
};

export default async function RetentionDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformAdmin(supabase, user.id))) redirect('/app');

  const last30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: attempts } = await supabase
    .from('cancellation_attempts')
    .select('reason, offer_shown, offer_accepted, final_status, winback_converted')
    .gte('created_at', last30);

  const totals = {
    started: 0,
    chose_reason: 0,
    saw_offer: 0,
    accepted_offer: 0,
    canceled: 0,
    paused: 0,
    retained: 0,
  };
  const byReason: Record<string, number> = {};
  const byOffer: Record<string, { shown: number; accepted: number }> = {};

  for (const row of (attempts || []) as Record<string, unknown>[]) {
    totals.started++;
    if (row.reason) {
      totals.chose_reason++;
      const r = row.reason as string;
      byReason[r] = (byReason[r] || 0) + 1;
    }
    if (row.offer_shown && row.offer_shown !== 'none') {
      totals.saw_offer++;
      const o = row.offer_shown as string;
      if (!byOffer[o]) byOffer[o] = { shown: 0, accepted: 0 };
      byOffer[o].shown++;
      if (row.offer_accepted) byOffer[o].accepted++;
    }
    if (row.offer_accepted) totals.accepted_offer++;
    if (row.final_status === 'canceled') totals.canceled++;
    if (row.final_status === 'paused') totals.paused++;
    if (row.final_status === 'retained') totals.retained++;
  }

  const retentionRate =
    totals.started > 0
      ? (((totals.retained + totals.paused) / totals.started) * 100).toFixed(1)
      : '0';

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Retenção — últimos 30 dias</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Iniciaram cancel" value={totals.started} />
        <Kpi label="Taxa retenção" value={`${retentionRate}%`} />
        <Kpi label="Cancelaram" value={totals.canceled} />
        <Kpi label="Pausaram" value={totals.paused} />
      </div>

      <section className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Funil</h2>
        <Row label="Iniciou" value={totals.started} total={totals.started} />
        <Row label="Escolheu motivo" value={totals.chose_reason} total={totals.started} />
        <Row label="Viu oferta" value={totals.saw_offer} total={totals.started} />
        <Row label="Aceitou oferta" value={totals.accepted_offer} total={totals.saw_offer || 1} />
        <Row label="Confirmou cancel" value={totals.canceled} total={totals.started} />
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Por motivo</h2>
        {Object.entries(byReason)
          .sort(([, a], [, b]) => b - a)
          .map(([reason, count]) => (
            <div key={reason} className="flex justify-between text-sm">
              <span>{REASON_LABELS[reason] || reason}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          ))}
        {Object.keys(byReason).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum dado ainda</p>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 space-y-2">
        <h2 className="font-semibold text-sm">Performance das ofertas</h2>
        {Object.entries(byOffer)
          .sort(([, a], [, b]) => b.shown - a.shown)
          .map(([offer, s]) => (
            <div key={offer} className="flex justify-between text-sm">
              <span>{OFFER_LABELS[offer] || offer}</span>
              <span className="text-muted-foreground">
                {s.accepted}/{s.shown} (
                {s.shown > 0 ? ((s.accepted / s.shown) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          ))}
        {Object.keys(byOffer).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum dado ainda</p>
        )}
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {value} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
