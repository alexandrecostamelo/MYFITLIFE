'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
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
      <main className="p-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">Erro ao carregar dashboard.</p>
      </main>
    );
  }

  const revenueChange = data.revenue_last_month_cents > 0
    ? ((data.revenue_this_month_cents - data.revenue_last_month_cents) / data.revenue_last_month_cents) * 100
    : 0;

  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="MRR"
          value={formatBRL(data.mrr_cents)}
          iconColor="text-green-500"
        />
        <KpiCard
          icon={DollarSign}
          label="Receita este mês"
          value={formatBRL(data.revenue_this_month_cents)}
          subtitle={revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs mês anterior` : undefined}
          subtitleColor={revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}
          iconColor="text-emerald-500"
        />
        <KpiCard
          icon={Users}
          label="Total de usuários"
          value={data.total_users.toLocaleString('pt-BR')}
          iconColor="text-blue-500"
        />
        <KpiCard
          icon={Activity}
          label="Ativos (7 dias)"
          value={data.active_users_7d.toLocaleString('pt-BR')}
          subtitle={data.total_users > 0 ? `${((data.active_users_7d / data.total_users) * 100).toFixed(1)}% do total` : undefined}
          iconColor="text-violet-500"
        />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CreditCard}
          label="Assinaturas ativas"
          value={data.active_subscriptions.toLocaleString('pt-BR')}
          iconColor="text-accent"
        />
        <KpiCard
          icon={UserPlus}
          label="Novos este mês"
          value={data.new_users_this_month.toLocaleString('pt-BR')}
          subtitle={data.growth_pct !== 0 ? `${data.growth_pct > 0 ? '+' : ''}${data.growth_pct}% crescimento` : undefined}
          subtitleColor={data.growth_pct >= 0 ? 'text-green-500' : 'text-red-500'}
          iconColor="text-green-500"
        />
        <KpiCard
          icon={UserMinus}
          label="Cancelados (30d)"
          value={data.canceled_last_30d.toLocaleString('pt-BR')}
          iconColor="text-red-500"
        />
        <KpiCard
          icon={data.churn_rate_pct > 5 ? TrendingDown : TrendingUp}
          label="Taxa de Churn"
          value={`${data.churn_rate_pct}%`}
          iconColor={data.churn_rate_pct > 5 ? 'text-red-500' : 'text-green-500'}
        />
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold">Distribuição por plano</h2>
          {Object.entries(data.tier_counts).map(([tier, count]) => {
            const total = Object.values(data.tier_counts).reduce((a, b) => a + b, 0) || 1;
            const pct = (count / total) * 100;
            return (
              <div key={tier} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{tier}</span>
                  <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      tier === 'premium' ? 'bg-amber-500' : tier === 'pro' ? 'bg-accent' : 'bg-white/20'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold">Resumo rápido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita mês passado</span>
              <span>{formatBRL(data.revenue_last_month_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Novos mês passado</span>
              <span>{data.new_users_last_month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ARPU estimado</span>
              <span>{data.active_subscriptions > 0 ? formatBRL(Math.round(data.mrr_cents / data.active_subscriptions)) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LTV estimado (12mo)</span>
              <span>
                {data.active_subscriptions > 0
                  ? formatBRL(Math.round((data.mrr_cents / data.active_subscriptions) * 12))
                  : 'N/A'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  subtitleColor,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  iconColor?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${subtitleColor || 'text-muted-foreground'}`}>{subtitle}</p>
      )}
    </Card>
  );
}
