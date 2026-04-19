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
