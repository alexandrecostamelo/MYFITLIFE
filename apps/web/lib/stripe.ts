import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    _stripe = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    });
  }
  return _stripe;
}

// Convenience alias used across route files
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function getPriceId(_plan: 'pro', cycle: 'monthly' | 'yearly'): string {
  if (cycle === 'monthly') return process.env.STRIPE_PRICE_PRO_MONTHLY || '';
  return process.env.STRIPE_PRICE_PRO_YEARLY || '';
}

export async function getOrCreateStripeCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sub?.stripe_customer_id) return sub.stripe_customer_id as string;

  const customer = await getStripe().customers.create({
    email,
    name,
    metadata: { user_id: userId },
  });

  await supabase
    .from('subscriptions')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}
