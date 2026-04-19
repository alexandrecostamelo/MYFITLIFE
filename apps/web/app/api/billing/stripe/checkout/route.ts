import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getPriceId, getOrCreateStripeCustomer } from '@/lib/stripe';
import { z } from 'zod';

const schema = z.object({
  cycle: z.enum(['monthly', 'yearly']),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const email = user.email!;
  const name = (profile as Record<string, unknown> | null)?.full_name as string || email;

  const customerId = await getOrCreateStripeCustomer(supabase, user.id, email, name);
  const priceId = getPriceId('pro', parsed.data.cycle);

  if (!priceId) return NextResponse.json({ error: 'price_not_configured' }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myfitlife.app';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/app/billing?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/app/checkout?cycle=${parsed.data.cycle}&cancelled=1`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      user_id: user.id,
      plan_key: 'pro',
      billing_cycle: parsed.data.cycle,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_key: 'pro',
        billing_cycle: parsed.data.cycle,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
