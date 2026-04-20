import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { PLANS, planKey, classifyChange, shouldApplyImmediate } from '@/lib/billing/plans';
import { calculateProration } from '@/lib/billing/proration';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!sub) return NextResponse.json({ error: 'no_subscription', redirect: '/app/plans' }, { status: 404 });

  const subRec = sub as Record<string, unknown>;
  const fromTier = String(subRec.plan || 'free');
  const fromCycle = String(subRec.billing_cycle || 'monthly');
  const fromKey = planKey(fromTier, fromCycle);

  if (fromKey === targetKey) return NextResponse.json({ error: 'same_plan' }, { status: 400 });

  const changeType = classifyChange(fromKey, targetKey);
  const immediate = shouldApplyImmediate(changeType);

  let proration = { credit_cents: 0, charge_cents: PLANS[targetKey].price_cents, net_cents: PLANS[targetKey].price_cents };
  if (immediate && subRec.current_period_start && subRec.current_period_end && fromTier !== 'free') {
    const p = calculateProration({
      from_tier: fromTier,
      from_cycle: fromCycle,
      to_tier,
      to_cycle,
      current_period_start: new Date(subRec.current_period_start as string),
      current_period_end: new Date(subRec.current_period_end as string),
    });
    proration = { credit_cents: p.credit_cents, charge_cents: p.charge_cents, net_cents: p.net_cents };
  }

  const effectiveAt = immediate ? new Date() : new Date((subRec.current_period_end as string) || Date.now());
  const paymentMethod = String(subRec.payment_method || 'unknown');

  const { data: change } = await admin
    .from('plan_changes')
    .insert({
      user_id: user.id,
      subscription_id: subRec.id,
      from_tier: fromTier,
      to_tier,
      from_cycle: fromCycle,
      to_cycle,
      change_type: changeType,
      timing: immediate ? 'immediate' : 'end_of_period',
      status: 'pending',
      proration_credit_cents: proration.credit_cents,
      proration_charge_cents: proration.charge_cents,
      effective_at: effectiveAt.toISOString(),
      provider: paymentMethod,
    } as Record<string, unknown>)
    .select('id')
    .single();

  if (!change) return NextResponse.json({ error: 'create_change_failed' }, { status: 500 });

  // Scheduled downgrade: just mark pending
  if (!immediate) {
    await admin
      .from('subscriptions')
      .update({ pending_plan_change_id: change.id } as Record<string, unknown>)
      .eq('id', subRec.id as string);

    return NextResponse.json({
      ok: true,
      change_id: change.id,
      timing: 'end_of_period',
      message: `Mudança agendada para ${effectiveAt.toLocaleDateString('pt-BR')}`,
    });
  }

  // Immediate upgrade
  try {
    if (paymentMethod === 'stripe' && subRec.stripe_subscription_id) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const newPriceId = PLANS[targetKey].stripe_price_id;
      if (!newPriceId) throw new Error('stripe_price_not_configured');

      const stripeSub = await stripe.subscriptions.retrieve(subRec.stripe_subscription_id as string);
      await stripe.subscriptions.update(subRec.stripe_subscription_id as string, {
        items: [{ id: stripeSub.items.data[0].id, price: newPriceId }],
        proration_behavior: 'create_prorations',
        billing_cycle_anchor: 'now',
      });

      await admin.from('subscriptions').update({
        plan: to_tier,
        billing_cycle: to_cycle,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>).eq('id', subRec.id as string);

      await admin.from('profiles').update({
        subscription_tier: to_tier,
      } as Record<string, unknown>).eq('id', user.id);

      await admin.from('plan_changes').update({
        status: 'applied',
        applied_at: new Date().toISOString(),
      } as Record<string, unknown>).eq('id', change.id);

      return NextResponse.json({
        ok: true,
        change_id: change.id,
        timing: 'immediate',
        message: 'Plano atualizado. Proração aplicada na próxima fatura Stripe.',
      });
    }

    // PagarMe (credit_card / boleto): accumulate credit locally
    if (paymentMethod === 'credit_card' || paymentMethod === 'boleto') {
      const currentCredit = (subRec.credit_balance_cents as number) || 0;

      await admin.from('subscriptions').update({
        plan: to_tier,
        billing_cycle: to_cycle,
        credit_balance_cents: currentCredit + proration.credit_cents,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>).eq('id', subRec.id as string);

      await admin.from('profiles').update({
        subscription_tier: to_tier,
      } as Record<string, unknown>).eq('id', user.id);

      await admin.from('plan_changes').update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        provider_data: { note: 'credit applied to balance' },
      } as Record<string, unknown>).eq('id', change.id);

      const fmtCredit = (proration.credit_cents / 100).toFixed(2).replace('.', ',');
      return NextResponse.json({
        ok: true,
        change_id: change.id,
        timing: 'immediate',
        message: `Plano atualizado. Crédito de R$ ${fmtCredit} aplicado na próxima fatura.`,
      });
    }

    // Pix: upgrade plano, user paga diferencial via QR
    if (paymentMethod === 'pix') {
      await admin.from('subscriptions').update({
        plan: to_tier,
        billing_cycle: to_cycle,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>).eq('id', subRec.id as string);

      await admin.from('profiles').update({
        subscription_tier: to_tier,
      } as Record<string, unknown>).eq('id', user.id);

      await admin.from('plan_changes').update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        provider_data: { note: 'pix differential pending' },
      } as Record<string, unknown>).eq('id', change.id);

      const hasCharge = proration.net_cents > 0;
      const fmtNet = (proration.net_cents / 100).toFixed(2).replace('.', ',');

      return NextResponse.json({
        ok: true,
        change_id: change.id,
        timing: 'immediate',
        requires_payment: hasCharge,
        amount_cents: proration.net_cents,
        message: hasCharge
          ? `Plano atualizado. Gere Pix de R$ ${fmtNet} em /app/checkout para confirmar.`
          : 'Plano atualizado com crédito do período anterior.',
      });
    }

    // Fallback: just update the plan
    await admin.from('subscriptions').update({
      plan: to_tier,
      billing_cycle: to_cycle,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>).eq('id', subRec.id as string);

    await admin.from('profiles').update({
      subscription_tier: to_tier,
    } as Record<string, unknown>).eq('id', user.id);

    await admin.from('plan_changes').update({
      status: 'applied',
      applied_at: new Date().toISOString(),
    } as Record<string, unknown>).eq('id', change.id);

    return NextResponse.json({ ok: true, change_id: change.id, timing: 'immediate', message: 'Plano atualizado.' });
  } catch (err: any) {
    await admin.from('plan_changes').update({
      status: 'failed',
      provider_data: { error: err.message },
    } as Record<string, unknown>).eq('id', change.id);

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
