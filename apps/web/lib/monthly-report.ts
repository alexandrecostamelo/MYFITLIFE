import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

export type MonthlyReportData = {
  user: { full_name: string; email: string };
  period: { start: string; end: string; month_label: string };
  summary: {
    workouts_count: number;
    workouts_total_minutes: number;
    workouts_calories_estimate: number;
    meals_count: number;
    avg_calories_per_day: number;
    weight_change_kg: number | null;
    longest_streak: number;
    xp_gained: number;
    new_skills_mastered: number;
  };
  workouts: Array<{
    date: string;
    name: string;
    duration_min: number;
    effort: number | null;
    exercise_count: number;
  }>;
  meals_by_day: Array<{
    date: string;
    meal_count: number;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }>;
  weight_logs: Array<{ date: string; weight_kg: number }>;
  biomarkers: Array<{ name: string; value: number; unit: string; classification: string; date: string }>;
  checkins_summary: {
    count: number;
    avg_sleep: number;
    avg_energy: number;
    avg_mood: number;
  };
};

function monthBounds(year: number, month: number): { start: string; end: string; label: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${names[month - 1]} ${year}`,
  };
}

export async function buildMonthlyReport(
  supabase: Client,
  userId: string,
  email: string,
  year: number,
  month: number
): Promise<MonthlyReportData> {
  const bounds = monthBounds(year, month);
  const startDate = bounds.start.slice(0, 10);
  const endDate = bounds.end.slice(0, 10);

  const [profile, workoutLogs, meals, weightLogs, biomarkers, checkins, xpEvents, skillsMastered] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase
      .from('workout_logs')
      .select('id, session_id, started_at, duration_sec, perceived_effort')
      .eq('user_id', userId)
      .gte('started_at', bounds.start)
      .lte('started_at', bounds.end)
      .not('finished_at', 'is', null)
      .order('started_at'),
    supabase
      .from('meal_logs')
      .select('id, logged_at, calories_kcal, protein_g, carbs_g, fats_g')
      .eq('user_id', userId)
      .gte('logged_at', bounds.start)
      .lte('logged_at', bounds.end),
    supabase
      .from('weight_logs')
      .select('weight_kg, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', bounds.start)
      .lte('logged_at', bounds.end)
      .order('logged_at'),
    supabase
      .from('biomarkers')
      .select('marker_name, value, unit, status, measured_at')
      .eq('user_id', userId)
      .gte('measured_at', startDate)
      .lte('measured_at', endDate),
    supabase
      .from('morning_checkins')
      .select('sleep_quality, energy_level, mood')
      .eq('user_id', userId)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate),
    supabase
      .from('xp_events')
      .select('xp_awarded')
      .eq('user_id', userId)
      .gte('created_at', bounds.start)
      .lte('created_at', bounds.end),
    supabase
      .from('user_skills')
      .select('skill_key')
      .eq('user_id', userId)
      .eq('status', 'mastered')
      .gte('mastered_at', bounds.start)
      .lte('mastered_at', bounds.end),
  ]);

  const workoutRows = workoutLogs.data || [];

  // Get session names and exercise counts
  const sessionIds = [...new Set(workoutRows.map((w: Record<string, unknown>) => w.session_id as string).filter(Boolean))];
  let sessionNameMap: Record<string, string> = {};
  let sessionExerciseCountMap: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const [sessionsRes, exercisesRes] = await Promise.all([
      supabase.from('workout_sessions').select('id, name').in('id', sessionIds),
      supabase.from('workout_session_exercises').select('session_id').in('session_id', sessionIds),
    ]);
    (sessionsRes.data || []).forEach((s: Record<string, unknown>) => {
      sessionNameMap[s.id as string] = s.name as string;
    });
    (exercisesRes.data || []).forEach((e: Record<string, unknown>) => {
      const sid = e.session_id as string;
      sessionExerciseCountMap[sid] = (sessionExerciseCountMap[sid] || 0) + 1;
    });
  }

  const workouts = workoutRows.map((w: Record<string, unknown>) => ({
    date: (w.started_at as string).slice(0, 10),
    name: sessionNameMap[w.session_id as string] || 'Treino',
    duration_min: Math.round((Number(w.duration_sec) || 0) / 60),
    effort: w.perceived_effort != null ? Number(w.perceived_effort) : null,
    exercise_count: sessionExerciseCountMap[w.session_id as string] || 0,
  }));

  const totalMinutes = workouts.reduce((s, w) => s + w.duration_min, 0);

  const mealsByDayMap: Record<string, { date: string; meal_count: number; total_calories: number; total_protein: number; total_carbs: number; total_fat: number }> = {};
  (meals.data || []).forEach((m: Record<string, unknown>) => {
    const day = (m.logged_at as string).slice(0, 10);
    if (!mealsByDayMap[day]) {
      mealsByDayMap[day] = { date: day, meal_count: 0, total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 };
    }
    mealsByDayMap[day].meal_count += 1;
    mealsByDayMap[day].total_calories += Number(m.calories_kcal) || 0;
    mealsByDayMap[day].total_protein += Number(m.protein_g) || 0;
    mealsByDayMap[day].total_carbs += Number(m.carbs_g) || 0;
    mealsByDayMap[day].total_fat += Number(m.fats_g) || 0;
  });
  const mealsByDay = Object.values(mealsByDayMap).sort((a, b) => a.date.localeCompare(b.date));

  const daysWithMeals = mealsByDay.length;
  const avgCalories = daysWithMeals > 0
    ? Math.round(mealsByDay.reduce((s, d) => s + d.total_calories, 0) / daysWithMeals)
    : 0;

  const weightEntries = weightLogs.data || [];
  const weightChange = weightEntries.length >= 2
    ? +(Number(weightEntries[weightEntries.length - 1].weight_kg) - Number(weightEntries[0].weight_kg)).toFixed(1)
    : null;

  const xpGained = (xpEvents.data || []).reduce((s: number, e: Record<string, unknown>) => s + (Number(e.xp_awarded) || 0), 0);

  const checkinArr = checkins.data || [];
  const checkinSummary = {
    count: checkinArr.length,
    avg_sleep: checkinArr.length > 0
      ? +(checkinArr.reduce((s: number, c: Record<string, unknown>) => s + (Number(c.sleep_quality) || 0), 0) / checkinArr.length).toFixed(1)
      : 0,
    avg_energy: checkinArr.length > 0
      ? +(checkinArr.reduce((s: number, c: Record<string, unknown>) => s + (Number(c.energy_level) || 0), 0) / checkinArr.length).toFixed(1)
      : 0,
    avg_mood: checkinArr.length > 0
      ? +(checkinArr.reduce((s: number, c: Record<string, unknown>) => s + (Number(c.mood) || 0), 0) / checkinArr.length).toFixed(1)
      : 0,
  };

  return {
    user: { full_name: (profile.data as Record<string, unknown> | null)?.full_name as string || '', email },
    period: { start: bounds.start, end: bounds.end, month_label: bounds.label },
    summary: {
      workouts_count: workouts.length,
      workouts_total_minutes: totalMinutes,
      workouts_calories_estimate: Math.round(totalMinutes * 7),
      meals_count: (meals.data || []).length,
      avg_calories_per_day: avgCalories,
      weight_change_kg: weightChange,
      longest_streak: 0,
      xp_gained: xpGained,
      new_skills_mastered: (skillsMastered.data || []).length,
    },
    workouts,
    meals_by_day: mealsByDay,
    weight_logs: (weightEntries as Record<string, unknown>[]).map((w) => ({
      date: (w.logged_at as string).slice(0, 10),
      weight_kg: Number(w.weight_kg),
    })),
    biomarkers: (biomarkers.data || []).map((b: Record<string, unknown>) => ({
      name: b.marker_name as string,
      value: Number(b.value),
      unit: b.unit as string,
      classification: b.status as string,
      date: b.measured_at as string,
    })),
    checkins_summary: checkinSummary,
  };
}
