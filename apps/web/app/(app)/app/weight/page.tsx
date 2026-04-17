'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';

type WeightLog = {
  id: string;
  weight_kg: number;
  body_fat_percent: number | null;
  notes: string | null;
  logged_at: string;
};

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch('/api/weight');
    const data = await res.json();
    setLogs(data.logs || []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!weight) return;
    setSaving(true);
    await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weight_kg: parseFloat(weight),
        body_fat_percent: bodyFat ? parseFloat(bodyFat) : undefined,
      }),
    });
    setWeight('');
    setBodyFat('');
    setShowForm(false);
    await load();
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Remover este registro?')) return;
    await fetch(`/api/weight?id=${id}`, { method: 'DELETE' });
    await load();
  }

  const latest = logs[0];
  const previous = logs[1];
  const diff = latest && previous ? Number(latest.weight_kg) - Number(previous.weight_kg) : 0;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Peso</h1>
      </header>

      {latest && (
        <Card className="mb-4 p-4">
          <div className="text-xs text-muted-foreground">Peso atual</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{Number(latest.weight_kg).toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">kg</div>
            {previous && (
              <div className={`ml-2 flex items-center gap-1 text-sm ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {diff < 0 ? <TrendingDown className="h-4 w-4" /> : diff > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {diff !== 0 && `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`}
              </div>
            )}
          </div>
          {latest.body_fat_percent && (
            <div className="mt-1 text-xs text-muted-foreground">
              % gordura: {Number(latest.body_fat_percent).toFixed(1)}%
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(latest.logged_at).toLocaleDateString('pt-BR')}
          </div>
        </Card>
      )}

      {showForm ? (
        <Card className="mb-4 p-4 space-y-3">
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75.5" autoFocus />
          </div>
          <div>
            <Label>% gordura (opcional)</Label>
            <Input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="18.5" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !weight} className="flex-1">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setWeight(''); setBodyFat(''); }}>Cancelar</Button>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="mb-4 w-full">
          <Plus className="mr-2 h-4 w-4" /> Registrar peso
        </Button>
      )}

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">HISTÓRICO</h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{Number(log.weight_kg).toFixed(1)} kg</div>
              <div className="text-xs text-muted-foreground">
                {new Date(log.logged_at).toLocaleDateString('pt-BR')}
                {log.body_fat_percent && ` · ${Number(log.body_fat_percent).toFixed(1)}% gordura`}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(log.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {logs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>}
      </div>
    </main>
  );
}
