import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inactive } = await supabase
    .from('user_stats')
    .select('user_id, current_streak, last_active_date')
    .lt('last_active_date', new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10))
    .gt('current_streak', 0)
    .limit(500);

  let pushed = 0;
  for (const u of inactive || []) {
    const sent = await sendPushToUser(supabase, u.user_id, {
      title: 'Sentimos sua falta no MyFitLife',
      body: `Sua streak de ${u.current_streak} dias está em risco. Volte hoje pra manter o ritmo!`,
      url: '/app',
      tag: 'streak_at_risk',
    });
    pushed += sent;
  }

  return NextResponse.json({ inactive_users: inactive?.length || 0, pushed });
}
