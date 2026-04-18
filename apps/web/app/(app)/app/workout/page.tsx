'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Plus, Check, Loader2, Search, Camera } from 'lucide-react';

type Exercise = {
  id: string;
  name_pt: string;
  category: string;
  primary_muscles: string[];
  equipment: string[];
  difficulty: number;
};

type SetRow = { set_number: number; reps: string; weight_kg: string; rir: string };

export default function WorkoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<SetRow[]>([{ set_number: 1, reps: '', weight_kg: '', rir: '' }]);
  const [history, setHistory] = useState<{ id: string; started_at: string; duration_sec: number | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const addExerciseId = searchParams.get('add_exercise');
    if (addExerciseId && workoutId) {
      const pending = sessionStorage.getItem('pending_exercise');
      if (pending) {
        try {
          const ex = JSON.parse(pending);
          setSelectedExercise({
            id: ex.id,
            name_pt: ex.name_pt,
            category: '',
            primary_muscles: ex.primary_muscles || [],
            equipment: [],
            difficulty: 0,
          });
          sessionStorage.removeItem('pending_exercise');
          router.replace('/app/workout');
        } catch { /* ignore */ }
      }
    }
  }, [searchParams, workoutId, router]);

  async function searchExercises(q: string) {
    setQuery(q);
    if (q.length < 2) { setExercises([]); return; }
    const res = await fetch(`/api/exercises?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setExercises(data.exercises || []);
  }

  async function loadHistory() {
    const res = await fetch('/api/workouts');
    const data = await res.json();
    setHistory(data.workouts || []);
  }

  useEffect(() => { loadHistory(); }, []);

  async function startWorkout() {
    setLoading(true);
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    const data = await res.json();
    setWorkoutId(data.workout_log_id);
    setLoading(false);
  }

  async function saveSets() {
    if (!workoutId || !selectedExercise) return;
    setLoading(true);
    for (const s of sets) {
      if (!s.reps && !s.weight_kg) continue;
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_set',
          workout_log_id: workoutId,
          exercise_id: selectedExercise.id,
          set_number: s.set_number,
          reps: s.reps ? parseInt(s.reps) : undefined,
          weight_kg: s.weight_kg ? parseFloat(s.weight_kg) : undefined,
          rir: s.rir ? parseInt(s.rir) : undefined,
        }),
      });
    }
    setSelectedExercise(null);
    setSets([{ set_number: 1, reps: '', weight_kg: '', rir: '' }]);
    setQuery('');
    setExercises([]);
    setLoading(false);
  }

  async function finishWorkout() {
    if (!workoutId) return;
    setLoading(true);
    await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finish', workout_log_id: workoutId }),
    });
    setWorkoutId(null);
    await loadHistory();
    setLoading(false);
  }

  function addSet() {
    setSets([...sets, { set_number: sets.length + 1, reps: '', weight_kg: '', rir: '' }]);
  }

  function updateSet(i: number, field: keyof SetRow, value: string) {
    const copy = [...sets];
    copy[i] = { ...copy[i], [field]: value };
    setSets(copy);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Treino</h1>

      {!workoutId ? (
        <>
          <Card className="mb-4 p-4">
            <Button onClick={startWorkout} disabled={loading} className="w-full">
              <Play className="mr-2 h-4 w-4" /> Iniciar treino
            </Button>
          </Card>

          <h2 className="mb-2 text-sm font-medium text-muted-foreground">HISTÓRICO</h2>
          <div className="space-y-2">
            {history.map((w) => (
              <Card key={w.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>{new Date(w.started_at).toLocaleDateString('pt-BR')}</span>
                  <span className="text-muted-foreground">
                    {w.duration_sec ? `${Math.round(w.duration_sec / 60)}min` : 'em andamento'}
                  </span>
                </div>
              </Card>
            ))}
            {history.length === 0 && <p className="text-sm text-muted-foreground">Nenhum treino ainda.</p>}
          </div>
        </>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Treino em andamento</span>
              <Button size="sm" variant="outline" onClick={finishWorkout} disabled={loading}>
                <Check className="mr-1 h-4 w-4" /> Finalizar
              </Button>
            </div>

            {!selectedExercise ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="mb-3 w-full"
                >
                  <Link href={`/app/workout/equipment?workout_id=${workoutId}`}>
                    <Camera className="mr-2 h-4 w-4" />
                    Identificar aparelho por foto
                  </Link>
                </Button>

                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exercício..."
                    className="pl-8"
                    value={query}
                    onChange={(e) => searchExercises(e.target.value)}
                  />
                </div>
                {exercises.length > 0 && (
                  <div className="max-h-64 overflow-y-auto rounded border">
                    {exercises.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExercise(ex)}
                        className="flex w-full flex-col border-b p-2 text-left hover:bg-slate-50"
                      >
                        <span className="text-sm font-medium">{ex.name_pt}</span>
                        <span className="text-xs text-muted-foreground">
                          {ex.primary_muscles?.join(', ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="font-medium">{selectedExercise.name_pt}</div>
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>Série</div><div>Reps</div><div>Peso (kg)</div><div>RIR</div>
                </div>
                {sets.map((s, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <Input value={s.set_number} disabled />
                    <Input placeholder="10" value={s.reps} onChange={(e) => updateSet(i, 'reps', e.target.value)} />
                    <Input placeholder="20" value={s.weight_kg} onChange={(e) => updateSet(i, 'weight_kg', e.target.value)} />
                    <Input placeholder="2" value={s.rir} onChange={(e) => updateSet(i, 'rir', e.target.value)} />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addSet}>
                    <Plus className="mr-1 h-4 w-4" /> Série
                  </Button>
                  <Button size="sm" onClick={saveSets} disabled={loading} className="flex-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
