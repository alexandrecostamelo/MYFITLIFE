'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OBJECTIVE_LABELS, DIFFICULTY_LABELS } from '@myfitlife/core/workout-sharing';
import { ArrowLeft, Loader2, Copy, CheckCircle, Dumbbell } from 'lucide-react';

export default function WorkoutPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch(`/api/discover/workouts/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [id]);

  async function copyWorkout() {
    setCopying(true);
    const res = await fetch(`/api/discover/workouts/${id}/copy`, { method: 'POST' });
    const r = await res.json();
    setCopying(false);
    if (res.ok) {
      router.push(`/app/workout/templates/${r.new_template_id}`);
    } else {
      alert(r.error || 'Erro ao copiar');
    }
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.template) return <div className="p-6 text-sm text-muted-foreground">Treino não encontrado.</div>;

  const t = data.template;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/discover/workouts" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Preview do treino</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-1 text-lg font-bold">{t.name}</h2>
        {t.public_description && (
          <p className="mb-3 text-sm text-muted-foreground">{t.public_description}</p>
        )}
        <div className="mb-3 flex flex-wrap gap-1">
          {t.objective && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{OBJECTIVE_LABELS[t.objective]}</span>
          )}
          {t.difficulty && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs">{DIFFICULTY_LABELS[t.difficulty]}</span>
          )}
          <span className="rounded bg-muted px-2 py-0.5 text-xs">{data.exercises.length} exercícios</span>
          {t.copy_count > 0 && (
            <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              <Copy className="h-3 w-3" /> {t.copy_count} cópias
            </span>
          )}
        </div>

        {data.author && (
          <div className="flex items-center gap-2 border-t pt-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
              {data.author.avatar_url ? (
                <img src={data.author.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  {(data.author.full_name || '?').charAt(0)}
                </div>
              )}
            </div>
            <div className="text-xs">
              <div className="font-medium">{data.author.full_name}</div>
              {data.author.username && (
                <div className="text-muted-foreground">@{data.author.username}</div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-4 p-4">
        <h3 className="mb-3 text-sm font-medium">Exercícios</h3>
        {data.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exercício.</p>
        ) : (
          <div className="space-y-2">
            {data.exercises.map((e: any, idx: number) => (
              <div key={e.id} className="flex items-center gap-3 rounded border p-2">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{idx + 1}</span>
                <Dumbbell className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {e.exercise?.name_pt || 'Exercício'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {e.sets && e.reps ? `${e.sets} × ${e.reps}` : e.sets ? `${e.sets} séries` : ''}
                    {e.weight_kg ? ` · ${e.weight_kg}kg` : ''}
                    {e.rest_sec ? ` · ${e.rest_sec}s descanso` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data.already_copied ? (
        <Card className="border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950">
          <CheckCircle className="mx-auto mb-1 h-6 w-6 text-green-600" />
          <p className="mb-2 text-sm text-green-900 dark:text-green-200">Você já copiou este treino.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/workout/templates">Ver meus treinos</Link>
          </Button>
        </Card>
      ) : (
        <Button onClick={copyWorkout} disabled={copying} className="w-full" size="lg">
          {copying
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Copy className="mr-2 h-4 w-4" /> Copiar este treino</>}
        </Button>
      )}
    </main>
  );
}
