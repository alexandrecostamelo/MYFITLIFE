'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Wallet,
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

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  trialing: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  canceled: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500' },
  paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
  pending: { bg: 'bg-white/[0.06]', text: 'text-white/50', dot: 'bg-white/40' },
  past_due: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
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

const FILTER_LABELS: Record<string, string> = {
  '': 'Todos',
  active: 'Ativo',
  trialing: 'Trial',
  paused: 'Pausado',
  canceled: 'Cancelado',
  past_due: 'Inadimplente',
};

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
    <main className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Assinaturas</h1>
          <p className="text-sm text-white/35">{total} assinaturas encontradas</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportCSV}
          className="gap-1.5 rounded-xl border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
        {Object.entries(FILTER_LABELS).map(([val, label]) => (
          <button
            key={val}
            onClick={() => { setStatusFilter(val); setPage(1); }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              statusFilter === val
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Usuário</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Plano</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Valor</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Pagamento</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Próx. cobrança</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Criado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-violet-400/60" />
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Wallet className="mx-auto mb-2 h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/30">Nenhuma assinatura encontrada</p>
                </td>
              </tr>
            ) : (
              subs.map((s) => {
                const planKey = `${s.plan}_${s.billing_cycle}`;
                const price = PLAN_PRICES[planKey] || 0;
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                return (
                  <tr key={s.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white/80">{s.user_name || '—'}</p>
                      <p className="text-xs text-white/25">{s.user_email || s.user_id.slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium capitalize text-white/80">{s.plan}</span>
                      <span className="ml-1.5 text-xs text-white/30">
                        {s.billing_cycle === 'yearly' ? 'anual' : 'mensal'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm text-white/60">{formatBRL(price)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg ${st.bg} px-2.5 py-1 text-xs font-medium ${st.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {s.status}
                      </span>
                      {s.paused_until && (
                        <p className="mt-0.5 text-[10px] text-white/25">
                          até {new Date(s.paused_until).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-white/35">
                        {s.payment_method === 'pix' ? (
                          <Banknote className="h-3.5 w-3.5 text-green-400/60" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5 text-blue-400/60" />
                        )}
                        <span>{s.provider || '—'}</span>
                        {s.card_last4 && <span className="font-mono">*{s.card_last4}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/35">
                      {s.next_billing_at
                        ? new Date(s.next_billing_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/35">
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
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
