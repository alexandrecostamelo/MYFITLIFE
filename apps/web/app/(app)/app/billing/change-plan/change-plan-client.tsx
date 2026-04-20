'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface PlanOption {
  key: string;
  tier: string;
  cycle: string;
  label: string;
  price: string;
  priceCents: number;
  features: string[];
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    key: 'pro_monthly',
    tier: 'pro',
    cycle: 'monthly',
    label: 'Pro Mensal',
    price: 'R$ 29,90/mês',
    priceCents: 2990,
    features: ['Autopilot diário', 'Coach ilimitado', 'Pose estimation', 'Reconhecimento por foto'],
  },
  {
    key: 'pro_yearly',
    tier: 'pro',
    cycle: 'yearly',
    label: 'Pro Anual',
    price: 'R$ 249,90/ano',
    priceCents: 24990,
    features: ['Tudo do Pro Mensal', '2 meses grátis'],
  },
  {
    key: 'premium_monthly',
    tier: 'premium',
    cycle: 'monthly',
    label: 'Premium Mensal',
    price: 'R$ 99,90/mês',
    priceCents: 9990,
    features: ['Tudo do Pro', 'Consultoria humana', 'Revisão mensal', 'Fila prioritária'],
  },
  {
    key: 'premium_yearly',
    tier: 'premium',
    cycle: 'yearly',
    label: 'Premium Anual',
    price: 'R$ 999,90/ano',
    priceCents: 99990,
    features: ['Tudo do Premium Mensal', '2 meses grátis'],
  },
];

interface Preview {
  from: { tier: string; cycle: string; key: string };
  to: { tier: string; cycle: string; key: string };
  change_type: string;
  timing: string;
  effective_at: string | null;
  proration: {
    credit_cents: number;
    charge_cents: number;
    net_cents: number;
    days_remaining: number;
    days_in_period: number;
    description: string;
  };
  payment_method: string | null;
}

const CHANGE_ICON: Record<string, typeof ArrowUpCircle> = {
  upgrade: ArrowUpCircle,
  downgrade: ArrowDownCircle,
  cycle_change: RefreshCw,
};

const CHANGE_LABEL: Record<string, string> = {
  upgrade: 'Upgrade',
  downgrade: 'Downgrade',
  cycle_change: 'Mudança de ciclo',
};

export default function ChangePlanClient() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlanOption | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/subscription')
      .then((r) => r.json())
      .then((d) => {
        const sub = d.subscription;
        if (sub) {
          const tier = sub.plan || 'free';
          const cycle = sub.billing_cycle || 'monthly';
          setCurrentPlan(tier === 'free' ? 'free' : `${tier}_${cycle}`);
        } else {
          setCurrentPlan('free');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function loadPreview(plan: PlanOption) {
    setSelected(plan);
    setPreview(null);
    setError('');
    setSuccess('');
    setPreviewLoading(true);

    const res = await fetch('/api/billing/change-plan/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_tier: plan.tier, to_cycle: plan.cycle }),
    });

    const data = await res.json();
    setPreviewLoading(false);

    if (!res.ok) {
      setError(data.error === 'same_plan' ? 'Você já está neste plano.' : data.error || 'Erro ao carregar preview.');
      return;
    }

    setPreview(data);
  }

  async function executeChange() {
    if (!selected || !preview) return;
    setExecuting(true);
    setError('');

    const res = await fetch('/api/billing/change-plan/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_tier: selected.tier, to_cycle: selected.cycle }),
    });

    const data = await res.json();
    setExecuting(false);

    if (!res.ok) {
      setError(data.error || 'Erro ao executar mudança.');
      return;
    }

    setSuccess(data.message || 'Plano atualizado com sucesso!');
    setTimeout(() => router.push('/app/billing?success=1'), 2000);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/billing" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Mudar plano</h1>
      </header>

      {currentPlan && (
        <p className="mb-4 text-sm text-muted-foreground">
          Plano atual:{' '}
          <span className="font-medium text-foreground">
            {currentPlan === 'free'
              ? 'Gratuito'
              : PLAN_OPTIONS.find((p) => p.key === currentPlan)?.label || currentPlan}
          </span>
        </p>
      )}

      {success && (
        <Card className="mb-4 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
        </Card>
      )}

      {error && (
        <Card className="mb-4 border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <div className="grid gap-3">
        {PLAN_OPTIONS.filter((p) => p.key !== currentPlan).map((plan) => (
          <Card
            key={plan.key}
            className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
              selected?.key === plan.key ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => loadPreview(plan)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{plan.label}</p>
                <p className="text-sm text-muted-foreground">{plan.price}</p>
              </div>
              {selected?.key === plan.key && <Check className="h-5 w-5 text-primary" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {plan.features.map((f) => (
                <span key={f} className="rounded bg-muted px-2 py-0.5 text-xs">
                  {f}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {previewLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calculando proração...
        </div>
      )}

      {preview && !previewLoading && (
        <Card className="mt-4 p-4 space-y-3">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = CHANGE_ICON[preview.change_type] || RefreshCw;
              return <Icon className="h-5 w-5" />;
            })()}
            <h3 className="font-semibold">{CHANGE_LABEL[preview.change_type] || preview.change_type}</h3>
          </div>

          <p className="text-sm">{preview.proration.description}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Crédito</p>
              <p className="font-medium">R$ {(preview.proration.credit_cents / 100).toFixed(2).replace('.', ',')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Novo plano</p>
              <p className="font-medium">R$ {(preview.proration.charge_cents / 100).toFixed(2).replace('.', ',')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor líquido</p>
              <p className="font-bold text-lg">R$ {(preview.proration.net_cents / 100).toFixed(2).replace('.', ',')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Aplicação</p>
              <p className="font-medium">{preview.timing === 'immediate' ? 'Imediata' : 'Fim do período'}</p>
            </div>
          </div>

          {preview.timing === 'end_of_period' && preview.effective_at && (
            <p className="text-xs text-muted-foreground">
              Mudança será aplicada em {new Date(preview.effective_at).toLocaleDateString('pt-BR')}
            </p>
          )}

          <Button onClick={executeChange} disabled={executing} className="w-full">
            {executing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : preview.timing === 'immediate' ? (
              'Confirmar upgrade'
            ) : (
              'Agendar mudança'
            )}
          </Button>
        </Card>
      )}
    </main>
  );
}
