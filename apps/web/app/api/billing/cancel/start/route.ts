import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, plan, billing_cycle, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const subRec = sub as Record<string, unknown> | null;
  if (!subRec || subRec.status === 'canceled') {
    return NextResponse.json({ error: 'no_active_subscription' }, { status: 404 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: attempt } = await admin
    .from('cancellation_attempts')
    .insert({
      user_id: user.id,
      subscription_id: subRec.id,
      plan_tier_at_attempt: subRec.plan,
      plan_cycle_at_attempt: subRec.billing_cycle,
      current_step: 1,
      final_status: 'in_progress',
    } as Record<string, unknown>)
    .select('id')
    .single();

  return NextResponse.json({ attempt_id: (attempt as Record<string, unknown> | null)?.id });
}
