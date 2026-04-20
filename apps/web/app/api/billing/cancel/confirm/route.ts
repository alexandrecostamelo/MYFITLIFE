import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { cancelPagarMeSubscription } from '@/lib/pagarme';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { attempt_id } = await req.json();

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
    // Stripe: cancel at period end
    if (subRec.payment_method === 'stripe' && subRec.stripe_subscription_id) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.subscriptions.update(subRec.stripe_subscription_id as string, {
        cancel_at_period_end: true,
      });
    }

    // PagarMe: cancel subscription
    if (subRec.pagarme_subscription_id) {
      await cancelPagarMeSubscription(subRec.pagarme_subscription_id as string);
    }

    // Update subscription
    await admin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: now.toISOString(),
      } as Record<string, unknown>)
      .eq('id', subId);

    // Mark attempt as canceled
    await admin
      .from('cancellation_attempts')
      .update({
        final_status: 'canceled',
        current_step: 3,
        completed_at: now.toISOString(),
      } as Record<string, unknown>)
      .eq('id', attempt_id);

    return NextResponse.json({
      ok: true,
      cancel_at: subRec.current_period_end,
      message:
        'Sua assinatura foi cancelada. Acesso continua até o fim do período pago.',
    });
  } catch (err: any) {
    console.error('cancel confirm failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
