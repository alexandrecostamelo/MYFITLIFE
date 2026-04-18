'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

const METRICS = [
  { value: 'workouts', label: 'Treinos completos' },
  { value: 'sets', label: 'Séries totais' },
  { value: 'meals', label: 'Refeições registradas' },
  { value: 'checkins', label: 'Check-ins matinais' },
  { value: 'weight_logs', label: 'Pesagens' },
  { value: 'xp', label: 'XP acumulado' },
  { value: 'trail_days', label: 'Dias de trilha' },
];

export default function NewChallengePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metric, setMetric] = useState('workouts');
  const [targetValue, setTargetValue] = useState('10');
  const [duration, setDuration] = useState(7);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setSaving(true);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + duration);

    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        metric,
        target_value: parseInt(targetValue),
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.id) router.push(`/app/challenges/${data.id}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/challenges" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Novo desafio</h1>
      </header>

      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: 15 treinos em 30 dias" />
        </div>
        <div>
          <Label>Descrição (opcional)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label>Métrica</Label>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
            {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Meta</Label>
            <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
          </div>
          <div>
            <Label>Duração (dias)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 7)} />
          </div>
        </div>
      </Card>

      <Button onClick={create} disabled={saving || !title || !targetValue} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar desafio'}
      </Button>
    </main>
  );
}
