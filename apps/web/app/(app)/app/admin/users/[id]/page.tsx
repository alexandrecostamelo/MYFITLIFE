'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Ban,
  Shield,
  Gift,
  RefreshCw,
  Crown,
  Dumbbell,
  UtensilsCrossed,
  MessageSquare,
  CreditCard,
  Loader2,
  UserX,
  Zap,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
];

function getGradient(id: string) {
  return AVATAR_GRADIENTS[id.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
}

const TIER_STYLES: Record<string, string> = {
  free: 'bg-white/[0.06] text-white/50',
  pro: 'bg-accent/10 text-accent',
  premium: 'bg-amber-500/10 text-amber-400',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  trialing: 'bg-blue-500/10 text-blue-400',
  canceled: 'bg-red-500/10 text-red-400',
  paused: 'bg-amber-500/10 text-amber-400',
  past_due: 'bg-orange-500/10 text-orange-400',
};

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  const doAction = async (action: string, value?: string) => {
    if (!userId) return;
    if (action === 'suspend' && !confirm('Suspender este usuário?')) return;
    setActing(true);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, value }),
    });
    const res = await fetch(`/api/admin/users/${userId}`);
    setData(await res.json());
    setActing(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </main>
    );
  }

  if (!data?.profile) {
    return (
      <main className="p-8 text-center">
        <p className="text-white/30">Usuário não encontrado</p>
      </main>
    );
  }

  const { profile: p, subscription: sub, stats, recent_payments } = data;
  const tier = p.subscription_tier || 'free';

  return (
    <main className="space-y-6 p-6 lg:p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/app/admin/users"
        className="inline-flex items-center gap-1.5 text-xs text-white/35 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar a usuários
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradient(p.id)} text-xl font-bold text-white shadow-lg`}>
          {p.avatar_url
            ? <img src={String(p.avatar_url)} className="h-16 w-16 rounded-2xl object-cover" alt="" />
            : getInitials(p.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white">{p.full_name || 'Sem nome'}</h1>
          <p className="text-sm text-white/35">{p.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[tier]}`}>
              {tier}
            </span>
            {p.is_suspended && (
              <span className="rounded-lg bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">Suspenso</span>
            )}
            {p.blocked && (
              <span className="rounded-lg bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">Bloqueado</span>
            )}
            {p.role === 'platform_admin' && (
              <span className="rounded-lg bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Admin</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Dumbbell} label="Treinos" value={stats.total_workouts} gradient="from-rose-500 to-pink-600" />
        <StatCard icon={UtensilsCrossed} label="Refeições" value={stats.total_meals} gradient="from-amber-500 to-orange-600" />
        <StatCard icon={MessageSquare} label="Msgs IA" value={stats.total_ai_calls} gradient="from-violet-500 to-purple-600" />
        <StatCard icon={Zap} label="Streak" value={p.streak_current || 0} gradient="from-emerald-500 to-green-600" />
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Assinatura</h2>
        {sub ? (
          <div className="space-y-2">
            <Row label="Plano" value={<span className="capitalize font-medium">{sub.tier}</span>} />
            <Row label="Status" value={
              <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[sub.status] || 'bg-white/[0.06] text-white/50'}`}>
                {sub.status}
              </span>
            } />
            <Row label="Ciclo" value={sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'} />
            <Row label="Gateway" value={sub.payment_gateway || '—'} />
            <Row label="Início" value={sub.created_at ? new Date(sub.created_at).toLocaleDateString('pt-BR') : '—'} />
            {sub.trial_end && <Row label="Trial até" value={new Date(sub.trial_end).toLocaleDateString('pt-BR')} />}
            {sub.next_billing_at && <Row label="Próx. cobrança" value={new Date(sub.next_billing_at).toLocaleDateString('pt-BR')} />}
          </div>
        ) : (
          <p className="text-sm text-white/25">Sem assinatura ativa</p>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Ações</h2>
        <div className="flex flex-wrap gap-2">
          {p.is_suspended ? (
            <ActionBtn icon={RefreshCw} label="Reativar" onClick={() => doAction('unsuspend')} disabled={acting} />
          ) : (
            <ActionBtn icon={Ban} label="Suspender" onClick={() => doAction('suspend')} disabled={acting} destructive />
          )}
          {p.blocked ? (
            <ActionBtn icon={RefreshCw} label="Desbloquear" onClick={() => doAction('unblock')} disabled={acting} />
          ) : (
            <ActionBtn icon={UserX} label="Bloquear" onClick={() => doAction('block')} disabled={acting} destructive />
          )}
          <ActionBtn icon={Gift} label="+7d trial" onClick={() => doAction('extend_trial', '7')} disabled={acting} />
          <ActionBtn icon={Crown} label="Dar Pro" onClick={() => doAction('change_tier', 'pro')} disabled={acting} />
          <ActionBtn icon={Crown} label="Dar Premium" onClick={() => doAction('change_tier', 'premium')} disabled={acting} />
          <ActionBtn icon={CreditCard} label="Resetar Free" onClick={() => doAction('change_tier', 'free')} disabled={acting} />
          {p.role !== 'platform_admin' && (
            <ActionBtn icon={Shield} label="Tornar Admin" onClick={() => doAction('set_role', 'platform_admin')} disabled={acting} />
          )}
        </div>
      </div>

      {/* Recent payments */}
      {recent_payments.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/70">Últimos pagamentos</h2>
          <div className="space-y-1">
            {recent_payments.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/[0.02]">
                <span className="text-xs text-white/35">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="text-xs text-white/25">{t.gateway || '—'}</span>
                <span className={`font-mono text-sm ${t.status === 'paid' ? 'text-emerald-400' : t.status === 'refunded' ? 'text-red-400' : 'text-white/40'}`}>
                  {formatBRL(Number(t.amount || t.amount_cents ? (t.amount_cents / 100) : 0))}
                </span>
                <span className={`text-xs ${t.status === 'paid' ? 'text-emerald-400' : t.status === 'failed' ? 'text-red-400' : 'text-white/35'}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="space-y-1 text-xs text-white/20">
        <p>ID: <span className="font-mono">{p.id}</span></p>
        <p>Cadastro: {p.created_at ? new Date(p.created_at).toLocaleString('pt-BR') : '—'}</p>
        <p>Último acesso: {p.last_seen_at ? new Date(p.last_seen_at).toLocaleString('pt-BR') : 'nunca'}</p>
        {p.cached_readiness_score != null && <p>Readiness: {p.cached_readiness_score}/100</p>}
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: React.ElementType; label: string; value: number; gradient: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center transition-all hover:border-white/[0.1]">
      <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/30">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/[0.02]">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled, destructive }: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all disabled:opacity-40 ${
        destructive
          ? 'border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10'
          : 'border border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
