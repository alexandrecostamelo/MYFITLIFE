import { PLANS, planKey } from './plans';

export interface ProrationResult {
  credit_cents: number;
  charge_cents: number;
  net_cents: number;
  days_remaining: number;
  days_in_period: number;
  description: string;
}

export function calculateProration(params: {
  from_tier: string;
  from_cycle: string;
  to_tier: string;
  to_cycle: string;
  current_period_start: Date;
  current_period_end: Date;
  now?: Date;
}): ProrationResult {
  const now = params.now || new Date();
  const periodMs = params.current_period_end.getTime() - params.current_period_start.getTime();
  const remainingMs = Math.max(0, params.current_period_end.getTime() - now.getTime());
  const daysRemaining = Math.ceil(remainingMs / (24 * 3600 * 1000));
  const daysInPeriod = Math.ceil(periodMs / (24 * 3600 * 1000));
  const pctRemaining = periodMs > 0 ? remainingMs / periodMs : 0;

  const fromKey = planKey(params.from_tier, params.from_cycle);
  const toKey = planKey(params.to_tier, params.to_cycle);

  const fromPrice = PLANS[fromKey]?.price_cents || 0;
  const toPrice = PLANS[toKey]?.price_cents || 0;

  const creditFromUnused = Math.round(fromPrice * pctRemaining);
  const net = toPrice - creditFromUnused;

  const fmtBrl = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;

  return {
    credit_cents: creditFromUnused,
    charge_cents: toPrice,
    net_cents: Math.max(0, net),
    days_remaining: daysRemaining,
    days_in_period: daysInPeriod,
    description: `Crédito ${fmtBrl(creditFromUnused)} de ${daysRemaining} dias restantes. Novo plano ${fmtBrl(toPrice)}. Você paga ${fmtBrl(Math.max(0, net))} agora.`,
  };
}
