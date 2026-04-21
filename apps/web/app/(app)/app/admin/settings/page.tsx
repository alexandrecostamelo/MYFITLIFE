import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { PLANS } from '@/lib/billing/plans';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Configurações — Admin' };

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TIER_COLORS: Record<string, string> = {
  free: 'border-white/10',
  pro: 'border-accent/30',
  premium: 'border-amber-500/30',
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformAdmin(supabase, user.id))) redirect('/app');

  const plans = Object.entries(PLANS);

  // System stats
  const { count: totalExercises } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true });

  const { count: totalRecipes } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>

      {/* Plans */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(([key, plan]) => (
            <Card key={key} className={`p-5 space-y-3 border-2 ${TIER_COLORS[plan.tier] || ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold capitalize text-sm">{plan.tier}</h3>
                <span className="text-xs text-muted-foreground">
                  {plan.cycle === 'yearly' ? 'anual' : 'mensal'}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {plan.price_cents === 0 ? 'Grátis' : formatBRL(plan.price_cents)}
              </p>
              <ul className="space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">•</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="pt-2 space-y-1 text-[10px] text-muted-foreground border-t border-white/5">
                <p>Chave: <code className="font-mono bg-white/5 px-1 rounded">{key}</code></p>
                {plan.stripe_price_id && (
                  <p>Stripe: <code className="font-mono bg-white/5 px-1 rounded">{plan.stripe_price_id}</code></p>
                )}
                {plan.pagarme_plan_id && (
                  <p>PagarMe: <code className="font-mono bg-white/5 px-1 rounded">{plan.pagarme_plan_id}</code></p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* System info */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Exercícios</p>
            <p className="text-2xl font-bold">{totalExercises || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Receitas ativas</p>
            <p className="text-2xl font-bold">{totalRecipes || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Cron jobs</p>
            <p className="text-2xl font-bold">16</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Versão</p>
            <p className="text-2xl font-bold">1.0</p>
          </Card>
        </div>
      </section>

      {/* Env check */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Variáveis de ambiente</h2>
        <Card className="p-4 space-y-2">
          {[
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
          ].map(([name, ok]) => (
            <div key={name as string} className="flex items-center justify-between text-xs">
              <code className="font-mono">{name as string}</code>
              <span className={ok ? 'text-green-400' : 'text-red-400'}>
                {ok ? 'Configurada' : 'Ausente'}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </main>
  );
}
