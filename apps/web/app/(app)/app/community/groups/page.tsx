'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Users, Search, Plus } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'treino', label: 'Treino' },
  { value: 'esporte', label: 'Esporte' },
  { value: 'nutrição', label: 'Nutrição' },
  { value: 'bem-estar', label: 'Bem-estar' },
  { value: 'saúde', label: 'Saúde' },
  { value: 'comunidade', label: 'Comunidade' },
];

export default function GroupsListPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category) params.set('category', category);
    const res = await fetch(`/api/groups?${params}`);
    const data = await res.json();
    setGroups(data.groups || []);
    setLoading(false);
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function toggleJoin(slug: string, isMember: boolean) {
    setJoining(slug);
    await fetch(`/api/groups/${slug}/join`, { method: isMember ? 'DELETE' : 'POST' });
    await load();
    setJoining(null);
  }

  const myGroups = groups.filter((g) => g.is_member);
  const discover = groups.filter((g) => !g.is_member);

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app/community" className="rounded p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Grupos</h1>
        </div>
        <Button asChild size="sm">
          <Link href="/app/community/groups/new">
            <Plus className="mr-1 h-4 w-4" /> Criar grupo
          </Link>
        </Button>
      </header>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar grupos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-transparent py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Category filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              category === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* My groups */}
          {myGroups.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Meus grupos ({myGroups.length})
              </h3>
              <div className="space-y-2">
                {myGroups.map((g) => (
                  <Link key={g.id} href={`/app/community/groups/${g.slug}`}>
                    <Card className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{g.cover_emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{g.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {g.member_count} membros
                          </div>
                        </div>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          membro
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discover */}
          {discover.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                Descobrir ({discover.length})
              </h3>
              <div className="space-y-2">
                {discover.map((g) => (
                  <Card key={g.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/app/community/groups/${g.slug}`} className="flex flex-1 items-center gap-3">
                        <div className="text-2xl">{g.cover_emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{g.name}</div>
                          {g.description && (
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                              {g.description}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {g.member_count}
                          </div>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleJoin(g.slug, false)}
                        disabled={joining === g.slug}
                      >
                        {joining === g.slug ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Entrar'
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {groups.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhum grupo encontrado.
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
