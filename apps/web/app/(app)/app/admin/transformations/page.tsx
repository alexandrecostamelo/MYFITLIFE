'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Loader2, Check, X, Star } from 'lucide-react';

export default function AdminTransformationsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/transformations?status=${status}`);
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (!res.ok) { setLoading(false); return; }
    setPosts((await res.json()).posts || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function doAction(id: string, act: string, reason?: string) {
    await fetch('/api/admin/transformations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: act, reason }),
    });
    await load();
  }

  if (forbidden) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Card className="p-6 text-center">
          <Shield className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm">Acesso negado. Apenas admins da plataforma.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Moderar transformações</h1>
      </header>

      <Card className="mb-3 p-1">
        <div className="grid grid-cols-3 gap-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${status === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovadas' : 'Rejeitadas'}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum post.</Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="grid grid-cols-2">
                <img src={p.before_url} alt="" className="aspect-square w-full object-cover" />
                <img src={p.after_url} alt="" className="aspect-square w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="mb-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                  <span className="font-medium">{p.author?.full_name}</span>
                  {p.author?.username && <span>@{p.author.username}</span>}
                  <span>· {p.category}</span>
                  {p.anonymized && <span className="text-amber-600">· ANÔNIMO</span>}
                  {p.period_days && <span>· {p.period_days} dias</span>}
                </div>
                {p.title && <div className="mb-1 text-sm font-medium">{p.title}</div>}
                {p.story && <p className="mb-2 line-clamp-4 text-xs text-muted-foreground">{p.story}</p>}

                <div className="flex flex-wrap gap-1.5">
                  {status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => doAction(p.id, 'approve')}>
                        <Check className="mr-1 h-3 w-3" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const reason = prompt('Motivo da rejeição:');
                        if (reason !== null) doAction(p.id, 'reject', reason);
                      }}>
                        <X className="mr-1 h-3 w-3" /> Rejeitar
                      </Button>
                    </>
                  )}
                  {status === 'approved' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => doAction(p.id, p.featured ? 'unfeature' : 'feature')}>
                        <Star className={`mr-1 h-3 w-3 ${p.featured ? 'fill-current text-amber-500' : ''}`} />
                        {p.featured ? 'Remover destaque' : 'Destacar'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        if (confirm('Remover definitivamente?')) doAction(p.id, 'remove');
                      }}>
                        Remover
                      </Button>
                    </>
                  )}
                  {status === 'rejected' && p.reject_reason && (
                    <p className="text-xs text-destructive">Motivo: {p.reject_reason}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
