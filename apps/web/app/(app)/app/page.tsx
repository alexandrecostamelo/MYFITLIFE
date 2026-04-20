import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';
import { calculateSleepScore } from '@/lib/health/sleep-score';
import { WidgetSync } from '@/components/widgets/widget-sync';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
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
    mealHeatRes,
    checkinHeatRes,
    xpRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'full_name, avatar_url, subscription_tier, coach_persona, dashboard_metrics',
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('morning_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('checkin_date', todayStr)
      .maybeSingle(),
    supabase
      .from('workout_logs')
      .select('id, duration_sec, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth),
    supabase
      .from('workout_logs')
      .select('id, duration_sec')
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
    // Heatmap: meals
    supabase
      .from('meal_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth),
    // Heatmap: checkins
    supabase
      .from('morning_checkins')
      .select('checkin_date')
      .eq('user_id', user.id)
      .gte('checkin_date', startOfMonth.slice(0, 10)),
    // XP total
    supabase
      .from('user_stats')
      .select('total_xp')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  // Calculate sleep score (non-blocking)
  let sleepScore: { total: number; label: string; avg_hours: number; tip: string } | null =
    null;
  try {
    sleepScore = await calculateSleepScore(user.id);
  } catch {
    // sleep score is non-critical
  }

  // Week days completed
  const workoutsAll = (workoutsMonthRes.data || []) as Record<
    string,
    unknown
  >[];
  const workoutsWeek = workoutsAll.filter(
    (w) => String(w.created_at || '').slice(0, 10) >= startOfWeek,
  );
  const weekDays = [false, false, false, false, false, false, false];
  for (const w of workoutsWeek) {
    const day = new Date(String(w.created_at)).getDay();
    weekDays[day] = true;
  }

  // Multi-source heatmap
  const heatmapData: Record<
    string,
    { workouts: number; meals: number; checkins: number }
  > = {};
  for (const w of workoutsAll) {
    const k = String(w.created_at || '').slice(0, 10);
    if (!k) continue;
    if (!heatmapData[k])
      heatmapData[k] = { workouts: 0, meals: 0, checkins: 0 };
    heatmapData[k].workouts++;
  }
  for (const m of (mealHeatRes.data || []) as Record<string, unknown>[]) {
    const k = String(m.created_at || '').slice(0, 10);
    if (!k) continue;
    if (!heatmapData[k])
      heatmapData[k] = { workouts: 0, meals: 0, checkins: 0 };
    heatmapData[k].meals++;
  }
  for (const c of (checkinHeatRes.data || []) as Record<string, unknown>[]) {
    const k = String(c.checkin_date || '');
    if (!k) continue;
    if (!heatmapData[k])
      heatmapData[k] = { workouts: 0, meals: 0, checkins: 0 };
    heatmapData[k].checkins++;
  }

  const todayWorkouts = (workoutsTodayRes.data || []) as Record<
    string,
    unknown
  >[];
  const todayMinutes = Math.round(
    todayWorkouts.reduce(
      (s, w) => s + (Number(w.duration_sec) || 0),
      0,
    ) / 60,
  );
  const monthSessions = workoutsAll.length;
  const mealsCount = (mealsRes.data || []).length;

  const profileRec = profileRes.data as Record<string, unknown> | null;
  const streakRec = streakRes.data as Record<string, unknown> | null;
  const weightRec = weightRes.data as Record<string, unknown> | null;
  const planRec = planRes.data as Record<string, unknown> | null;
  const readinessRec = readinessRes.data as Record<string, unknown> | null;
  const xpRec = xpRes.data as Record<string, unknown> | null;

  const streak = Number(streakRec?.current_streak) || 0;
  const xpTotal = Number(xpRec?.total_xp) || 0;
  const currentWeight = weightRec?.weight_kg
    ? Number(weightRec.weight_kg)
    : undefined;

  const rings = [
    { value: todayMinutes, max: 60, color: '#00D9A3', label: 'Movimento' },
    {
      value: todayWorkouts.length,
      max: 1,
      color: '#FFD93D',
      label: 'Treino',
    },
    { value: mealsCount, max: 4, color: '#FF6B6B', label: 'Nutri\u00e7\u00e3o' },
  ];

  const todo = {
    checkinDone: !!checkinRes.data,
    workoutDone: todayWorkouts.length > 0,
    mealsDone: mealsCount >= 3,
    hasPlan: !!planRec,
  };

  // Configurable hero metrics
  const allMetrics: Record<string, { value: string | number; label: string }> =
    {
      streak: { value: streak, label: 'Streak' },
      sessions: { value: monthSessions, label: 'Sess\u00f5es' },
      minutes: { value: todayMinutes, label: 'Minutos' },
      calories: { value: '--', label: 'Kcal' },
      weight: {
        value: currentWeight ? `${currentWeight}` : '--',
        label: 'Peso',
      },
      sleep: {
        value: sleepScore && sleepScore.total > 0 ? sleepScore.total : '--',
        label: 'Sono',
      },
      readiness: {
        value: readinessRec ? Number(readinessRec.score) : '--',
        label: 'Readiness',
      },
      xp: { value: xpTotal, label: 'XP' },
      workouts_week: { value: workoutsWeek.length, label: 'Semana' },
    };

  const dashboardMetrics = profileRec?.dashboard_metrics;
  const selectedMetricKeys = Array.isArray(dashboardMetrics)
    ? (dashboardMetrics as string[]).slice(0, 3)
    : ['streak', 'sessions', 'minutes'];

  const heroMetrics = selectedMetricKeys.map(
    (k) => allMetrics[k] || { value: '--', label: k },
  );

  return (
    <>
    <WidgetSync data={{
      streak,
      todayWorkout: planRec?.workout_suggestion
        ? String(planRec.program_name || 'Treino do dia pronto')
        : null,
      todayWorkoutDone: todo.workoutDone,
      todayMinutes,
      nextMeal: null,
      nextMealTime: null,
      mealsLogged: mealsCount,
      mealsTarget: 4,
      checkinDone: todo.checkinDone,
      readinessScore: readinessRec ? Number(readinessRec.score) : null,
      readinessZone: readinessRec ? String(readinessRec.zone) : null,
      sleepScore: sleepScore?.total ?? null,
      updatedAt: new Date().toISOString(),
    }} />
    <DashboardClient
      name={String(profileRec?.full_name || 'Treineiro').split(' ')[0]}
      avatar={
        profileRec?.avatar_url ? String(profileRec.avatar_url) : null
      }
      tier={String(profileRec?.subscription_tier || 'free')}
      rings={rings}
      streak={streak}
      monthSessions={monthSessions}
      todayMinutes={todayMinutes}
      weekDays={weekDays}
      heatmap={heatmapData}
      todo={todo}
      currentWeight={currentWeight}
      workoutTitle={
        planRec?.workout_suggestion
          ? String(planRec.program_name || 'Treino do dia pronto')
          : undefined
      }
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
      sleepScore={
        sleepScore && sleepScore.total > 0
          ? {
              total: sleepScore.total,
              label: sleepScore.label,
              avgHours: sleepScore.avg_hours,
              tip: sleepScore.tip,
            }
          : undefined
      }
      heroMetrics={heroMetrics}
    />
    </>
  );
}
