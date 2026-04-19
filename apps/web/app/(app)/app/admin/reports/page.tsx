'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Loader2, Trash2, X } from 'lucide-react';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Assédio',
  eating_disorder: 'Transtorno alimentar',
  hate_speech: 'Discurso de ódio',
  inappropriate: 'Inapropriado',
  other: 'Outro',
};

const ADMIN_NAV = (
  <Card className="mb-4 p-2">
    <div className="grid grid-cols-4 gap-1">
      <Button asChild variant="ghost" size="sm"><Link href="/app/admin/claims">Claims</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href="/app/admin/professionals">Profissionais</Link></Button>
      <Button asChild variant="default" size="sm"><Link href="/app/admin/reports">Denúncias</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href="/app/admin/ai-metrics">IA</Link></Button>
    </div>
  </Card>
);

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  async function load() {
    const res = await fetch('/api/admin/reports');
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: 'remove_content' | 'dismiss') {
    await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  const filtered = filter === 'pending' ? reports.filter((r) => r.status === 'pending') : reports;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Denúncias (admin)</h1>
      </header>

      {ADMIN_NAV}

      <div className="mb-4 flex gap-2">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${filter === f ? 'border-primary bg-primary/10' : 'border-input'}`}
          >
            {f === 'pending' ? 'Pendentes' : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma denúncia {filter === 'pending' ? 'pendente' : ''}.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">{REASON_LABELS[r.reason] || r.reason}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.target_type === 'post' ? 'Post' : r.target_type === 'comment' ? 'Comentário' : 'Usuário'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs">
                    Por {r.reporter?.full_name || 'Usuário'} · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs ${
                  r.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  r.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {r.status === 'pending' ? 'Pendente' : r.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                </span>
              </div>

              {r.details && (
                <div className="mb-3 rounded bg-slate-50 p-2 text-xs">{r.details}</div>
              )}

              {r.target_type === 'post' && (
                <div className="mb-3 text-xs">
                  <Link href={`/app/community/post/${r.target_id}`} className="text-primary hover:underline">Ver post →</Link>
                </div>
              )}

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => act(r.id, 'remove_content')} className="flex-1">
                    <Trash2 className="mr-1 h-3 w-3" /> Remover conteúdo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(r.id, 'dismiss')} className="flex-1">
                    <X className="mr-1 h-3 w-3" /> Descartar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
