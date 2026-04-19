import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPagarMeCustomer, createPagarMePixOrder } from '@/lib/pagarme';
import { z } from 'zod';

const schema = z.object({
  cycle: z.enum(['monthly', 'yearly']),
  document: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos'),
});

const PRICE_MONTHLY = 2990;
const PRICE_YEARLY  = 24990;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const email = user.email!;
  const name = (profile as Record<string, unknown> | null)?.full_name as string || email;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('pagarme_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let pmCustomerId = (sub as Record<string, unknown> | null)?.pagarme_customer_id as string | null;

  if (!pmCustomerId) {
    try {
      const customer = await createPagarMeCustomer({ name, email, document: parsed.data.document });
      pmCustomerId = (customer as Record<string, unknown>).id as string;
      await supabase.from('subscriptions').update({ pagarme_customer_id: pmCustomerId }).eq('user_id', user.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: 'customer_creation_failed', message: msg }, { status: 500 });
    }
  }

  const amount = parsed.data.cycle === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
  const description = `MyFitLife Pro ${parsed.data.cycle === 'monthly' ? 'Mensal' : 'Anual'}`;

  let order: Record<string, unknown>;
  try {
    order = await createPagarMePixOrder({
      customerId: pmCustomerId,
      amountCents: amount,
      description,
      expiresInSeconds: 3600,
    }) as Record<string, unknown>;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'order_creation_failed', message: msg }, { status: 500 });
  }

  const charges = order.charges as Record<string, unknown>[] | undefined;
  const lastTxn = charges?.[0]?.last_transaction as Record<string, unknown> | undefined;
  const qrCode    = lastTxn?.qr_code as string | undefined;
  const qrCodeUrl = lastTxn?.qr_code_url as string | undefined;
  const expiresAt = lastTxn?.expires_at as string | undefined;

  await supabase.from('payment_transactions').insert({
    user_id: user.id,
    provider: 'pagarme',
    provider_transaction_id: order.id as string,
    amount_cents: amount,
    currency: 'BRL',
    status: 'pending',
    method: 'pix',
    description,
    plan_key: 'pro',
    billing_cycle: parsed.data.cycle,
    metadata: { qr_code: qrCode, expires_at: expiresAt },
  });

  return NextResponse.json({
    order_id: order.id,
    qr_code: qrCode,
    qr_code_url: qrCodeUrl,
    amount_cents: amount,
    expires_at: expiresAt,
  });
}
