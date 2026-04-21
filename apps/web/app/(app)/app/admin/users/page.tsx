'use client';

import { useEffect, useState, useCallback } from 'react';
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
  User2,
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

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  free: { bg: 'bg-white/[0.06]', text: 'text-white/50', dot: 'bg-white/30' },
  pro: { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  premium: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
};

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-red-500 to-pink-600',
];

function getAvatarGradient(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function getInitials(name: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name[0].toUpperCase();
}

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

  const tiers = ['', 'free', 'pro', 'premium'];

  return (
    <main className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Usuários</h1>
          <p className="text-sm text-white/35">{total.toLocaleString('pt-BR')} usuários cadastrados</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportCSV}
          className="gap-1.5 rounded-xl border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
        >
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <Input
            placeholder="Buscar nome, email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-xl border-white/[0.08] bg-white/[0.03] pl-10 text-white placeholder:text-white/25 focus:border-accent/30 focus:ring-accent/20"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => { setTierFilter(t); setPage(1); }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                tierFilter === t
                  ? 'bg-gradient-to-r from-accent to-emerald-600 text-white shadow-lg shadow-accent/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t === '' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Usuário</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Plano</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Role</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Cadastro</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-white/25">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-accent/60" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <User2 className="mx-auto mb-2 h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/30">Nenhum usuário encontrado</p>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const tier = u.subscription_tier || 'free';
                const style = TIER_STYLES[tier] || TIER_STYLES.free;
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] ${u.blocked ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(u.id)} text-xs font-bold text-white shadow-sm`}>
                          {getInitials(u.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-white/90">{u.full_name || '—'}</p>
                            {u.blocked && (
                              <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">Bloqueado</span>
                            )}
                          </div>
                          <p className="truncate text-xs text-white/30">{u.email || u.username ? `@${u.username}` : u.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg ${style.bg} px-2.5 py-1 text-xs font-medium ${style.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {tier}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-white/35">{u.role || 'user'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-white/35">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {u.blocked ? (
                          <button
                            onClick={() => act(u.id, 'unblock')}
                            disabled={acting === u.id}
                            className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-500/10"
                            title="Desbloquear"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => act(u.id, 'block')}
                            disabled={acting === u.id}
                            className="rounded-lg p-2 text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-400"
                            title="Bloquear"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {u.subscription_tier !== 'pro' && (
                          <button
                            onClick={() => act(u.id, 'change_tier', 'pro')}
                            disabled={acting === u.id}
                            className="rounded-lg p-2 text-white/25 transition-colors hover:bg-accent/10 hover:text-accent"
                            title="Promover a Pro"
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border border-white/[0.06] p-2 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.03] px-3 py-1.5 text-xs">
            <span className="font-semibold text-white">{page}</span>
            <span className="text-white/25">de</span>
            <span className="text-white/50">{totalPages}</span>
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-white/[0.06] p-2 text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
