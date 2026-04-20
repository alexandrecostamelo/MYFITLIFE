import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
  const body = await req.text();
  const sig    = req.headers.get('x-hub-signature');
  const secret = process.env.PAGARME_WEBHOOK_SECRET;

  if (secret && sig) {
    const expected = 'sha1=' + crypto.createHmac('sha1', secret).update(body).digest('hex');
    if (sig !== expected) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  const event = JSON.parse(body) as Record<string, unknown>;
  const sb = admin();

  const eventId = (event.id as string | undefined) || `pagarme-${Date.now()}-${Math.random()}`;
  const eventType = (event.type as string | undefined) || 'unknown';

  const { error: dupErr } = await sb.from('webhook_events').insert({
    provider: 'pagarme',
    event_id: eventId,
    event_type: eventType,
    payload: event,
  });
  if (dupErr && dupErr.code === '23505') {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    // ── Pix one-shot orders ──
    if (eventType === 'order.paid' || eventType === 'charge.paid') {
      const data = event.data as Record<string, unknown>;
      const orderId = (data.id ?? data.order_id) as string;

      const { data: txn } = await sb
        .from('payment_transactions')
        .select('id, user_id, billing_cycle')
        .eq('provider', 'pagarme')
        .eq('provider_transaction_id', orderId)
        .maybeSingle();

      if (txn) {
        const t = txn as Record<string, unknown>;
        await sb.from('payment_transactions').update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        }).eq('id', t.id as string);

        const durationDays = t.billing_cycle === 'yearly' ? 365 : 30;
        await sb.rpc('extend_subscription_days', {
          p_user_id: t.user_id as string,
          p_days: durationDays,
        });
      }
    }

    if (eventType === 'order.payment_failed' || eventType === 'charge.payment_failed') {
      const data = event.data as Record<string, unknown>;
      const orderId = (data.id ?? data.order_id) as string;
      await sb.from('payment_transactions').update({
        status: 'failed',
        failed_at: new Date().toISOString(),
      }).eq('provider', 'pagarme').eq('provider_transaction_id', orderId);
    }

    // ── Recurring subscription events ──
    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const data = event.data as Record<string, unknown>;
      const subId = data.id as string;
      await sb
        .from('subscriptions')
        .update({
          status: mapPagarMeStatus(data.status as string),
          next_billing_at: (data.next_billing_at as string) || null,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('pagarme_subscription_id', subId);
    }

    if (eventType === 'subscription.canceled') {
      const data = event.data as Record<string, unknown>;
      const subId = data.id as string;
      const { data: localSub } = await sb
        .from('subscriptions')
        .select('user_id')
        .eq('pagarme_subscription_id', subId)
        .maybeSingle();

      await sb
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('pagarme_subscription_id', subId);

      if (localSub) {
        const userId = (localSub as Record<string, unknown>).user_id as string;
        await sb.from('profiles').update({
          subscription_status: 'canceled',
        } as Record<string, unknown>).eq('id', userId);
      }
    }

    if (eventType === 'invoice.created') {
      const inv = event.data as Record<string, unknown>;
      const pmSubId = inv.subscription_id as string;
      const boleto = inv.boleto as Record<string, unknown> | undefined;

      const { data: localSub } = await sb
        .from('subscriptions')
        .select('user_id, id')
        .eq('pagarme_subscription_id', pmSubId)
        .maybeSingle();

      if (localSub) {
        const ls = localSub as Record<string, unknown>;
        await sb.from('pagarme_invoices').upsert(
          {
            user_id: ls.user_id,
            subscription_id: ls.id,
            pagarme_invoice_id: inv.id,
            pagarme_subscription_id: pmSubId,
            amount_cents: inv.amount as number,
            status: inv.status as string,
            payment_method: inv.payment_method as string,
            due_at: (inv.due_at as string) || null,
            boleto_url: (boleto?.url as string) || null,
            boleto_barcode: (boleto?.barcode as string) || null,
          } as Record<string, unknown>,
          { onConflict: 'pagarme_invoice_id' },
        );

        await sb.from('subscriptions').update({
          last_invoice_id: inv.id as string,
          last_invoice_status: inv.status as string,
          last_invoice_url: (boleto?.url as string) || null,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>).eq('pagarme_subscription_id', pmSubId);
      }
    }

    if (eventType === 'invoice.paid') {
      const inv = event.data as Record<string, unknown>;
      const pmSubId = inv.subscription_id as string;

      const { data: localSub } = await sb
        .from('subscriptions')
        .select('user_id, id, plan')
        .eq('pagarme_subscription_id', pmSubId)
        .maybeSingle();

      if (localSub) {
        const ls = localSub as Record<string, unknown>;

        await sb.from('pagarme_invoices').upsert(
          {
            user_id: ls.user_id,
            subscription_id: ls.id,
            pagarme_invoice_id: inv.id,
            pagarme_subscription_id: pmSubId,
            amount_cents: inv.amount as number,
            status: 'paid',
            payment_method: inv.payment_method as string,
            paid_at: (inv.paid_at as string) || new Date().toISOString(),
            due_at: (inv.due_at as string) || null,
          } as Record<string, unknown>,
          { onConflict: 'pagarme_invoice_id' },
        );

        await sb.from('subscriptions').update({
          status: 'active',
          last_invoice_id: inv.id as string,
          last_invoice_status: 'paid',
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>).eq('pagarme_subscription_id', pmSubId);

        await sb.from('profiles').update({
          subscription_tier: ls.plan as string,
          subscription_status: 'active',
        } as Record<string, unknown>).eq('id', ls.user_id as string);
      }
    }

    if (eventType === 'invoice.payment_failed') {
      const inv = event.data as Record<string, unknown>;
      const pmSubId = inv.subscription_id as string;

      await sb.from('pagarme_invoices').upsert(
        {
          pagarme_invoice_id: inv.id,
          status: 'failed',
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        { onConflict: 'pagarme_invoice_id' },
      ).select().maybeSingle(); // upsert only if exists

      await sb.from('subscriptions').update({
        status: 'past_due',
        last_invoice_id: inv.id as string,
        last_invoice_status: 'failed',
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>).eq('pagarme_subscription_id', pmSubId);
    }

    await sb.from('webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'pagarme')
      .eq('event_id', eventId);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[pagarme webhook]', e);
    await sb.from('webhook_events')
      .update({ error: msg })
      .eq('provider', 'pagarme')
      .eq('event_id', eventId);
  }

  return NextResponse.json({ received: true });
}

function mapPagarMeStatus(pmStatus: string): string {
  const map: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    future: 'pending',
    ended: 'canceled',
    trial: 'trialing',
  };
  return map[pmStatus] || pmStatus;
}
