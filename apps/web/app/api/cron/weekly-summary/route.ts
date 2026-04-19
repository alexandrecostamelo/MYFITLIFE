import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, weeklySummaryEmailHtml } from '@/lib/email';

export const maxDuration = 300;

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users } = await supabase
    .from('notification_preferences')
    .select('user_id, email_enabled, weekly_summary_email')
    .eq('email_enabled', true)
    .eq('weekly_summary_email', true)
    .limit(2000);

  const ws = weekStart(new Date());
  ws.setDate(ws.getDate() - 7);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  we.setHours(23, 59, 59, 999);

  let sent = 0;
  for (const pref of users || []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(pref.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', pref.user_id).single();

    const [workoutsRes, mealsRes, xpRes] = await Promise.all([
      supabase.from('workout_logs').select('duration_sec').eq('user_id', pref.user_id).gte('started_at', ws.toISOString()).lte('started_at', we.toISOString()).not('finished_at', 'is', null),
      supabase.from('meal_logs').select('id').eq('user_id', pref.user_id).gte('logged_at', ws.toISOString()).lte('logged_at', we.toISOString()),
      supabase.from('xp_events').select('xp_awarded').eq('user_id', pref.user_id).gte('created_at', ws.toISOString()).lte('created_at', we.toISOString()),
    ]);

    const summary = {
      workouts_count: workoutsRes.data?.length || 0,
      workouts_minutes: (workoutsRes.data || []).reduce((a: number, w: any) => a + Math.round((w.duration_sec || 0) / 60), 0),
      meals_count: mealsRes.data?.length || 0,
      xp_earned: (xpRes.data || []).reduce((a: number, e: any) => a + (e.xp_awarded || 0), 0),
      highlight: (workoutsRes.data?.length || 0) >= 3 ? 'Ótima consistência essa semana 💪' : 'Novo ciclo começa — vamos juntos?',
    };

    if (summary.workouts_count === 0 && summary.meals_count === 0) continue;

    const firstName = (profile?.full_name || '').split(' ')[0] || 'atleta';
    const result = await sendEmail(supabase, {
      to: email,
      userId: pref.user_id,
      template: 'weekly_summary',
      subject: `Sua semana no MyFitLife 📊`,
      html: weeklySummaryEmailHtml(firstName, summary),
    });

    if (result.success) sent++;
  }

  return NextResponse.json({ eligible: users?.length || 0, sent });
}
