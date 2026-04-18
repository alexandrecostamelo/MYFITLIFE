'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Camera, Sparkles, Star, Loader2 } from 'lucide-react';

type Gym = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  is_primary: boolean;
};

type Equipment = {
  id: string;
  name: string;
  category: string | null;
  primary_muscles: string[] | null;
  confidence: 'high' | 'medium' | 'low' | null;
  added_manually: boolean;
};

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;

  const [gym, setGym] = useState<Gym | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [workout, setWorkout] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/gyms/${gymId}`);
    const data = await res.json();
    setGym(data.gym);
    setEquipment(data.equipment || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [gymId]);

  async function addManual() {
    if (!newName) return;
    setAdding(true);
    await fetch(`/api/gyms/${gymId}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, added_manually: true }),
    });
    setNewName('');
    await load();
    setAdding(false);
  }

  async function remove(eqId: string) {
    if (!confirm('Remover este aparelho?')) return;
    await fetch(`/api/gyms/${gymId}/equipment/${eqId}`, { method: 'DELETE' });
    await load();
  }

  async function setPrimary() {
    await fetch(`/api/gyms/${gymId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_primary: true }),
    });
    await load();
  }

  async function deleteGym() {
    if (!confirm('Excluir esta academia e todos os aparelhos cadastrados?')) return;
    await fetch(`/api/gyms/${gymId}`, { method: 'DELETE' });
    router.push('/app/gyms');
  }

  async function generateWorkout() {
    setGeneratingWorkout(true);
    const res = await fetch('/api/workout/adaptive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gym_id: gymId }),
    });
    const data = await res.json();
    if (data.workout) setWorkout(data.workout);
    setGeneratingWorkout(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!gym) return <div className="p-6">Academia não encontrada</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gyms" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">{gym.name}</h1>
        {gym.is_primary && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/app/gyms/${gymId}/scan`}>
            <Camera className="mr-2 h-4 w-4" /> Escanear aparelhos
          </Link>
        </Button>
        <Button
          onClick={generateWorkout}
          disabled={generatingWorkout || equipment.length === 0}
        >
          {generatingWorkout ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <><Sparkles className="mr-2 h-4 w-4" /> Treinar aqui</>
          )}
        </Button>
      </div>

      {workout && (
        <Card className="mb-4 bg-primary/5 p-4">
          {workout.coach_message && (
            <p className="mb-3 text-sm italic">&quot;{workout.coach_message}&quot;</p>
          )}
          <div className="mb-2 text-sm font-medium">{workout.focus} · ~{workout.estimated_duration_min} min</div>

          {workout.warm_up?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground">AQUECIMENTO</p>
              <ul className="list-inside list-disc text-sm">
                {workout.warm_up.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="mb-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">EXERCÍCIOS</p>
            {workout.exercises?.map((ex: any, i: number) => (
              <div key={i} className="border-l-2 border-primary pl-3 text-sm">
                <div className="font-medium">{ex.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ex.equipment_used && <>Aparelho: {ex.equipment_used} · </>}
                  {ex.sets}x{ex.reps} · descanso {ex.rest_sec}s · RIR {ex.rir}
                </div>
                {ex.notes && <div className="mt-0.5 text-xs italic text-muted-foreground">{ex.notes}</div>}
              </div>
            ))}
          </div>

          {workout.cool_down?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">ALONGAMENTO</p>
              <ul className="list-inside list-disc text-sm">
                {workout.cool_down.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setWorkout(null)}>
            Fechar treino
          </Button>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Aparelhos cadastrados ({equipment.length})</h2>

        <div className="mb-3 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Adicionar manualmente"
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
          />
          <Button onClick={addManual} disabled={adding || !newName}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {equipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum aparelho ainda. Use &quot;Escanear aparelhos&quot; ou adicione manualmente.</p>
        ) : (
          <div className="space-y-1">
            {equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-medium">{eq.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {eq.category && <span>{eq.category}</span>}
                    {eq.primary_muscles && eq.primary_muscles.length > 0 && (
                      <span>· {eq.primary_muscles.slice(0, 2).join(', ')}</span>
                    )}
                    {eq.added_manually && <span>· manual</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(eq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4 divide-y">
        {!gym.is_primary && (
          <button onClick={setPrimary} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Marcar como academia principal</span>
          </button>
        )}
        <button onClick={deleteGym} className="flex w-full items-center gap-3 p-4 text-left text-destructive hover:bg-slate-50">
          <Trash2 className="h-4 w-4" />
          <span className="text-sm">Excluir academia</span>
        </button>
      </Card>
    </main>
  );
}
