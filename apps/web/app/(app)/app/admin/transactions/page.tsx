'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  Calendar,
} from 'lucide-react';

const GATEWAY_FILTERS = [
  { value: '', label: 'Todos gateways' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'pagarme', label: 'PagarMe' },
];

const STATUS_FILTERS = [
  { value: '', label: 'Qualquer status' },
  { value: 'paid', label: 'Pago' },
  { value: 'pending', label: 'Pendente' },
  { value: 'refunded', label: 'Estornado' },
  { value: 'failed', label: 'Falhou' },
];

const TX_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  refunded: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

function formatBRL(val: number) {
  return (val / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (gateway) params.set('gateway', gateway);
    if (status) params.set('status', status);
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    const res = await fetch(`/api/admin/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTotal(data.total || 0);
    setTotalPages(data.total_pages || 1);
    setLoading(false);
  }, [page, gateway, status, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const params = new URLSearchParams({ format: 'csv' });
    if (gateway) params.set('gateway', gateway);
    if (status) params.set('status', status);
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    window.open(`/api/admin/transactions?${params}`, '_blank');
  };

  const paidTotal = transactions
    .filter((t) => t.status === 'paid')
    .reduce((s, t) => s + Number(t.amount_cents || t.amount || 0), 0);

  return (
    <main className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transações</h1>
          <p className="text-sm text-white/35">{total} transações encontradas</p>
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

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {GATEWAY_FILTERS.map((g) => (
            <button
              key={g.value}
              onClick={() => { setGateway(g.value); setPage(1); }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                gateway === g.value
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/60'
              }`}
            >
              {g.label}
            </button>
          ))}
          <div className="mx-1 w-px bg-white/[0.06]" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatus(s.value); setPage(1); }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                status === s.value
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/[0.03] text-white/40 hover:text-white/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-white/25" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-40 rounded-xl border-white/[0.08] bg-white/[0.03] text-sm text-white"
            />
            <span className="text-xs text-white/25">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-40 rounded-xl border-white/[0.08] bg-white/[0.03] text-sm text-white"
            />
          </div>
          {paidTotal > 0 && (
            <span className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              Total pago: {formatBRL(paidTotal)}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Data</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Usuário</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Gateway</th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
              <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-white/25">Valor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-white/30" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Receipt className="mx-auto mb-2 h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/30">Nenhuma transação encontrada</p>
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const profArr = t.profiles as { full_name: string; email: string }[] | { full_name: string; email: string } | null;
                const prof = Array.isArray(profArr) ? profArr[0] : profArr;
                const st = TX_STATUS_STYLES[t.status] || { bg: 'bg-white/[0.06]', text: 'text-white/50' };
                const amount = Number(t.amount_cents || t.amount || 0);
                return (
                  <tr key={t.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-xs text-white/35">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-white/70">{prof?.full_name || '—'}</p>
                      <p className="text-xs text-white/25">{prof?.email || t.user_id?.slice(0, 8)}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">{t.gateway || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-lg ${st.bg} px-2 py-0.5 text-xs font-medium ${st.text}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm text-white/60">
                      {formatBRL(amount)}
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
