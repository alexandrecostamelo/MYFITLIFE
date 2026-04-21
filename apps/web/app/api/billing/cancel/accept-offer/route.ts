import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { acceptOfferSchema } from '@/lib/billing/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = acceptOfferSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 });
  }
  const { attempt_id, offer_type } = parsed.data;

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: attempt } = await admin
    .from('cancellation_attempts')
    .select('*')
    .eq('id', attempt_id)
    .eq('user_id', user.id)
    .maybeSingle();

  const attemptRec = attempt as Record<string, unknown> | null;
  if (!attemptRec) return NextResponse.json({ error: 'attempt_not_found' }, { status: 404 });

  const subId = attemptRec.subscription_id as string;
  const { data: sub } = await admin.from('subscriptions').select('*').eq('id', subId).maybeSingle();
  const subRec = sub as Record<string, unknown> | null;
  if (!subRec) return NextResponse.json({ error: 'subscription_not_found' }, { status: 404 });

  const now = new Date();

  try {
    // Pause offers
    if (offer_type === 'pause_30d' || offer_type === 'pause_60d' || offer_type === 'pause_90d') {
      const days = offer_type === 'pause_90d' ? 90 : offer_type === 'pause_60d' ? 60 : 30;
      const pausedUntil = new Date(now.getTime() + days * 24 * 3600 * 1000);

      if (subRec.payment_method === 'stripe' && subRec.stripe_subscription_id) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        await stripe.subscriptions.update(subRec.stripe_subscription_id as string, {
          pause_collection: {
            behavior: 'void',
            resumes_at: Math.floor(pausedUntil.getTime() / 1000),
          },
        });
      }

      await admin
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_until: pausedUntil.toISOString(),
          updated_at: now.toISOString(),
        } as Record<string, unknown>)
        .eq('id', subId);

      await admin
        .from('cancellation_attempts')
        .update({
          offer_accepted: true,
          final_status: 'paused',
          completed_at: now.toISOString(),
          current_step: 3,
        } as Record<string, unknown>)
        .eq('id', attempt_id);

      return NextResponse.json({ ok: true, result: 'paused', until: pausedUntil.toISOString() });
    }

    // Discount offer
    if (offer_type === 'discount_50_2mo') {
      const until = new Date(now.getTime() + 60 * 24 * 3600 * 1000);

      if (subRec.payment_method === 'stripe' && subRec.stripe_subscription_id) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const coupon = await stripe.coupons.create({
          percent_off: 50,
          duration: 'repeating',
          duration_in_months: 2,
          name: 'Retenção 50%',
        });
        await stripe.subscriptions.update(subRec.stripe_subscription_id as string, {
          discounts: [{ coupon: coupon.id }],
        });
      }

      await admin
        .from('subscriptions')
        .update({
          retention_discount_pct: 50,
          retention_discount_until: until.toISOString(),
          updated_at: now.toISOString(),
        } as Record<string, unknown>)
        .eq('id', subId);

      await admin
        .from('cancellation_attempts')
        .update({
          offer_accepted: true,
          final_status: 'retained',
          completed_at: now.toISOString(),
          current_step: 3,
        } as Record<string, unknown>)
        .eq('id', attempt_id);

      return NextResponse.json({ ok: true, result: 'discount_applied', until: until.toISOString() });
    }

    // Downgrade offers → redirect to change-plan
    if (offer_type === 'downgrade_pro' || offer_type === 'downgrade_monthly') {
      const toTier = offer_type === 'downgrade_pro' ? 'pro' : String(subRec.plan || 'pro');
      const toCycle =
        offer_type === 'downgrade_monthly' ? 'monthly' : String(subRec.billing_cycle || 'monthly');

      await admin
        .from('cancellation_attempts')
        .update({
          offer_accepted: true,
          final_status: 'retained',
          completed_at: now.toISOString(),
          current_step: 3,
        } as Record<string, unknown>)
        .eq('id', attempt_id);

      return NextResponse.json({
        ok: true,
        result: 'redirect_to_change',
        redirect: `/app/billing/change-plan?to_tier=${toTier}&to_cycle=${toCycle}`,
      });
    }

    // Premium trial → redirect
    if (offer_type === 'premium_trial') {
      await admin
        .from('cancellation_attempts')
        .update({
          offer_accepted: true,
          final_status: 'retained',
          completed_at: now.toISOString(),
          current_step: 3,
        } as Record<string, unknown>)
        .eq('id', attempt_id);

      return NextResponse.json({
        ok: true,
        result: 'redirect_to_change',
        redirect: '/app/billing/change-plan?to_tier=premium&to_cycle=monthly',
      });
    }

    // Switch professional → redirect
    if (offer_type === 'switch_professional') {
      await admin
        .from('cancellation_attempts')
        .update({
          offer_accepted: true,
          final_status: 'retained',
          completed_at: now.toISOString(),
          current_step: 3,
        } as Record<string, unknown>)
        .eq('id', attempt_id);

      return NextResponse.json({ ok: true, result: 'redirect', redirect: '/app/premium/setup' });
    }

    return NextResponse.json({ error: 'invalid_offer' }, { status: 400 });
  } catch (err: any) {
    console.error('accept offer failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
