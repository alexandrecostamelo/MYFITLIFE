'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

interface FinancialData {
  period_days: number;
  total_paid_cents: number;
  total_failed_cents: number;
  total_pending_cents: number;
  transaction_count: number;
  active_subscribers: number;
  arpu_cents: number;
  by_method: Record<string, number>;
  by_plan: Record<string, number>;
  recent_transactions: Record<string, unknown>[];
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão',
  pix: 'Pix',
  boleto: 'Boleto',
  stripe: 'Stripe',
  unknown: 'Outro',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  refunded: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

const METHOD_COLORS: Record<string, string> = {
  credit_card: 'from-blue-500 to-indigo-600',
  pix: 'from-emerald-500 to-green-600',
  boleto: 'from-amber-500 to-orange-600',
  stripe: 'from-violet-500 to-purple-600',
  unknown: 'from-gray-400 to-zinc-600',
};

export default function AdminFinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/financial?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const exportCSV = () => {
    window.open(`/api/admin/financial?days=${days}&format=csv`, '_blank');
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
            <Loader2 className="relative h-8 w-8 animate-spin text-green-400" />
          </div>
          <p className="text-sm text-white/30">Carregando financeiro...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">Erro ao carregar dados financeiros.</p>
        </div>
      </main>
    );
  }

  const ltvEstimate = data.active_subscribers > 0
    ? Math.round((data.arpu_cents / data.period_days) * 365)
    : 0;

  const totalByMethod = Object.values(data.by_method).reduce((a, b) => a + b, 0) || 1;

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financeiro</h1>
          <p className="text-sm text-white/35">Visão financeira da plataforma</p>
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

      {/* Period selector */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 w-fit">
        {[
          { value: 7, label: '7 dias' },
          { value: 30, label: '30 dias' },
          { value: 90, label: '90 dias' },
          { value: 365, label: '1 ano' },
        ].map((d) => (
          <button
            key={d.value}
            onClick={() => setDays(d.value)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              days === d.value
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-emerald-500/20">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{formatBRL(data.total_paid_cents)}</p>
            <p className="mt-0.5 text-xs text-white/35">Receita paga</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-red-500/20">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-red-500/10 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{formatBRL(data.total_failed_cents)}</p>
            <p className="mt-0.5 text-xs text-white/35">Falhadas</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-blue-500/20">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-500/10 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Users className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{formatBRL(data.arpu_cents)}</p>
            <p className="mt-0.5 text-xs text-white/35">ARPU ({days}d)</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-violet-500/20">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-violet-500/10 blur-xl transition-all group-hover:scale-150" />
          <div className="relative">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{formatBRL(ltvEstimate)}</p>
            <p className="mt-0.5 text-xs text-white/35">LTV estimado</p>
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Receita por método</h2>
          {Object.entries(data.by_method).length === 0 ? (
            <p className="text-sm text-white/25">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.by_method)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const pct = (amount / totalByMethod) * 100;
                  return (
                    <div key={method}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm text-white/60">{METHOD_LABELS[method] || method}</span>
                        <span className="font-mono text-sm font-medium text-white/80">{formatBRL(amount)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${METHOD_COLORS[method] || 'from-gray-500 to-zinc-600'} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Receita por plano</h2>
          {Object.entries(data.by_plan).length === 0 ? (
            <p className="text-sm text-white/25">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.by_plan)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, amount]) => (
                  <div key={plan} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                    <span className="text-sm font-medium capitalize text-white/60">{plan}</span>
                    <span className="font-mono text-sm font-semibold text-white/80">{formatBRL(amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-white/30" />
            <h2 className="text-sm font-semibold text-white/70">
              Transações recentes
            </h2>
          </div>
          <span className="text-xs text-white/25">{data.transaction_count} no período</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Data</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Descrição</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Método</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Status</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-white/25">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_transactions.map((t, i) => {
              const st = STATUS_STYLES[String(t.status)] || STATUS_STYLES.pending;
              return (
                <tr key={i} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-xs text-white/35">
                    {new Date(t.created_at as string).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-xs text-white/60">{String(t.description || '—')}</td>
                  <td className="px-5 py-3 text-xs text-white/35">
                    {METHOD_LABELS[String(t.method)] || String(t.method || '—')}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-lg ${st.bg} px-2 py-0.5 text-xs font-medium ${st.text}`}>
                      {String(t.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-white/60">
                    {formatBRL(Number(t.amount_cents) || 0)}
                  </td>
                </tr>
              );
            })}
            {data.recent_transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Wallet className="mx-auto mb-2 h-8 w-8 text-white/10" />
                  <p className="text-sm text-white/30">Nenhuma transação no período</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
