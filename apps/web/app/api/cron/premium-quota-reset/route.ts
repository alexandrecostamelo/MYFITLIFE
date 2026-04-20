import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdmin } from '@supabase/supabase-js';
import { withHeartbeat } from '@/lib/monitoring/heartbeat';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return withHeartbeat('premium_quota_reset', async () => {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { data: premiumUsers } = await admin
      .from('profiles')
      .select('id')
      .eq('subscription_tier', 'premium');

    let created = 0;
    for (const p of (premiumUsers || []) as Record<string, unknown>[]) {
      const { error } = await admin.from('premium_quotas').insert({
        user_id: p.id,
        period_year: year,
        period_month: month,
      } as Record<string, unknown>);
      if (!error) created++;
    }

    return NextResponse.json({ created, total: premiumUsers?.length || 0 });
  });
}
