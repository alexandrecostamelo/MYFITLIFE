'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewGymPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name) return;
    setSaving(true);
    setError(null);

    const res = await fetch('/api/gyms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, city: city || undefined, state: state || undefined }),
    });

    if (!res.ok) {
      setError('Erro ao criar');
      setSaving(false);
      return;
    }

    const data = await res.json();
    router.push(`/app/gyms/${data.id}/scan`);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gyms" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Nova academia</h1>
      </header>

      <Card className="mb-4 space-y-3 p-4">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Smart Fit Centro" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" />
          </div>
        </div>
      </Card>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <Button onClick={create} disabled={saving || !name} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar e escanear aparelhos'}
      </Button>
    </main>
  );
}
