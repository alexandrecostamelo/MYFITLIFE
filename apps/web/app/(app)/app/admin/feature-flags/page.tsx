'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shield, Flag } from 'lucide-react';

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/admin/feature-flags');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setFlags(data.flags || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function update(id: string, field: string, value: any) {
    await fetch('/api/admin/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    });
    await load();
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Feature flags</h1>
      </header>

      <Card className="mb-4 p-2">
        <div className="grid grid-cols-6 gap-1">
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/claims">Claims</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/professionals">Pros</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/reports">Denúncias</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/ai-metrics">IA</Link></Button>
          <Button asChild variant="default" size="sm"><Link href="/app/admin/feature-flags">Flags</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/exercises">Vídeos</Link></Button>
        </div>
      </Card>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : flags.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Sem acesso ou sem flags.</Card>
      ) : (
        <div className="space-y-2">
          {flags.map((f) => (
            <Card key={f.id} className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Flag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">{f.name}</span>
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">{f.key}</code>
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" checked={f.enabled} onChange={(e) => update(f.id, 'enabled', e.target.checked)} />
                  <div className="relative h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 dark:bg-slate-600" />
                </label>
              </div>
              {f.description && <p className="mb-2 text-xs text-muted-foreground">{f.description}</p>}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={f.rollout_pct}
                  onChange={(e) => update(f.id, 'rollout_pct', Number(e.target.value))}
                  disabled={!f.enabled}
                  className="flex-1"
                />
                <span className="w-12 text-right text-xs">{f.rollout_pct}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
