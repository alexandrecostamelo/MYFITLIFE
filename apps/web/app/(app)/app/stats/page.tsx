'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame, Snowflake, Trophy, TrendingUp, Loader2 } from 'lucide-react';

const DIM_LABELS: Record<string, string> = { strength: 'Força', endurance: 'Resistência', flexibility: 'Flexibilidade', consistency: 'Consistência', nutrition: 'Nutrição' };

export default function StatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/me/stats').then((r) => r.json()).then((d) => { setData(d); setLoading(false); }); }, []);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.stats) return <div className="p-6">Erro ao carregar.</div>;

  const { stats, recent_events } = data;
  const maxDim = Math.max(1, ...Object.values(stats.dimensions as Record<string, number>));

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Sua evolução</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">Nível</div><div className="text-3xl font-bold">{stats.level}</div></div>
          <div className="text-right"><div className="text-xs text-muted-foreground">XP total</div><div className="text-2xl font-bold">{stats.total_xp.toLocaleString('pt-BR')}</div></div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Nível {stats.level + 1} em</span>
            <span className="font-medium">{stats.xp_to_next} XP</span>
          </div>
          <div className="h-3 overflow-hidden rounded bg-slate-200"><div className="h-full bg-primary transition-all" style={{ width: `${stats.xp_level_progress}%` }} /></div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /><span className="text-sm font-medium">Streak atual</span></div>
            <div className="text-3xl font-bold">{stats.streak.current} dias</div>
            <div className="text-xs text-muted-foreground">Recorde: {stats.streak.longest}</div>
          </div>
          <div className="text-right">
            <div className="mb-1 flex items-center justify-end gap-1"><Snowflake className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Coringas</span></div>
            <div className="text-sm font-medium">{stats.streak.freezes_max - stats.streak.freezes_used} disponíveis</div>
            <div className="text-xs text-muted-foreground">reseta no mês</div>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><h2 className="text-sm font-medium">Dimensões</h2></div>
        <div className="space-y-2">
          {Object.entries(stats.dimensions as Record<string, number>).map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{DIM_LABELS[key]}</span>
                <span className="font-medium">{value} XP</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-slate-200"><div className="h-full bg-primary/70" style={{ width: `${Math.round((value / maxDim) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button asChild variant="outline"><Link href="/app/achievements"><Trophy className="mr-2 h-4 w-4" /> Conquistas</Link></Button>
        <Button asChild variant="outline"><Link href="/app/quests">Quests do dia</Link></Button>
      </div>

      {recent_events?.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-medium">Últimos ganhos de XP</h2>
          <div className="space-y-2 text-sm">
            {recent_events.slice(0, 10).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-muted-foreground">{e.description || e.event_type}</span>
                <span className="font-medium text-primary">+{e.xp_awarded} XP</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
