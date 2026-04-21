import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { pickOffer } from '@/lib/billing/retention-offers';
import { cancelReasonSchema } from '@/lib/billing/schemas';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = cancelReasonSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', details: parsed.error.flatten() }, { status: 400 });
  }
  const { attempt_id, reason, details } = parsed.data;

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

  const { data: assignments } = await supabase
    .from('premium_assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  const offers = pickOffer({
    reason,
    current_tier: String(attemptRec.plan_tier_at_attempt || 'pro'),
    current_cycle: String(attemptRec.plan_cycle_at_attempt || 'monthly'),
    has_premium_assignment: (assignments?.length || 0) > 0,
  });

  await admin
    .from('cancellation_attempts')
    .update({
      reason,
      reason_details: details || null,
      current_step: 2,
      offer_shown: offers[0]?.type || 'none',
    } as Record<string, unknown>)
    .eq('id', attempt_id);

  return NextResponse.json({ offers });
}
