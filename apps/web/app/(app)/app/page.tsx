import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000)
    .toISOString()
    .slice(0, 10);

  const [
    profileRes,
    checkinRes,
    workoutsMonthRes,
    workoutsTodayRes,
    mealsRes,
    planRes,
    weightRes,
    streakRes,
    readinessRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, subscription_tier, coach_persona')
      .eq('id', user.id)
      .single(),
    supabase
      .from('morning_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle(),
    supabase
      .from('workout_logs')
      .select('id, duration_minutes, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth),
    supabase
      .from('workout_logs')
      .select('id, duration_minutes')
      .eq('user_id', user.id)
      .gte('created_at', todayStr),
    supabase
      .from('meal_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', todayStr),
    supabase
      .from('daily_plans')
      .select('id, workout_suggestion, program_name')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle(),
    supabase
      .from('weight_logs')
      .select('weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('readiness_scores')
      .select('score, zone, recommendation')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle(),
  ]);

  // Week days completed
  const workoutsAll = (workoutsMonthRes.data || []) as Record<string, unknown>[];
  const workoutsWeek = workoutsAll.filter(
    (w) => String(w.created_at || '').slice(0, 10) >= startOfWeek,
  );
  const weekDays = [false, false, false, false, false, false, false];
  for (const w of workoutsWeek) {
    const day = new Date(String(w.created_at)).getDay();
    weekDays[day] = true;
  }

  // Heatmap
  const heatmapData: Record<string, number> = {};
  for (const w of workoutsAll) {
    const key = String(w.created_at || '').slice(0, 10);
    if (key) heatmapData[key] = (heatmapData[key] || 0) + 1;
  }

  const todayWorkouts = (workoutsTodayRes.data || []) as Record<string, unknown>[];
  const todayMinutes = todayWorkouts.reduce(
    (s, w) => s + (Number(w.duration_minutes) || 0),
    0,
  );
  const monthSessions = workoutsAll.length;
  const mealsCount = (mealsRes.data || []).length;

  const profileRec = profileRes.data as Record<string, unknown> | null;
  const streakRec = streakRes.data as Record<string, unknown> | null;
  const weightRec = weightRes.data as Record<string, unknown> | null;
  const planRec = planRes.data as Record<string, unknown> | null;
  const readinessRec = readinessRes.data as Record<string, unknown> | null;

  const rings = [
    { value: todayMinutes, max: 60, color: '#00D9A3', label: 'Movimento' },
    { value: todayWorkouts.length, max: 1, color: '#FFD93D', label: 'Treino' },
    { value: mealsCount, max: 4, color: '#FF6B6B', label: 'Nutrição' },
  ];

  const todo = {
    checkinDone: !!checkinRes.data,
    workoutDone: todayWorkouts.length > 0,
    mealsDone: mealsCount >= 3,
    hasPlan: !!planRec,
  };

  return (
    <DashboardClient
      name={String(profileRec?.full_name || 'Treineiro').split(' ')[0]}
      avatar={profileRec?.avatar_url ? String(profileRec.avatar_url) : null}
      tier={String(profileRec?.subscription_tier || 'free')}
      rings={rings}
      streak={Number(streakRec?.current_streak) || 0}
      monthSessions={monthSessions}
      todayMinutes={todayMinutes}
      weekDays={weekDays}
      heatmap={heatmapData}
      todo={todo}
      currentWeight={weightRec?.weight_kg ? Number(weightRec.weight_kg) : undefined}
      workoutTitle={planRec?.workout_suggestion ? String(planRec.program_name || 'Treino do dia pronto') : undefined}
      coachPersona={String(profileRec?.coach_persona || 'leo')}
      readiness={
        readinessRec
          ? {
              score: Number(readinessRec.score),
              zone: String(readinessRec.zone) as 'green' | 'yellow' | 'red',
              recommendation: String(readinessRec.recommendation || ''),
            }
          : undefined
      }
    />
  );
}
