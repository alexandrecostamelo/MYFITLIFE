import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import {
  createPagarMeCustomer,
  createPagarMeCard,
  createCreditCardSubscription,
  createBoletoSubscription,
} from '@/lib/pagarme';
import { pagarmeSubscribeSchema } from '@/lib/billing/schemas';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PLAN_IDS: Record<string, string | undefined> = {
  pro_monthly: process.env.PAGARME_PLAN_PRO_MONTHLY,
  pro_yearly: process.env.PAGARME_PLAN_PRO_YEARLY,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = pagarmeSubscribeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 });
  }
  const { plan, method, card_token, customer, billing_address } = parsed.data;

  const planId = PLAN_IDS[plan];
  if (!planId) return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });

  if (method === 'credit_card' && !card_token) {
    return NextResponse.json({ error: 'missing_card_token' }, { status: 400 });
  }
  if (!customer?.name || !customer?.document) {
    return NextResponse.json({ error: 'missing_customer_fields' }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  try {
    // Reuse existing PagarMe customer if available
    const { data: existingSub } = await admin
      .from('subscriptions')
      .select('pagarme_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = (existingSub as Record<string, unknown> | null)
      ?.pagarme_customer_id as string | null;

    if (!customerId) {
      const pmCustomer = await createPagarMeCustomer({
        name: customer.name,
        email: user.email!,
        document: customer.document.replace(/\D/g, ''),
      });
      customerId = (pmCustomer as Record<string, unknown>).id as string;
    }

    let subscription: Record<string, unknown>;
    let cardInfo: { brand: string; last4: string } | null = null;

    if (method === 'credit_card') {
      const card = (await createPagarMeCard(
        customerId!,
        card_token!,
        billing_address,
      )) as Record<string, unknown>;
      cardInfo = {
        brand: String(card.brand || ''),
        last4: String(card.last_four_digits || ''),
      };
      subscription = (await createCreditCardSubscription({
        plan_id: planId,
        customer_id: customerId!,
        card_id: card.id as string,
      })) as Record<string, unknown>;
    } else {
      subscription = (await createBoletoSubscription({
        plan_id: planId,
        customer_id: customerId!,
      })) as Record<string, unknown>;
    }

    const billingCycle = plan === 'pro_yearly' ? 'yearly' : 'monthly';

    await admin.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan: 'pro',
        status: subscription.status === 'active' ? 'active' : 'pending',
        provider: 'pagarme',
        billing_cycle: billingCycle,
        payment_method: method,
        pagarme_subscription_id: subscription.id,
        pagarme_customer_id: customerId,
        next_billing_at: subscription.next_billing_at || null,
        card_brand: cardInfo?.brand || null,
        card_last4: cardInfo?.last4 || null,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>,
      { onConflict: 'user_id' },
    );

    // Activate profile if subscription is immediately active (credit card)
    if (subscription.status === 'active') {
      await admin
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          subscription_status: 'active',
        } as Record<string, unknown>)
        .eq('id', user.id);
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      status: subscription.status,
      next_billing_at: subscription.next_billing_at,
    });
  } catch (err: any) {
    console.error('pagarme subscribe failed:', err);
    return NextResponse.json(
      { error: err.message || 'subscription_failed', details: err.details },
      { status: err.status || 500 },
    );
  }
}
