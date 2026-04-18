'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Loader2, Users } from 'lucide-react';

const METRIC_LABELS: Record<string, string> = {
  workouts: 'treinos',
  sets: 'séries',
  meals: 'refeições',
  streak_days: 'dias',
  xp: 'XP',
  weight_logs: 'pesagens',
  checkins: 'check-ins',
  trail_days: 'dias de trilha',
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    const res = await fetch(`/api/challenges/${id}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function join() {
    setActing(true);
    await fetch(`/api/challenges/${id}/join`, { method: 'POST' });
    await load();
    setActing(false);
  }

  async function leave() {
    if (!confirm('Sair do desafio?')) return;
    setActing(true);
    await fetch(`/api/challenges/${id}/join`, { method: 'DELETE' });
    await load();
    setActing(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.challenge) return <div className="p-6">Desafio não encontrado</div>;

  const { challenge, leaderboard, joined } = data;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/challenges" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Desafio</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="text-lg font-bold">{challenge.title}</h2>
        {challenge.description && <p className="text-sm text-muted-foreground">{challenge.description}</p>}
        <div className="mt-2 text-xs text-muted-foreground">
          Meta: {challenge.target_value} {METRIC_LABELS[challenge.metric]} · de {new Date(challenge.start_date).toLocaleDateString('pt-BR')} até {new Date(challenge.end_date).toLocaleDateString('pt-BR')}
        </div>
      </Card>

      {!joined && (
        <Button onClick={join} disabled={acting} className="mb-4 w-full">
          {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Participar'}
        </Button>
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Ranking ({leaderboard.length})</h3>
        </div>
        <div className="space-y-2">
          {leaderboard.map((p: any, i: number) => {
            const pct = Math.min(100, Math.round((p.progress / challenge.target_value) * 100));
            return (
              <div key={i} className={`rounded border p-3 ${p.is_me ? 'bg-primary/5 border-primary' : ''}`}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                    <span className="text-sm font-medium">
                      {p.user.full_name || p.user.username || 'Usuário'}
                      {p.is_me && ' (você)'}
                    </span>
                    {p.completed_at && <Trophy className="h-3 w-3 text-amber-500" />}
                  </div>
                  <span className="text-sm font-medium">{p.progress}/{challenge.target_value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                  <div className={`h-full ${p.completed_at ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {joined && (
        <Button variant="outline" onClick={leave} disabled={acting} className="mt-4 w-full">
          Sair do desafio
        </Button>
      )}
    </main>
  );
}
