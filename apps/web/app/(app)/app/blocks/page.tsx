'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, UserX } from 'lucide-react';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch('/api/blocks');
    const data = await res.json();
    setBlocks(data.blocks || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function unblock(id: string) {
    await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Usuários bloqueados</h1>
      </header>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : blocks.length === 0 ? (
        <Card className="p-6 text-center">
          <UserX className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Você não bloqueou ninguém.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <Card key={b.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{b.user.full_name || 'Usuário'}</div>
                  {b.user.username && <div className="text-xs text-muted-foreground">@{b.user.username}</div>}
                </div>
                <Button size="sm" variant="outline" onClick={() => unblock(b.id)}>Desbloquear</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
