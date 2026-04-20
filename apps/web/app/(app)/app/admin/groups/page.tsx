'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'text-green-600' },
  pending_approval: { label: 'Pendente', color: 'text-yellow-600' },
  rejected: { label: 'Rejeitado', color: 'text-red-600' },
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/groups');
    const data = await res.json();
    setGroups(data.groups || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function action(id: string, act: 'approve' | 'reject') {
    setActing(id);
    await fetch(`/api/admin/groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act }),
    });
    await load();
    setActing(null);
  }

  async function remove(id: string) {
    if (!confirm('Excluir este grupo permanentemente?')) return;
    setActing(id);
    await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
    await load();
    setActing(null);
  }

  const pending = groups.filter((g) => g.status === 'pending_approval');
  const rest = groups.filter((g) => g.status !== 'pending_approval');

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Admin: Grupos</h1>
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold">Admin: Grupos</h1>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase text-yellow-600">
            Pendentes de aprovação ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{g.cover_emoji}</span>
                      <span className="font-medium">{g.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{g.category}</span>
                    </div>
                    {g.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      slug: {g.slug} · criado em{' '}
                      {new Date(g.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => action(g.id, 'approve')}
                      disabled={acting === g.id}
                    >
                      {acting === g.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => action(g.id, 'reject')}
                      disabled={acting === g.id}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
        Todos os grupos ({rest.length})
      </h2>
      <div className="space-y-2">
        {rest.map((g) => {
          const s = STATUS_LABELS[g.status] || { label: g.status, color: '' };
          return (
            <Card key={g.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{g.cover_emoji}</span>
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">{g.category}</span>
                  <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {g.member_count} membros
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(g.id)}
                  disabled={acting === g.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum grupo cadastrado.
        </Card>
      )}
    </main>
  );
}
