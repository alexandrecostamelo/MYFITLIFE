'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch('/api/admin/claims');
    if (res.status === 403) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setClaims(data.claims || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function review(claimId: string, action: 'approve' | 'reject') {
    setActing(claimId);
    await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, admin_notes: notes[claimId] || undefined }),
    });
    setActing(null);
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const pending = claims.filter((c) => c.status === 'pending');
  const reviewed = claims.filter((c) => c.status !== 'pending');

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Solicitações de propriedade</h1>
      </header>

      {claims.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma solicitação encontrada. Você pode não ter permissão de administrador.
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-amber-500" /> Pendentes ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((c) => (
                  <Card key={c.id} className="p-4">
                    <div className="mb-2">
                      <div className="font-medium">{c.gym_place?.name || c.gym_place_id}</div>
                      {c.gym_place?.city && (
                        <div className="text-xs text-muted-foreground">
                          {[c.gym_place.city, c.gym_place.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="mb-2 text-sm">
                      <span className="text-muted-foreground">Solicitante: </span>
                      {c.user?.full_name || c.user?.username || c.user_id}
                    </div>
                    {c.message && (
                      <p className="mb-2 rounded bg-slate-50 p-2 text-xs text-muted-foreground">{c.message}</p>
                    )}
                    <div className="mb-2 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <textarea
                      className="mb-2 w-full rounded-md border border-input bg-background p-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                      placeholder="Observação para o usuário (opcional)"
                      value={notes[c.id] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={acting === c.id}
                        onClick={() => review(c.id, 'approve')}
                      >
                        {acting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <><CheckCircle className="mr-1 h-4 w-4" /> Aprovar</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={acting === c.id}
                        onClick={() => review(c.id, 'reject')}
                      >
                        {acting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <><XCircle className="mr-1 h-4 w-4" /> Rejeitar</>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Revisadas ({reviewed.length})</h2>
              <div className="space-y-2">
                {reviewed.map((c) => (
                  <Card key={c.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{c.gym_place?.name || c.gym_place_id}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.user?.full_name || c.user_id} · {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${c.status === 'approved' ? 'text-green-600' : 'text-destructive'}`}>
                        {c.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
