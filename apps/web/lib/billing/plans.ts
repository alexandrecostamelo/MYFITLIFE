export interface Plan {
  tier: 'free' | 'pro' | 'premium';
  cycle: 'monthly' | 'yearly';
  price_cents: number;
  features: string[];
  stripe_price_id: string | null;
  pagarme_plan_id: string | null;
}

export const PLANS: Record<string, Plan> = {
  free: {
    tier: 'free',
    cycle: 'monthly',
    price_cents: 0,
    features: ['Treinos básicos', 'Registro manual de refeições', 'Coach 10 msgs/dia'],
    stripe_price_id: null,
    pagarme_plan_id: null,
  },
  pro_monthly: {
    tier: 'pro',
    cycle: 'monthly',
    price_cents: 2990,
    features: ['Tudo do Free', 'Autopilot diário', 'Coach ilimitado', 'Pose estimation', 'Reconhecimento por foto'],
    stripe_price_id: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    pagarme_plan_id: process.env.PAGARME_PLAN_PRO_MONTHLY || null,
  },
  pro_yearly: {
    tier: 'pro',
    cycle: 'yearly',
    price_cents: 24990,
    features: ['Tudo do Pro Mensal', '2 meses grátis'],
    stripe_price_id: process.env.STRIPE_PRICE_PRO_YEARLY || null,
    pagarme_plan_id: process.env.PAGARME_PLAN_PRO_YEARLY || null,
  },
  premium_monthly: {
    tier: 'premium',
    cycle: 'monthly',
    price_cents: 9990,
    features: ['Tudo do Pro', 'Consultoria humana inclusa', 'Revisão mensal de plano', 'Fila prioritária'],
    stripe_price_id: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || null,
    pagarme_plan_id: process.env.PAGARME_PLAN_PREMIUM_MONTHLY || null,
  },
  premium_yearly: {
    tier: 'premium',
    cycle: 'yearly',
    price_cents: 99990,
    features: ['Tudo do Premium Mensal', '2 meses grátis'],
    stripe_price_id: process.env.STRIPE_PRICE_PREMIUM_YEARLY || null,
    pagarme_plan_id: process.env.PAGARME_PLAN_PREMIUM_YEARLY || null,
  },
};

export function planKey(tier: string, cycle: string): string {
  if (tier === 'free') return 'free';
  return `${tier}_${cycle}`;
}

const TIER_ORDER: Record<string, number> = { free: 0, pro: 1, premium: 2 };

export function classifyChange(fromKey: string, toKey: string): 'upgrade' | 'downgrade' | 'cycle_change' {
  const from = PLANS[fromKey] || PLANS.free;
  const to = PLANS[toKey];
  if (!to) return 'downgrade';

  if (from.tier === to.tier) {
    return to.cycle === 'yearly' ? 'upgrade' : 'downgrade';
  }

  return (TIER_ORDER[to.tier] ?? 0) > (TIER_ORDER[from.tier] ?? 0) ? 'upgrade' : 'downgrade';
}

export function shouldApplyImmediate(type: 'upgrade' | 'downgrade' | 'cycle_change'): boolean {
  return type === 'upgrade';
}
