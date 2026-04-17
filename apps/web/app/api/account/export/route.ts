import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [profile, userProfile, mealLogs, workoutLogs, weightLogs, morningCheckins, dailyPlans, coachConversations] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('meal_logs').select('*').eq('user_id', user.id),
    supabase.from('workout_logs').select('*').eq('user_id', user.id),
    supabase.from('weight_logs').select('*').eq('user_id', user.id),
    supabase.from('morning_checkins').select('*').eq('user_id', user.id),
    supabase.from('daily_plans').select('*').eq('user_id', user.id),
    supabase.from('coach_conversations').select('*').eq('user_id', user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    data: {
      profile: profile.data,
      user_profile: userProfile.data,
      meal_logs: mealLogs.data,
      workout_logs: workoutLogs.data,
      weight_logs: weightLogs.data,
      morning_checkins: morningCheckins.data,
      daily_plans: dailyPlans.data,
      coach_conversations: coachConversations.data,
    },
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="myfitlife-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
