import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const year = parseInt(req.nextUrl.searchParams.get('year') || String(new Date().getFullYear()));
  const startStr = `${year}-01-01T00:00:00`;
  const endStr = `${year}-12-31T23:59:59`;

  const [
    workoutsRes,
    setsRes,
    mealsRes,
    photoMealsRes,
    checkinsRes,
    xpRes,
    weightsRes,
    trailsRes,
    achievementsRes,
    gymsRes,
    scansRes,
    profileRes,
    statsRes,
    favExerciseRes,
    favFoodRes,
  ] = await Promise.all([
    supabase.from('workout_logs').select('id, duration_sec').eq('user_id', user.id).gte('started_at', startStr).lte('started_at', endStr).not('finished_at', 'is', null),
    supabase.from('set_logs').select('id, weight_kg, reps, workout_logs!inner(user_id, started_at)').eq('workout_logs.user_id', user.id).gte('workout_logs.started_at', startStr).lte('workout_logs.started_at', endStr),
    supabase.from('meal_logs').select('id, calories_kcal').eq('user_id', user.id).gte('logged_at', startStr).lte('logged_at', endStr),
    supabase.from('meal_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('input_method', 'photo').gte('logged_at', startStr).lte('logged_at', endStr),
    supabase.from('morning_checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('checkin_date', `${year}-01-01`).lte('checkin_date', `${year}-12-31`),
    supabase.from('xp_events').select('xp_awarded').eq('user_id', user.id).gte('created_at', startStr).lte('created_at', endStr),
    supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', user.id).gte('logged_at', startStr).lte('logged_at', endStr).order('logged_at', { ascending: true }),
    supabase.from('user_trails').select('completed_at').eq('user_id', user.id).not('completed_at', 'is', null).gte('completed_at', startStr).lte('completed_at', endStr),
    supabase.from('user_achievements').select('id, unlocked_at').eq('user_id', user.id).gte('unlocked_at', startStr).lte('unlocked_at', endStr),
    supabase.from('user_gyms').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startStr).lte('created_at', endStr),
    supabase.from('equipment_recognitions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startStr).lte('created_at', endStr),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('user_stats').select('level, total_xp, longest_streak').eq('user_id', user.id).single(),
    supabase.from('set_logs').select('exercise_id, workout_logs!inner(user_id, started_at)').eq('workout_logs.user_id', user.id).gte('workout_logs.started_at', startStr).lte('workout_logs.started_at', endStr),
    supabase.from('meal_logs').select('food_id, foods(name)').eq('user_id', user.id).gte('logged_at', startStr).lte('logged_at', endStr).not('food_id', 'is', null),
  ]);

  const totalWorkouts = workoutsRes.data?.length || 0;
  const totalMinutes = (workoutsRes.data || []).reduce((acc: number, w: any) => acc + Math.round((w.duration_sec || 0) / 60), 0);

  const totalSets = setsRes.data?.length || 0;
  const totalWeightMoved = (setsRes.data || []).reduce((acc: number, s: any) =>
    acc + Number(s.weight_kg || 0) * (s.reps || 0)
  , 0);

  const totalMeals = mealsRes.data?.length || 0;
  const totalCalories = (mealsRes.data || []).reduce((a: number, m: any) => a + Number(m.calories_kcal || 0), 0);

  const totalXp = (xpRes.data || []).reduce((a: number, e: any) => a + (e.xp_awarded || 0), 0);

  const weightStart = weightsRes.data?.[0]?.weight_kg;
  const weightEnd = weightsRes.data?.[weightsRes.data.length - 1]?.weight_kg;
  const weightChange = weightStart && weightEnd
    ? Math.round((Number(weightEnd) - Number(weightStart)) * 10) / 10
    : null;

  const exerciseCounts: Record<string, number> = {};
  (favExerciseRes.data || []).forEach((s: any) => {
    exerciseCounts[s.exercise_id] = (exerciseCounts[s.exercise_id] || 0) + 1;
  });
  const topExerciseId = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  let favExerciseName: string | null = null;
  if (topExerciseId) {
    const { data: ex } = await supabase.from('exercises').select('name_pt').eq('id', topExerciseId).single();
    favExerciseName = ex?.name_pt || null;
  }

  const foodCounts: Record<string, { name: string; count: number }> = {};
  (favFoodRes.data || []).forEach((m: any) => {
    if (!m.food_id || !m.foods) return;
    const name = (m.foods as any).name;
    if (!foodCounts[m.food_id]) foodCounts[m.food_id] = { name, count: 0 };
    foodCounts[m.food_id].count++;
  });
  const topFood = Object.values(foodCounts).sort((a, b) => b.count - a.count)[0];

  return NextResponse.json({
    year,
    user_name: profileRes.data?.full_name?.split(' ')[0] || 'você',
    level: statsRes.data?.level || 1,
    total_xp: statsRes.data?.total_xp || 0,
    longest_streak: statsRes.data?.longest_streak || 0,
    workouts: {
      total: totalWorkouts,
      total_minutes: totalMinutes,
      total_hours: Math.round(totalMinutes / 60),
      total_sets: totalSets,
      total_weight_moved_kg: Math.round(totalWeightMoved),
      favorite_exercise: favExerciseName,
    },
    nutrition: {
      meals_total: totalMeals,
      total_calories: Math.round(totalCalories),
      photo_meals: photoMealsRes.count || 0,
      favorite_food: topFood?.name || null,
      favorite_food_times: topFood?.count || 0,
    },
    consistency: {
      checkins: checkinsRes.count || 0,
      achievements_unlocked: achievementsRes.data?.length || 0,
      xp_earned: totalXp,
      weight_change_kg: weightChange,
    },
    special: {
      gyms_added: gymsRes.count || 0,
      equipment_scans: scansRes.count || 0,
      trails_completed: trailsRes.data?.length || 0,
    },
  });
}
