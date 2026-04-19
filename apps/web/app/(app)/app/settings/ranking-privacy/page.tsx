'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function RankingPrivacyPage() {
  const [show, setShow] = useState(true);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch('/api/me/ranking-privacy');
    const data = await res.json();
    if (data.prefs) {
      setShow(data.prefs.show_in_public_rankings ?? true);
      setCity(data.prefs.city || '');
      setState(data.prefs.state || '');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/me/ranking-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        show_in_public_rankings: show,
        city: city || undefined,
        state: state || undefined,
      }),
    });
    setSaving(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/rankings" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Privacidade nos rankings</h1>
      </header>

      <Card className="mb-4 p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Aparecer em rankings públicos</div>
            <p className="text-xs text-muted-foreground">
              Controla se seu nome aparece nos rankings de academia, cidade e estado.
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </Card>

      <Card className="mb-4 p-4">
        <h3 className="mb-1 text-sm font-medium">Sua localização</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Usada nos rankings de cidade e estado. Pode deixar em branco se preferir.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label>Cidade</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo"
            />
          </div>
          <div className="space-y-1">
            <Label>UF</Label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-0 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm"
            >
              <option value="">--</option>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Privacidade é prioridade. Você pode desativar a qualquer momento.
      </p>
    </main>
  );
}
