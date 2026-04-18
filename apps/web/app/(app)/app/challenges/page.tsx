'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trophy, Check, Loader2 } from 'lucide-react';

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  metric: string;
  target_value: number;
  start_date: string;
  end_date: string;
  status: string;
  my_progress: number;
  my_completed_at: string | null;
};

const METRIC_LABELS: Record<string, string> = {
  workouts: 'treinos',
  sets: 'séries',
  meals: 'refeições',
  streak_days: 'dias de streak',
  xp: 'XP',
  weight_logs: 'pesagens',
  checkins: 'check-ins',
  trail_days: 'dias de trilha',
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/challenges').then((r) => r.json()).then((d) => {
      setChallenges(d.challenges || []);
      setLoading(false);
    });
  }, []);

  const active = challenges.filter((c) => c.status === 'active' && new Date(c.end_date) >= new Date());
  const past = challenges.filter((c) => c.status !== 'active' || new Date(c.end_date) < new Date());

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/stats" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Desafios</h1>
      </header>

      <Button asChild className="mb-4 w-full">
        <Link href="/app/challenges/new">
          <Plus className="mr-2 h-4 w-4" /> Criar desafio
        </Link>
      </Button>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : challenges.length === 0 ? (
        <Card className="p-6 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum desafio ainda.</p>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">ATIVOS</h2>
              <div className="mb-4 space-y-2">
                {active.map((c) => <ChallengeCard key={c.id} c={c} />)}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">CONCLUÍDOS</h2>
              <div className="space-y-2">
                {past.map((c) => <ChallengeCard key={c.id} c={c} past />)}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

function ChallengeCard({ c, past = false }: { c: Challenge; past?: boolean }) {
  const progress = Math.min(100, Math.round((c.my_progress / c.target_value) * 100));
  const completed = !!c.my_completed_at;
  return (
    <Link href={`/app/challenges/${c.id}`}>
      <Card className={`p-4 hover:bg-slate-50 ${past ? 'opacity-60' : ''}`}>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-sm font-medium">{c.title}</div>
            <div className="text-xs text-muted-foreground">
              Meta: {c.target_value} {METRIC_LABELS[c.metric]} · até {new Date(c.end_date).toLocaleDateString('pt-BR')}
            </div>
          </div>
          {completed && <Check className="h-4 w-4 text-green-600" />}
        </div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">{c.my_progress}/{c.target_value}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded bg-slate-200">
          <div className={`h-full ${completed ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
        </div>
      </Card>
    </Link>
  );
}
