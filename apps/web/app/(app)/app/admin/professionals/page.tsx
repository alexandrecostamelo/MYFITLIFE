'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shield, Check, X, Eye } from 'lucide-react';

const PROFESSION_LABELS: Record<string, string> = {
  nutritionist: 'Nutri',
  personal_trainer: 'Personal',
  physiotherapist: 'Fisio',
};

export default function AdminProfessionalsPage() {
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');

  async function load() {
    const res = await fetch('/api/admin/professionals');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setPros(data.professionals || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'verify' | 'unverify' | 'deactivate' | 'reactivate') {
    await fetch(`/api/admin/professionals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  const filtered = pros.filter((p) => {
    if (filter === 'pending') return !p.verified;
    if (filter === 'verified') return p.verified;
    return true;
  });

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/admin/claims" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Profissionais (admin)</h1>
      </header>

      <Card className="mb-4 p-2">
        <div className="grid grid-cols-5 gap-1">
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/claims">Claims</Link></Button>
          <Button asChild variant="default" size="sm"><Link href="/app/admin/professionals">Pros</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/reports">Denúncias</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/ai-metrics">IA</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/feature-flags">Flags</Link></Button>
        </div>
      </Card>

      <div className="mb-4 flex gap-2">
        {(['pending', 'verified', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${filter === f ? 'border-primary bg-primary/10' : 'border-input'}`}
          >
            {f === 'pending' ? 'Aguardando' : f === 'verified' ? 'Verificados' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum profissional.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{PROFESSION_LABELS[p.profession]}</span>
                    {p.verified && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">Verificado</span>}
                    {!p.active && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">Inativo</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.council_type} {p.council_number}/{p.council_state}
                    {(p.city || p.state) && ` · ${[p.city, p.state].filter(Boolean).join(', ')}`}
                  </div>
                  {p.bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.bio}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/professionals/${p.id}`}><Eye className="mr-1 h-3 w-3" /> Ver</Link>
                </Button>
                {!p.verified ? (
                  <Button size="sm" onClick={() => act(p.id, 'verify')}>
                    <Check className="mr-1 h-3 w-3" /> Verificar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => act(p.id, 'unverify')}>
                    Remover verificação
                  </Button>
                )}
                {p.active ? (
                  <Button size="sm" variant="outline" onClick={() => act(p.id, 'deactivate')}>
                    <X className="mr-1 h-3 w-3" /> Desativar
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => act(p.id, 'reactivate')}>
                    Reativar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
