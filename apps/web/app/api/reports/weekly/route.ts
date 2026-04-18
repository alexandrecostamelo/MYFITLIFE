import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

  const now = new Date();
  const currentWeekStart = weekStart(now);
  currentWeekStart.setDate(currentWeekStart.getDate() - offset * 7);
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startStr = currentWeekStart.toISOString();
  const endStr = weekEnd.toISOString();
  const startDate = currentWeekStart.toISOString().slice(0, 10);
  const endDate = weekEnd.toISOString().slice(0, 10);

  const [workouts, meals, checkins, xp, weights] = await Promise.all([
    supabase.from('workout_logs').select('id, duration_sec, perceived_effort')
      .eq('user_id', user.id).gte('started_at', startStr).lte('started_at', endStr).not('finished_at', 'is', null),
    supabase.from('meal_logs').select('calories_kcal, protein_g')
      .eq('user_id', user.id).gte('logged_at', startStr).lte('logged_at', endStr),
    supabase.from('morning_checkins').select('checkin_date, sleep_quality, energy_level, mood')
      .eq('user_id', user.id).gte('checkin_date', startDate).lte('checkin_date', endDate),
    supabase.from('xp_events').select('xp_awarded, event_type')
      .eq('user_id', user.id).gte('created_at', startStr).lte('created_at', endStr),
    supabase.from('weight_logs').select('weight_kg, logged_at')
      .eq('user_id', user.id).gte('logged_at', startStr).lte('logged_at', endStr).order('logged_at', { ascending: true }),
  ]);

  const totalMinutes = (workouts.data || []).reduce((acc: number, w: any) => acc + Math.round((w.duration_sec || 0) / 60), 0);
  const avgEffort = workouts.data && workouts.data.length > 0
    ? Math.round(workouts.data.reduce((a: number, w: any) => a + (w.perceived_effort || 0), 0) / workouts.data.length)
    : 0;

  const totalCalories = (meals.data || []).reduce((a: number, m: any) => a + Number(m.calories_kcal || 0), 0);
  const totalProtein = (meals.data || []).reduce((a: number, m: any) => a + Number(m.protein_g || 0), 0);

  const avgSleep = checkins.data && checkins.data.length > 0
    ? Math.round((checkins.data.reduce((a: number, c: any) => a + (c.sleep_quality || 0), 0) / checkins.data.length) * 10) / 10
    : 0;
  const avgEnergy = checkins.data && checkins.data.length > 0
    ? Math.round((checkins.data.reduce((a: number, c: any) => a + (c.energy_level || 0), 0) / checkins.data.length) * 10) / 10
    : 0;

  const totalXp = (xp.data || []).reduce((a: number, e: any) => a + (e.xp_awarded || 0), 0);

  const weightChange = weights.data && weights.data.length >= 2
    ? Math.round((Number(weights.data[weights.data.length - 1].weight_kg) - Number(weights.data[0].weight_kg)) * 10) / 10
    : null;

  let highlight = 'Uma semana tranquila!';
  const workoutsCount = workouts.data?.length || 0;
  if (workoutsCount >= 5) highlight = `🔥 Incrível! ${workoutsCount} treinos essa semana.`;
  else if (workoutsCount >= 3) highlight = `💪 Ótima consistência com ${workoutsCount} treinos.`;
  else if (totalXp > 500) highlight = `⭐ Você ganhou ${totalXp} XP — mandou bem!`;
  else if (checkins.data && checkins.data.length >= 5) highlight = `🌅 ${checkins.data.length} check-ins — autoconhecimento no ponto.`;
  else if (workoutsCount === 0 && (meals.data?.length || 0) === 0) highlight = 'Semana parada — bora recomeçar?';

  const summary = {
    week_start: startDate,
    week_end: endDate,
    workouts_count: workoutsCount,
    workouts_minutes: totalMinutes,
    avg_perceived_effort: avgEffort,
    meals_count: meals.data?.length || 0,
    total_calories: Math.round(totalCalories),
    total_protein_g: Math.round(totalProtein),
    checkins_count: checkins.data?.length || 0,
    avg_sleep: avgSleep,
    avg_energy: avgEnergy,
    xp_earned: totalXp,
    weight_change_kg: weightChange,
    highlight,
  };

  return NextResponse.json({ report: summary });
}
