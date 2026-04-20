import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { requestSubscriptionNfse } from '@/lib/nfse/subscription-issuer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: 'no_signature' }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'invalid_signature', message: msg }, { status: 400 });
  }

  const sb = admin();

  const { error: dupErr } = await sb.from('webhook_events').insert({
    provider: 'stripe',
    event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
  if (dupErr && dupErr.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subId = (session as any).subscription as string | undefined;
        if (userId && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sb, userId, sub, session.metadata?.billing_cycle as 'monthly' | 'yearly');
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await upsertSubscriptionFromStripe(sb, userId, sub, sub.metadata?.billing_cycle as 'monthly' | 'yearly');
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await sb.from('subscriptions').update({
          status: 'canceled',
          cancelled_at: new Date().toISOString(),
          cancel_at_period_end: true,
        }).eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const userId = invoice.parent?.subscription_details?.metadata?.user_id
          || invoice.metadata?.user_id;
        if (userId) {
          await sb.from('payment_transactions').insert({
            user_id: userId,
            provider: 'stripe',
            provider_transaction_id: invoice.id,
            amount_cents: invoice.amount_paid,
            currency: (invoice.currency as string).toUpperCase(),
            status: 'paid',
            method: 'card',
            description: invoice.description || 'MyFitLife Pro',
            plan_key: 'pro',
            paid_at: invoice.status_transitions?.paid_at
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
              : new Date().toISOString(),
            receipt_url: invoice.hosted_invoice_url,
          });

          // Trigger NFSe for subscription payment
          const stripeSubId = invoice.parent?.subscription_details?.subscription
            || invoice.subscription;
          if (stripeSubId && invoice.amount_paid > 0) {
            const { data: localSub } = await sb
              .from('subscriptions')
              .select('id')
              .eq('stripe_subscription_id', stripeSubId)
              .maybeSingle();

            if (localSub) {
              const desc = invoice.lines?.data?.[0]?.description || 'MyFitLife Pro';
              requestSubscriptionNfse({
                user_id: userId,
                subscription_id: localSub.id,
                amount_cents: invoice.amount_paid,
                source_type: 'stripe',
                source_id: invoice.id,
                description: desc,
              }).catch((err: any) => console.error('NFSe from Stripe failed:', err));
            }
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const userId = invoice.parent?.subscription_details?.metadata?.user_id;
        const subId = invoice.parent?.subscription_details?.subscription as string | undefined;
        if (userId) {
          if (subId) {
            await sb.from('subscriptions')
              .update({ status: 'past_due' })
              .eq('stripe_subscription_id', subId);
          }
          await sb.from('payment_transactions').insert({
            user_id: userId,
            provider: 'stripe',
            provider_transaction_id: invoice.id,
            amount_cents: invoice.amount_due,
            currency: (invoice.currency as string).toUpperCase(),
            status: 'failed',
            method: 'card',
            failed_at: new Date().toISOString(),
          });
        }
        break;
      }
    }

    await sb.from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'stripe')
      .eq('event_id', event.id);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.from('webhook_events')
      .update({ error: msg })
      .eq('provider', 'stripe')
      .eq('event_id', event.id);
    console.error('[stripe webhook]', e);
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscriptionFromStripe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  userId: string,
  sub: Stripe.Subscription,
  cycle: 'monthly' | 'yearly' | undefined
) {
  const status =
    sub.status === 'active'   ? 'active' :
    sub.status === 'trialing' ? 'trialing' :
    sub.status === 'past_due' ? 'past_due' :
    'canceled';

  // In Stripe dahlia API, current_period_* moved to subscription item level
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstItem = (sub.items?.data?.[0] as any);
  const periodStart = firstItem?.current_period_start;
  const periodEnd   = firstItem?.current_period_end;

  await sb.from('subscriptions').update({
    plan: 'pro',
    status,
    stripe_subscription_id: sub.id,
    billing_cycle: cycle ?? null,
    provider: 'stripe',
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end:   periodEnd   ? new Date(periodEnd * 1000).toISOString()   : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);
}
