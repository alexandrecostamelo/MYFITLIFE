'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-white/30">Carregando analytics...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">Erro ao carregar analytics.</p>
        </div>
      </main>
    );
  }

  const { daily, cohorts, ltv, top_features } = data;
  const maxSignups = Math.max(...(daily || []).map((d: any) => d.signups || 0), 1);
  const maxDAU = Math.max(...(daily || []).map((d: any) => d.active_users || 0), 1);
  const totalSignups = (daily || []).reduce((s: number, d: any) => s + (d.signups || 0), 0);
  const avgDAU = Math.round((daily || []).reduce((s: number, d: any) => s + (d.active_users || 0), 0) / Math.max((daily || []).length, 1));

  return (
    <main className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Growth Analytics</h1>
        <p className="text-sm text-white/35">Signups, reten��ão, LTV e uso de features</p>
      </div>

      {/* Signups Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-600">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white/70">Signups diários (30d)</h2>
          </div>
          <span className="rounded-xl bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
            {totalSignups} total
          </span>
        </div>
        <div className="flex items-end gap-[2px] h-36">
          {(daily || []).map((d: any, i: number) => (
            <div key={i} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-accent/60 to-accent transition-all group-hover:from-accent/80 group-hover:to-accent"
                style={{ height: `${Math.max((d.signups / maxSignups) * 100, d.signups > 0 ? 3 : 0)}%` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                {d.signups}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/20">
          <span>{daily?.[0]?.day ? new Date(daily[0].day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</span>
          <span>Hoje</span>
        </div>
      </div>

      {/* DAU Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white/70">DAU — Usuários ativos (30d)</h2>
          </div>
          <span className="rounded-xl bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
            Média {avgDAU}/dia
          </span>
        </div>
        <div className="flex items-end gap-[2px] h-36">
          {(daily || []).map((d: any, i: number) => (
            <div key={i} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-violet-500/60 to-violet-400 transition-all group-hover:from-violet-500/80 group-hover:to-violet-400"
                style={{ height: `${Math.max((d.active_users / maxDAU) * 100, d.active_users > 0 ? 3 : 0)}%` }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                {d.active_users}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-white/20">
          <span>{daily?.[0]?.day ? new Date(daily[0].day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</span>
          <span>Hoje</span>
        </div>
      </div>

      {/* Cohort Retention */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <BarChart3 className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">Retenção por coorte</h2>
        </div>
        {cohorts.length === 0 ? (
          <p className="text-sm text-white/25">Dados insuficientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Coorte</th>
                  <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">Tamanho</th>
                  <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">D1</th>
                  <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">D7</th>
                  <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">D30</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c: any) => (
                  <tr key={c.month} className="border-b border-white/[0.04]">
                    <td className="py-3 text-sm text-white/60">
                      {new Date(c.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3 text-center font-mono text-white/60">{c.size}</td>
                    <td className="py-3 text-center"><RetentionBadge value={c.d1_pct} /></td>
                    <td className="py-3 text-center"><RetentionBadge value={c.d7_pct} /></td>
                    <td className="py-3 text-center"><RetentionBadge value={c.d30_pct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LTV by Tier */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">LTV por plano</h2>
        </div>
        {ltv.length === 0 ? (
          <p className="text-sm text-white/25">Sem dados de assinaturas pagas</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ltv.map((l: any) => (
              <div key={l.tier} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${l.tier === 'premium' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-accent to-emerald-600'}`} />
                  <span className="text-sm font-semibold capitalize text-white/80">{l.tier}</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{formatBRL(l.avg_ltv_cents)}</p>
                <p className="text-xs text-white/30">LTV médio</p>
                <div className="mt-3 space-y-1 text-xs text-white/35">
                  <p>Lifetime médio: <span className="text-white/60">{l.avg_lifetime_days} dias</span></p>
                  <p>Total receita: <span className="text-white/60">{formatBRL(l.total_revenue_cents)}</span></p>
                  <p>Users pagantes: <span className="text-white/60">{l.total_users}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top AI Features */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">Top features IA (7d)</h2>
        </div>
        {top_features.length === 0 ? (
          <p className="text-sm text-white/25">Sem uso registrado</p>
        ) : (
          <div className="space-y-2">
            {top_features.map(([feature, count]: [string, number]) => {
              const maxCount = top_features[0]?.[1] || 1;
              const pct = (count / maxCount) * 100;
              return (
                <div key={feature} className="flex items-center gap-3">
                  <span className="w-28 truncate text-sm text-white/50">{feature}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-white/40">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Activity Table */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-semibold text-white/70">Atividade diária (últimos 14 dias)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-white/25">Dia</th>
                <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">Signups</th>
                <th className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-white/25">DAU</th>
              </tr>
            </thead>
            <tbody>
              {(daily || []).slice(-14).reverse().map((d: any) => (
                <tr key={d.day} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-2 text-white/50">
                    {new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                  </td>
                  <td className="py-2 text-center font-mono text-white/60">{d.signups}</td>
                  <td className="py-2 text-center font-mono text-violet-400">{d.active_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function RetentionBadge({ value }: { value: number }) {
  if (value == null || isNaN(value)) return <span className="text-white/20">—</span>;
  const bg = value >= 40 ? 'bg-emerald-500/10 text-emerald-400' : value >= 20 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400';
  return (
    <span className={`inline-flex rounded-lg px-2 py-0.5 font-mono text-xs font-medium ${bg}`}>
      {value}%
    </span>
  );
}
