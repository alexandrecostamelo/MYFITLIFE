import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const now = new Date().toISOString();

  const { data: paused } = await admin
    .from('subscriptions')
    .select('id, stripe_subscription_id, payment_method, paused_until')
    .eq('status', 'paused')
    .lte('paused_until', now);

  let unpaused = 0;

  for (const row of (paused || []) as Record<string, unknown>[]) {
    try {
      if (row.payment_method === 'stripe' && row.stripe_subscription_id) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        await stripe.subscriptions.update(row.stripe_subscription_id as string, {
          pause_collection: '',
        });
      }

      await admin
        .from('subscriptions')
        .update({
          status: 'active',
          paused_until: null,
          updated_at: now,
        } as Record<string, unknown>)
        .eq('id', row.id as string);

      unpaused++;
    } catch (err) {
      console.error('unpause failed for', row.id, err);
    }
  }

  return NextResponse.json({ unpaused });
}
