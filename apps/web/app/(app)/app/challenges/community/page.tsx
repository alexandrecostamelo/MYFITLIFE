'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, daysUntil, computeProgress } from '@myfitlife/core/challenges';
import { ArrowLeft, Loader2, Users, Trophy, CheckCircle, Clock } from 'lucide-react';

export default function CommunityChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    fetch('/api/community/challenges')
      .then((r) => r.json())
      .then((d) => { setChallenges(d.challenges || []); setLoading(false); });
  }, []);

  const filtered =
    filter === 'mine'
      ? challenges.filter((c) => c.my_participation && !c.my_participation.abandoned_at)
      : challenges.filter((c) => c.status === 'enrollment' || c.status === 'active');

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/challenges" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Desafios da comunidade</h1>
      </header>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${filter === 'all' ? 'border-primary bg-primary/10' : 'border-input'}`}
        >
          Abertos
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${filter === 'mine' ? 'border-primary bg-primary/10' : 'border-input'}`}
        >
          Meus desafios
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {filter === 'mine' ? 'Você ainda não participa de nenhum desafio.' : 'Nenhum desafio aberto no momento.'}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const iAmIn = !!c.my_participation && !c.my_participation.abandoned_at;
            const completed = !!c.my_participation?.completed_at;
            const daysToStart = daysUntil(c.start_date);
            const daysToEnd = daysUntil(c.end_date);
            const progress = c.my_participation ? computeProgress(c, c.my_participation) : null;

            return (
              <Link key={c.id} href={`/app/challenges/community/${c.slug}`}>
                <Card
                  className={`p-4 hover:bg-muted ${
                    c.featured
                      ? 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-800 dark:ring-amber-900'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{c.cover_emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{c.title}</h3>
                        {c.featured && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>

                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <span className="rounded bg-muted px-1.5 py-0.5">{CATEGORY_LABELS[c.category]}</span>
                        <span className="text-muted-foreground">
                          {c.duration_days} dias · {c.target_value} {c.target_unit}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" /> {c.participant_count}
                        </span>
                        {c.status === 'enrollment' && daysToStart > 0 && (
                          <span className="flex items-center gap-1 text-blue-700">
                            <Clock className="h-3 w-3" /> Começa em {daysToStart}d
                          </span>
                        )}
                        {c.status === 'active' && daysToEnd > 0 && (
                          <span className="flex items-center gap-1 text-green-700">
                            <Clock className="h-3 w-3" /> Falta {daysToEnd}d
                          </span>
                        )}
                        {c.status === 'completed' && (
                          <span className="text-muted-foreground">Encerrado</span>
                        )}
                      </div>

                      {iAmIn && progress && (
                        <div className="mt-2">
                          <div className="mb-0.5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{progress.label}</span>
                            {completed ? (
                              <span className="flex items-center gap-0.5 text-green-700">
                                <CheckCircle className="h-3 w-3" /> Completo
                              </span>
                            ) : (
                              <span className="font-medium">{Math.round(progress.percent)}%</span>
                            )}
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full transition-all ${completed ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${progress.percent}%` }}
                            />
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
