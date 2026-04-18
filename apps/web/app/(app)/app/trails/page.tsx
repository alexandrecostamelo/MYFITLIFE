'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };
const GOAL_LABELS: Record<string, string> = { lose_fat: 'Perder gordura', gain_muscle: 'Ganhar massa', maintain: 'Manter', general_health: 'Saúde geral', performance: 'Performance' };

type Trail = {
  id: string; slug: string; title: string; subtitle: string; duration_days: number;
  level: string; goal: string; cover_emoji: string;
  user_state: { current_day: number; days_completed: number[] | null; completed_at: string | null; abandoned: boolean } | null;
};

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trails').then((r) => r.json()).then((d) => { setTrails(d.trails || []); setLoading(false); });
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Trilhas guiadas</h1>
      </header>
      <p className="mb-4 text-sm text-muted-foreground">Programas estruturados com treino, alimentação e dicas diárias.</p>

      {loading ? <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div> : (
        <div className="space-y-3">
          {trails.map((trail) => {
            const completed = trail.user_state?.completed_at;
            const inProgress = trail.user_state && !completed && !trail.user_state.abandoned;
            const abandoned = trail.user_state?.abandoned;
            const progress = trail.user_state ? Math.round(((trail.user_state.days_completed?.length || 0) / trail.duration_days) * 100) : 0;

            return (
              <Link key={trail.id} href={`/app/trails/${trail.slug}`}>
                <Card className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{trail.cover_emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{trail.title}</div>
                          <div className="text-xs text-muted-foreground">{trail.subtitle}</div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          {completed && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">Concluída</span>}
                          {inProgress && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">Em curso</span>}
                          {abandoned && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Pausada</span>}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {trail.duration_days} dias</span>
                        <span>· {LEVEL_LABELS[trail.level]}</span>
                        <span>· {GOAL_LABELS[trail.goal]}</span>
                      </div>
                      {trail.user_state && !completed && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
