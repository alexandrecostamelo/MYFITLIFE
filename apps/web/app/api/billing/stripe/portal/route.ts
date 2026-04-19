import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  const s = sub as Record<string, unknown> | null;
  if (!s?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://myfitlife.app';

  const session = await stripe.billingPortal.sessions.create({
    customer: s.stripe_customer_id as string,
    return_url: `${baseUrl}/app/billing`,
  });

  return NextResponse.json({ url: session.url });
}
