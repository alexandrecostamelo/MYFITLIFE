import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { PLANS } from '@/lib/billing/plans';
import { CheckCircle, XCircle, Sparkles, Server, Key } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurações — Admin' };

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TIER_GRADIENTS: Record<string, string> = {
  free: 'from-slate-500 to-zinc-600',
  pro: 'from-accent to-emerald-600',
  premium: 'from-amber-500 to-orange-600',
};

const TIER_RING: Record<string, string> = {
  free: 'border-white/[0.06]',
  pro: 'border-accent/20',
  premium: 'border-amber-500/20',
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformAdmin(supabase, user.id))) redirect('/app');

  const plans = Object.entries(PLANS);

  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  const { count: totalRecipes } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const envVars = [
    ['NEXT_PUBLIC_SUPABASE_URL', !!process.env.NEXT_PUBLIC_SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['ANTHROPIC_API_KEY', !!process.env.ANTHROPIC_API_KEY],
    ['STRIPE_SECRET_KEY', !!process.env.STRIPE_SECRET_KEY],
    ['PAGARME_API_KEY', !!process.env.PAGARME_API_KEY],
    ['RESEND_API_KEY', !!process.env.RESEND_API_KEY],
    ['CRON_SECRET', !!process.env.CRON_SECRET],
    ['FIREBASE_PROJECT_ID', !!process.env.FIREBASE_PROJECT_ID],
    ['TOKEN_ENCRYPTION_KEY', !!process.env.TOKEN_ENCRYPTION_KEY],
    ['DAILY_API_KEY', !!process.env.DAILY_API_KEY],
    ['ELEVENLABS_API_KEY', !!process.env.ELEVENLABS_API_KEY],
  ] as [string, boolean][];

  const configured = envVars.filter(([, ok]) => ok).length;

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>
        <p className="text-sm text-white/35">Planos, sistema e variáveis de ambiente</p>
      </div>

      {/* Plans */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">Planos</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(([key, plan]) => (
            <div
              key={key}
              className={`group relative overflow-hidden rounded-2xl border ${TIER_RING[plan.tier] || 'border-white/[0.06]'} bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]`}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-[0.05] blur-xl group-hover:opacity-10 transition-opacity" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${TIER_GRADIENTS[plan.tier] || 'from-gray-500 to-zinc-600'}`} />
                    <h3 className="text-sm font-bold capitalize text-white/80">{plan.tier}</h3>
                  </div>
                  <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/30">
                    {plan.cycle === 'yearly' ? 'anual' : 'mensal'}
                  </span>
                </div>

                <p className="text-3xl font-bold text-white">
                  {plan.price_cents === 0 ? 'Grátis' : formatBRL(plan.price_cents)}
                </p>

                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/40">
                      <span className="mt-0.5 text-accent">&#x2022;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-1 border-t border-white/[0.04] pt-3">
                  <p className="text-[10px] text-white/20">
                    Chave: <code className="rounded bg-white/[0.05] px-1 font-mono">{key}</code>
                  </p>
                  {plan.stripe_price_id && (
                    <p className="text-[10px] text-white/20">
                      Stripe: <code className="rounded bg-white/[0.05] px-1 font-mono">{plan.stripe_price_id}</code>
                    </p>
                  )}
                  {plan.pagarme_plan_id && (
                    <p className="text-[10px] text-white/20">
                      PagarMe: <code className="rounded bg-white/[0.05] px-1 font-mono">{plan.pagarme_plan_id}</code>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System info */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Server className="h-3.5 w-3.5 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-white/70">Sistema</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Exercícios', value: totalExercises || 0, gradient: 'from-rose-500 to-pink-600' },
            { label: 'Receitas ativas', value: totalRecipes || 0, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Cron jobs', value: 16, gradient: 'from-cyan-500 to-blue-600' },
            { label: 'Versão', value: '1.0', gradient: 'from-emerald-500 to-green-600' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[11px] text-white/30">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              <div className={`mt-2 h-1 w-8 rounded-full bg-gradient-to-r ${stat.gradient}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Env check */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Key className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white/70">Variáveis de ambiente</h2>
          </div>
          <span className="rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            {configured}/{envVars.length} configuradas
          </span>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
          {envVars.map(([name, ok]) => (
            <div key={name} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]">
              <code className="font-mono text-xs text-white/50">{name}</code>
              {ok ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">OK</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Ausente</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
