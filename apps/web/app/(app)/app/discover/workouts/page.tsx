'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OBJECTIVE_LABELS, DIFFICULTY_LABELS, SORT_LABELS, authorBadge } from '@myfitlife/core/workout-sharing';
import { ArrowLeft, Loader2, Dumbbell, Copy, TrendingUp } from 'lucide-react';

export default function DiscoverWorkoutsPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [objective, setObjective] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('trending');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (objective) params.set('objective', objective);
    if (difficulty) params.set('difficulty', difficulty);
    params.set('sort', sort);
    const res = await fetch(`/api/discover/workouts?${params}`);
    const data = await res.json();
    setWorkouts(data.workouts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [objective, difficulty, sort]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <TrendingUp className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Descobrir treinos</h1>
      </header>

      <Card className="mb-3 p-2">
        <div className="mb-2 grid grid-cols-3 gap-1">
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${sort === key ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="mb-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs"
        >
          <option value="">Qualquer objetivo</option>
          {Object.entries(OBJECTIVE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs"
        >
          <option value="">Qualquer nível</option>
          {Object.entries(DIFFICULTY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Card>

      <div className="mb-3 flex justify-end">
        <Link href="/app/workout/templates">
          <Button variant="outline" size="sm">Meus treinos</Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : workouts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum treino encontrado com esses filtros.
        </Card>
      ) : (
        <div className="space-y-2">
          {workouts.map((w) => {
            const badge = authorBadge(Number(w.author_score) || 0, w.author_current_streak, w.author_level);
            return (
              <Link key={w.template_id} href={`/app/discover/workouts/${w.template_id}`}>
                <Card className="p-4 transition-colors hover:bg-muted">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium">{w.template_name}</h3>
                    {w.copy_count > 0 && (
                      <span className="flex flex-shrink-0 items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <Copy className="h-3 w-3" /> {w.copy_count}
                      </span>
                    )}
                  </div>
                  {w.public_description && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{w.public_description}</p>
                  )}
                  <div className="mb-2 flex flex-wrap gap-1">
                    {w.objective && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{OBJECTIVE_LABELS[w.objective]}</span>
                    )}
                    {w.difficulty && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{DIFFICULTY_LABELS[w.difficulty]}</span>
                    )}
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Dumbbell className="h-3 w-3" /> {w.exercise_count} exercícios
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-t pt-2">
                    <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                      {w.author_avatar_url ? (
                        <img src={w.author_avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          {(w.author_name || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="flex-1 truncate text-xs">{w.author_name || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">{badge.icon} {badge.label}</span>
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
