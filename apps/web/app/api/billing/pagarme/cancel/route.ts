import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelPagarMeSubscription } from '@/lib/pagarme';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('pagarme_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const pagarmeSubId = (sub as Record<string, unknown> | null)
    ?.pagarme_subscription_id as string | null;

  if (!pagarmeSubId) {
    return NextResponse.json({ error: 'no_pagarme_subscription' }, { status: 404 });
  }

  try {
    await cancelPagarMeSubscription(pagarmeSubId);

    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('user_id', user.id);

    await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
      } as Record<string, unknown>)
      .eq('id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('pagarme cancel failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
