'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { EXERCISE_LABELS, type PoseCheckKey } from '@myfitlife/core/pose-rules';
import { ArrowLeft, Loader2, TrendingUp } from 'lucide-react';

export default function FormHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/form-sessions').then((r) => r.json()).then((d) => {
      setSessions(d.sessions || []);
      setLoading(false);
    });
  }, []);

  const byExercise: Record<string, any[]> = {};
  sessions.forEach((s) => {
    if (!byExercise[s.pose_check_key]) byExercise[s.pose_check_key] = [];
    byExercise[s.pose_check_key].push(s);
  });

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/form-analysis" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Histórico de forma</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma sessão gravada ainda.
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byExercise).map(([key, items]) => {
            const first = items[items.length - 1];
            const latest = items[0];
            const improvement = latest.avg_form_score - first.avg_form_score;

            return (
              <div key={key}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    {EXERCISE_LABELS[key as PoseCheckKey] || key}
                  </h3>
                  {items.length >= 2 && (
                    <span className={`flex items-center gap-1 text-xs ${improvement >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      <TrendingUp className="h-3 w-3" />
                      {improvement >= 0 ? '+' : ''}{improvement} pts
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {items.slice(0, 5).map((s) => (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.recorded_at).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                          <div className="text-sm">
                            <strong>{s.reps_detected}</strong> reps ·{' '}
                            <strong>{Math.floor(s.duration_sec / 60)}:{String(s.duration_sec % 60).padStart(2, '0')}</strong>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            s.avg_form_score >= 80 ? 'text-green-600' :
                            s.avg_form_score >= 60 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {s.avg_form_score}
                          </div>
                          <div className="text-xs text-muted-foreground">forma</div>
                        </div>
                      </div>
                      {s.summary_cues?.length > 0 && (
                        <div className="mt-2 border-t pt-2">
                          <div className="text-xs text-muted-foreground">Top cues:</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {s.summary_cues.map((c: string, i: number) => (
                              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-xs">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
