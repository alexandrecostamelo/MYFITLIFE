'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Check, X, UserPlus, Loader2, Flame, Trophy } from 'lucide-react';

type Friend = {
  friendship_id: string;
  status: string;
  user: { id: string; full_name: string | null; username: string | null; avatar_url: string | null };
  stats: { level: number; total_xp: number; current_streak: number } | null;
};

export default function FriendsPage() {
  const [data, setData] = useState<{ accepted: Friend[]; incoming: Friend[]; outgoing: Friend[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  async function load() {
    const res = await fetch('/api/friends');
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    setSearchResults(d.results || []);
    setSearching(false);
  }

  async function sendRequest(userId: string) {
    await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    setQuery('');
    setSearchResults([]);
    await load();
  }

  async function respond(id: string, action: 'accept' | 'decline') {
    await fetch(`/api/friends/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Remover esta amizade?')) return;
    await fetch(`/api/friends/${id}`, { method: 'DELETE' });
    await load();
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/stats" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Amigos</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Adicionar amigo</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por @username ou nome"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </div>
        {searching && <Loader2 className="mt-2 h-4 w-4 animate-spin" />}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded border">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b p-2">
                <div>
                  <div className="text-sm font-medium">{u.full_name || 'Usuário'}</div>
                  {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                </div>
                <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)}>
                  <UserPlus className="mr-1 h-3 w-3" /> Adicionar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data && data.incoming.length > 0 && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 text-sm font-medium">Solicitações recebidas</h2>
          <div className="space-y-2">
            {data.incoming.map((f) => (
              <div key={f.friendship_id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-medium">{f.user.full_name || 'Usuário'}</div>
                  {f.user.username && <div className="text-xs text-muted-foreground">@{f.user.username}</div>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => respond(f.friendship_id, 'accept')}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respond(f.friendship_id, 'decline')}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium">
          Amigos ({data?.accepted.length || 0})
        </h2>
        {!data || data.accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum amigo ainda. Busque acima para adicionar.</p>
        ) : (
          <div className="space-y-2">
            {data.accepted.map((f) => (
              <div key={f.friendship_id} className="flex items-center justify-between rounded border p-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.user.full_name || 'Amigo'}</div>
                  {f.user.username && <div className="text-xs text-muted-foreground">@{f.user.username}</div>}
                  {f.stats && (
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Nv {f.stats.level}</span>
                      <span>· {f.stats.total_xp} XP</span>
                      {f.stats.current_streak > 0 && (
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> {f.stats.current_streak}</span>
                      )}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(f.friendship_id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data && data.outgoing.length > 0 && (
        <Card className="mt-4 p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Enviadas ({data.outgoing.length})</h2>
          {data.outgoing.map((f) => (
            <div key={f.friendship_id} className="flex items-center justify-between rounded p-2 text-sm">
              <span className="text-muted-foreground">{f.user.full_name || f.user.username || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground">aguardando</span>
            </div>
          ))}
        </Card>
      )}
    </main>
  );
}
