import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, billing_cycle, provider, current_period_start, current_period_end, cancel_at_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ subscription });
}
