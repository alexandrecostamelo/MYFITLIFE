import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/render';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('winback_email', async () => {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();

  const { data: canceled } = await admin
    .from('cancellation_attempts')
    .select('id, user_id, reason, plan_tier_at_attempt')
    .eq('final_status', 'canceled')
    .is('winback_sent_at', null)
    .lte('completed_at', sevenDaysAgo)
    .gte('completed_at', eightDaysAgo)
    .limit(100);

  let sent = 0;

  for (const row of (canceled || []) as Record<string, unknown>[]) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', row.user_id as string)
      .maybeSingle();

    const profileRec = profile as Record<string, unknown> | null;
    if (!profileRec?.email || !process.env.RESEND_API_KEY) continue;

    const name = String(profileRec.full_name || 'treineiro');
    const tierLabel =
      row.plan_tier_at_attempt === 'premium' ? 'Premium' : 'Pro';

    await sendEmail({
      to: profileRec.email as string,
      template: 'win-back',
      props: {
        name,
        tierLabel,
        discountPct: 30,
        discountMonths: 3,
        winbackId: row.id,
      },
    }).catch(() => null);

    await admin
      .from('cancellation_attempts')
      .update({ winback_sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', row.id as string);

    sent++;
  }

  return NextResponse.json({ sent });
  }); // withHeartbeat
}
