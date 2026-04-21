'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardData {
  mrr_cents: number;
  revenue_this_month_cents: number;
  revenue_last_month_cents: number;
  total_users: number;
  active_users_7d: number;
  new_users_this_month: number;
  new_users_last_month: number;
  active_subscriptions: number;
  canceled_last_30d: number;
  churn_rate_pct: number;
  growth_pct: number;
  tier_counts: Record<string, number>;
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TIER_GRADIENT: Record<string, string> = {
  free: 'from-slate-500 to-zinc-600',
  pro: 'from-accent to-emerald-600',
  premium: 'from-amber-500 to-orange-600',
};

const TIER_BG: Record<string, string> = {
  free: 'bg-white/[0.04]',
  pro: 'bg-accent/10',
  premium: 'bg-amber-500/10',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <Loader2 className="relative h-8 w-8 animate-spin text-accent" />
          </div>
          <p className="text-sm text-white/30">Carregando dados...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">Erro ao carregar dashboard.</p>
        </div>
      </main>
    );
  }

  const revenueChange = data.revenue_last_month_cents > 0
    ? ((data.revenue_this_month_cents - data.revenue_last_month_cents) / data.revenue_last_month_cents) * 100
    : 0;

  const totalTier = Object.values(data.tier_counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <main className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-white/35">Visão geral da plataforma</p>
      </div>

      {/* Hero KPIs — MRR + Revenue */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-emerald-500/10 to-teal-600/5 p-6 ring-1 ring-accent/20">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl transition-all group-hover:bg-accent/15" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-emerald-600 shadow-lg shadow-accent/25">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white/50">MRR</span>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">
              {formatBRL(data.mrr_cents)}
            </p>
            <p className="mt-1 text-xs text-accent/70">Receita mensal recorrente</p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/15 via-emerald-500/8 to-transparent p-6 ring-1 ring-green-500/15">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/10 blur-2xl transition-all group-hover:bg-green-500/15" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white/50">Receita este mês</span>
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white">
              {formatBRL(data.revenue_this_month_cents)}
            </p>
            {revenueChange !== 0 && (
              <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${revenueChange > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {revenueChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs mês anterior
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={Users}
          label="Total usuários"
          value={data.total_users.toLocaleString('pt-BR')}
          gradient="from-blue-500 to-indigo-600"
          glow="bg-blue-500/10"
        />
        <MetricCard
          icon={Activity}
          label="Ativos (7d)"
          value={data.active_users_7d.toLocaleString('pt-BR')}
          subtitle={data.total_users > 0 ? `${((data.active_users_7d / data.total_users) * 100).toFixed(0)}%` : undefined}
          gradient="from-violet-500 to-purple-600"
          glow="bg-violet-500/10"
        />
        <MetricCard
          icon={CreditCard}
          label="Assinaturas"
          value={data.active_subscriptions.toLocaleString('pt-BR')}
          gradient="from-cyan-500 to-blue-600"
          glow="bg-cyan-500/10"
        />
        <MetricCard
          icon={UserPlus}
          label="Novos (mês)"
          value={data.new_users_this_month.toLocaleString('pt-BR')}
          subtitle={data.growth_pct !== 0 ? `${data.growth_pct > 0 ? '+' : ''}${data.growth_pct}%` : undefined}
          subtitlePositive={data.growth_pct >= 0}
          gradient="from-emerald-500 to-green-600"
          glow="bg-emerald-500/10"
        />
        <MetricCard
          icon={UserMinus}
          label="Cancelados (30d)"
          value={data.canceled_last_30d.toLocaleString('pt-BR')}
          gradient="from-red-500 to-rose-600"
          glow="bg-red-500/10"
        />
        <MetricCard
          icon={data.churn_rate_pct > 5 ? TrendingDown : TrendingUp}
          label="Churn"
          value={`${data.churn_rate_pct}%`}
          gradient={data.churn_rate_pct > 5 ? 'from-red-500 to-orange-600' : 'from-green-500 to-teal-600'}
          glow={data.churn_rate_pct > 5 ? 'bg-red-500/10' : 'bg-green-500/10'}
        />
      </div>

      {/* Bottom Row: Tier Breakdown + Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tier Breakdown */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Distribuição por plano</h2>

          {/* Tier bar */}
          <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-white/[0.04]">
            {Object.entries(data.tier_counts).map(([tier, count]) => {
              const pct = (count / totalTier) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={tier}
                  className={`h-full bg-gradient-to-r ${TIER_GRADIENT[tier] || 'from-gray-500 to-gray-600'} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>

          {/* Tier items */}
          <div className="space-y-3">
            {Object.entries(data.tier_counts).map(([tier, count]) => {
              const pct = (count / totalTier) * 100;
              return (
                <div key={tier} className={`flex items-center justify-between rounded-xl ${TIER_BG[tier] || ''} px-4 py-3`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier] || 'from-gray-500 to-gray-600'}`} />
                    <span className="text-sm font-medium capitalize text-white/80">{tier}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">{count}</span>
                    <span className="min-w-[3rem] text-right text-xs text-white/35">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white/70">Resumo rápido</h2>
          <div className="space-y-1">
            <SummaryRow
              label="Receita mês passado"
              value={formatBRL(data.revenue_last_month_cents)}
            />
            <SummaryRow
              label="Novos mês passado"
              value={String(data.new_users_last_month)}
            />
            <SummaryRow
              label="ARPU estimado"
              value={data.active_subscriptions > 0 ? formatBRL(Math.round(data.mrr_cents / data.active_subscriptions)) : 'N/A'}
              highlight
            />
            <SummaryRow
              label="LTV estimado (12m)"
              value={data.active_subscriptions > 0 ? formatBRL(Math.round((data.mrr_cents / data.active_subscriptions) * 12)) : 'N/A'}
              highlight
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  subtitlePositive,
  gradient,
  glow,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  subtitlePositive?: boolean;
  gradient: string;
  glow: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${glow} blur-xl transition-all group-hover:scale-150`} />
      <div className="relative">
        <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="mt-0.5 text-[11px] text-white/35">{label}</p>
        {subtitle && (
          <p className={`mt-1 text-[11px] font-medium ${subtitlePositive === false ? 'text-red-400' : subtitlePositive ? 'text-green-400' : 'text-white/50'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-accent' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}
