import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateProration } from '@/lib/billing/proration';
import { PLANS, planKey, classifyChange, shouldApplyImmediate } from '@/lib/billing/plans';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { to_tier, to_cycle } = await req.json();
  if (!to_tier || !to_cycle) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const targetKey = planKey(to_tier, to_cycle);
  if (!PLANS[targetKey]) return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, billing_cycle, current_period_start, current_period_end, payment_method, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const subRec = sub as Record<string, unknown> | null;
  const fromTier = String(subRec?.plan || 'free');
  const fromCycle = String(subRec?.billing_cycle || 'monthly');
  const fromKey = planKey(fromTier, fromCycle);

  if (fromKey === targetKey) {
    return NextResponse.json({ error: 'same_plan' }, { status: 400 });
  }

  const changeType = classifyChange(fromKey, targetKey);
  const immediate = shouldApplyImmediate(changeType);

  let proration = {
    credit_cents: 0,
    charge_cents: PLANS[targetKey].price_cents,
    net_cents: PLANS[targetKey].price_cents,
    days_remaining: 0,
    days_in_period: 0,
    description: `Novo plano R$ ${(PLANS[targetKey].price_cents / 100).toFixed(2).replace('.', ',')}.`,
  };

  if (immediate && subRec?.current_period_start && subRec?.current_period_end && fromTier !== 'free') {
    proration = calculateProration({
      from_tier: fromTier,
      from_cycle: fromCycle,
      to_tier,
      to_cycle,
      current_period_start: new Date(subRec.current_period_start as string),
      current_period_end: new Date(subRec.current_period_end as string),
    });
  }

  return NextResponse.json({
    from: { tier: fromTier, cycle: fromCycle, key: fromKey },
    to: { tier: to_tier, cycle: to_cycle, key: targetKey },
    change_type: changeType,
    timing: immediate ? 'immediate' : 'end_of_period',
    effective_at: immediate ? new Date().toISOString() : (subRec?.current_period_end as string) || null,
    proration,
    payment_method: (subRec?.payment_method as string) || null,
  });
}
