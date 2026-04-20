import { NextRequest, NextResponse } from 'next/server';
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

  const { data: pending } = await admin
    .from('plan_changes')
    .select('id, user_id, subscription_id, to_tier, to_cycle')
    .eq('status', 'pending')
    .eq('timing', 'end_of_period')
    .lte('effective_at', now)
    .limit(100);

  let applied = 0;
  let errors = 0;

  for (const change of pending || []) {
    try {
      await admin
        .from('subscriptions')
        .update({
          plan: change.to_tier,
          billing_cycle: change.to_cycle,
          pending_plan_change_id: null,
          updated_at: now,
        } as Record<string, unknown>)
        .eq('id', change.subscription_id);

      await admin
        .from('profiles')
        .update({ subscription_tier: change.to_tier } as Record<string, unknown>)
        .eq('id', change.user_id);

      await admin
        .from('plan_changes')
        .update({ status: 'applied', applied_at: now } as Record<string, unknown>)
        .eq('id', change.id);

      applied++;
    } catch (err) {
      console.error('apply scheduled change failed:', err);
      errors++;
    }
  }

  return NextResponse.json({ applied, errors });
}
