'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  Crown,
} from 'lucide-react';

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  blocked?: boolean;
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/60',
  pro: 'bg-accent/20 text-accent',
  premium: 'bg-amber-500/20 text-amber-400',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('q', search);
    if (tierFilter) params.set('tier', tierFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setTotalPages(data.total_pages || 1);
    setLoading(false);
  }, [page, search, tierFilter]);

  useEffect(() => { load(); }, [load]);

  const act = async (userId: string, action: string, value?: string) => {
    setActing(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, value }),
    });
    await load();
    setActing(null);
  };

  const exportCSV = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (search) params.set('q', search);
    if (tierFilter) params.set('tier', tierFilter);
    window.open(`/api/admin/users?${params}`, '_blank');
  };

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total.toLocaleString('pt-BR')} total</span>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {['', 'free', 'pro', 'premium'].map((t) => (
            <button
              key={t}
              onClick={() => { setTierFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tierFilter === t
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {t === '' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left p-3">Usuário</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plano</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Criado em</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-sm">{u.full_name || '—'}</p>
                      {u.username && (
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{u.email || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_COLORS[u.subscription_tier || 'free'] || TIER_COLORS.free}`}>
                      {u.subscription_tier || 'free'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{u.role || 'user'}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {u.blocked ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => act(u.id, 'unblock')}
                          disabled={acting === u.id}
                          title="Desbloquear"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => act(u.id, 'block')}
                          disabled={acting === u.id}
                          title="Bloquear"
                        >
                          <Ban className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                      {u.subscription_tier !== 'pro' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => act(u.id, 'change_tier', 'pro')}
                          disabled={acting === u.id}
                          title="Promover a Pro"
                        >
                          <Crown className="h-3.5 w-3.5 text-accent" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page}/{totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
