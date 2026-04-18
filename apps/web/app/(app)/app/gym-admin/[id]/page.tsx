'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Clock, TrendingUp, Calendar, Loader2, BarChart2 } from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export default function GymAdminDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const [analytics, setAnalytics] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function load(d: number) {
    setLoading(true);
    const [analyticsRes, gymRes] = await Promise.all([
      fetch(`/api/gym-admin/${id}/analytics?days=${d}`).then((r) => r.json()),
      fetch(`/api/gym-places/${id}`).then((r) => r.json()),
    ]);
    setAnalytics(analyticsRes.analytics);
    setGym(gymRes.gym);
    setLoading(false);
  }

  useEffect(() => { load(days); }, [id]);

  function changePeriod(d: number) {
    setDays(d);
    load(d);
  }

  if (loading && !analytics) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{gym?.name || 'Academia'}</h1>
          {gym?.city && <p className="text-xs text-muted-foreground">{[gym.city, gym.state].filter(Boolean).join(', ')}</p>}
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        {PERIOD_OPTIONS.map((o) => (
          <Button
            key={o.value}
            variant={days === o.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => changePeriod(o.value)}
            disabled={loading}
          >
            {o.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !analytics ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Você não tem permissão para ver estas métricas.
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart2 className="h-3 w-3" /> Check-ins
              </div>
              <div className="text-2xl font-bold">{analytics.total_checkins ?? 0}</div>
              <div className="text-xs text-muted-foreground">últimos {days} dias</div>
            </Card>

            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> Usuários únicos
              </div>
              <div className="text-2xl font-bold">{analytics.unique_users ?? 0}</div>
              <div className="text-xs text-muted-foreground">últimos {days} dias</div>
            </Card>

            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Duração média
              </div>
              <div className="text-2xl font-bold">
                {analytics.avg_duration_min ? `${Math.round(analytics.avg_duration_min)} min` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">por visita</div>
            </Card>

            <Card className="p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> Taxa de retorno
              </div>
              <div className="text-2xl font-bold">
                {analytics.return_rate_pct != null ? `${Math.round(analytics.return_rate_pct)}%` : '--'}
              </div>
              <div className="text-xs text-muted-foreground">voltaram 2x+</div>
            </Card>
          </div>

          {analytics.peak_hours && analytics.peak_hours.length > 0 && (
            <Card className="mb-4 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" /> Horários de pico
              </h2>
              <div className="space-y-2">
                {analytics.peak_hours.slice(0, 6).map((h: any, i: number) => {
                  const maxCount = analytics.peak_hours[0].count;
                  const pct = maxCount > 0 ? Math.round((h.count / maxCount) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">{h.hour}h – {h.hour + 1}h</span>
                        <span>{h.count} visitas</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {analytics.busiest_days && analytics.busiest_days.length > 0 && (
            <Card className="mb-4 p-4">
              <h2 className="mb-3 text-sm font-medium">Dias mais movimentados</h2>
              <div className="space-y-2">
                {analytics.busiest_days.map((d: any, i: number) => {
                  const days_pt = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const maxCount = analytics.busiest_days[0].count;
                  const pct = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">{days_pt[d.dow] || d.dow}</span>
                        <span>{d.count} visitas</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Dados agregados, sem identificação individual — em conformidade com a LGPD.
          </p>
        </>
      )}
    </main>
  );
}
