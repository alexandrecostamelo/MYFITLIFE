'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
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

const STATUS_COLORS: Record<string, string> = {
  paid: 'text-green-400',
  failed: 'text-red-400',
  pending: 'text-amber-400',
  refunded: 'text-blue-400',
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
      <main className="p-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Erro ao carregar dados financeiros.</p>
      </main>
    );
  }

  const ltvEstimate = data.active_subscribers > 0
    ? Math.round((data.arpu_cents / data.period_days) * 365)
    : 0;

  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1" /> CSV
        </Button>
      </div>

      {/* Period selector */}
      <div className="flex gap-1">
        {[7, 30, 90, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              days === d ? 'bg-accent text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {d === 365 ? '1 ano' : `${d} dias`}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Receita paga</span>
          </div>
          <p className="text-2xl font-bold">{formatBRL(data.total_paid_cents)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Falhadas</span>
          </div>
          <p className="text-2xl font-bold">{formatBRL(data.total_failed_cents)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">ARPU ({days}d)</span>
          </div>
          <p className="text-2xl font-bold">{formatBRL(data.arpu_cents)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            <span className="text-xs text-muted-foreground">LTV estimado</span>
          </div>
          <p className="text-2xl font-bold">{formatBRL(ltvEstimate)}</p>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold">Receita por método</h2>
          {Object.entries(data.by_method)
            .sort(([, a], [, b]) => b - a)
            .map(([method, amount]) => (
              <div key={method} className="flex justify-between text-sm">
                <span>{METHOD_LABELS[method] || method}</span>
                <span className="font-mono text-muted-foreground">{formatBRL(amount)}</span>
              </div>
            ))}
          {Object.keys(data.by_method).length === 0 && (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold">Receita por plano</h2>
          {Object.entries(data.by_plan)
            .sort(([, a], [, b]) => b - a)
            .map(([plan, amount]) => (
              <div key={plan} className="flex justify-between text-sm">
                <span className="capitalize">{plan}</span>
                <span className="font-mono text-muted-foreground">{formatBRL(amount)}</span>
              </div>
            ))}
          {Object.keys(data.by_plan).length === 0 && (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="overflow-x-auto">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-sm font-semibold">
            Transações recentes ({data.transaction_count} no período)
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Descrição</th>
              <th className="text-left p-3">Método</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_transactions.map((t, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(t.created_at as string).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-3 text-xs">{String(t.description || '—')}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {METHOD_LABELS[String(t.method)] || String(t.method || '—')}
                </td>
                <td className="p-3">
                  <span className={`text-xs font-medium ${STATUS_COLORS[String(t.status)] || ''}`}>
                    {String(t.status)}
                  </span>
                </td>
                <td className="p-3 text-right text-xs font-mono">
                  {formatBRL(Number(t.amount_cents) || 0)}
                </td>
              </tr>
            ))}
            {data.recent_transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhuma transação no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
