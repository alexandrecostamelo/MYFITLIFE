'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  plan: string;
  billing_cycle: string;
  status: string;
  provider: string | null;
  payment_method: string | null;
  next_billing_at: string | null;
  created_at: string;
  card_brand: string | null;
  card_last4: string | null;
  paused_until: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  trialing: 'bg-blue-500/20 text-blue-400',
  canceled: 'bg-red-500/20 text-red-400',
  paused: 'bg-amber-500/20 text-amber-400',
  pending: 'bg-white/10 text-white/60',
  past_due: 'bg-orange-500/20 text-orange-400',
};

const PLAN_PRICES: Record<string, number> = {
  pro_monthly: 2990,
  pro_yearly: 24990,
  premium_monthly: 9990,
  premium_yearly: 99900,
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await res.json();
    setSubs(data.subscriptions || []);
    setTotal(data.total || 0);
    setTotalPages(data.total_pages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (statusFilter) params.set('status', statusFilter);
    window.open(`/api/admin/subscriptions?${params}`, '_blank');
  };

  return (
    <main className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Assinaturas</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} total</span>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {['', 'active', 'trialing', 'paused', 'canceled', 'past_due'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-accent text-black'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {s === '' ? 'Todos' : s === 'past_due' ? 'Inadimplente' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left p-3">Usuário</th>
              <th className="text-left p-3">Plano</th>
              <th className="text-left p-3">Valor</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Provider</th>
              <th className="text-left p-3">Próx. cobrança</th>
              <th className="text-left p-3">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Nenhuma assinatura encontrada.
                </td>
              </tr>
            ) : (
              subs.map((s) => {
                const planKey = `${s.plan}_${s.billing_cycle}`;
                const price = PLAN_PRICES[planKey] || 0;
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3">
                      <p className="font-medium text-sm">{s.user_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{s.user_email || s.user_id.slice(0, 8)}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-medium capitalize">{s.plan}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({s.billing_cycle === 'yearly' ? 'anual' : 'mensal'})
                      </span>
                    </td>
                    <td className="p-3 text-xs font-mono">{formatBRL(price)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.pending}`}>
                        {s.status}
                      </span>
                      {s.paused_until && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          até {new Date(s.paused_until).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {s.payment_method === 'pix' ? (
                          <Banknote className="h-3 w-3" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                        {s.provider || '—'}
                        {s.card_last4 && <span className="font-mono">*{s.card_last4}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {s.next_billing_at
                        ? new Date(s.next_billing_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page}/{totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
