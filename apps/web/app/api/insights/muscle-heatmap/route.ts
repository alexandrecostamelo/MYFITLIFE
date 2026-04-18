import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { matchMuscleRegion, MUSCLE_LABELS, type MuscleRegion } from '@myfitlife/core/workout/muscles';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const daysParam = parseInt(req.nextUrl.searchParams.get('days') || '7');
  const days = Math.min(30, Math.max(1, daysParam));

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const { data: workouts } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('started_at', startDate.toISOString());

  const workoutIds = (workouts || []).map((w: any) => w.id);

  if (workoutIds.length === 0) {
    return NextResponse.json({ heatmap: {}, top_muscles: [], underworked: [], total_sets: 0, days });
  }

  const { data: sets } = await supabase
    .from('set_logs')
    .select('exercise_id')
    .in('workout_log_id', workoutIds);

  const exerciseCounts: Record<string, number> = {};
  (sets || []).forEach((s: any) => {
    exerciseCounts[s.exercise_id] = (exerciseCounts[s.exercise_id] || 0) + 1;
  });

  const exerciseIds = Object.keys(exerciseCounts);
  if (exerciseIds.length === 0) {
    return NextResponse.json({ heatmap: {}, top_muscles: [], underworked: [], total_sets: 0, days });
  }

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, primary_muscles, secondary_muscles')
    .in('id', exerciseIds);

  const muscleLoad: Record<string, number> = {};
  (exercises || []).forEach((ex: any) => {
    const s = exerciseCounts[ex.id] || 0;
    (ex.primary_muscles || []).forEach((m: string) => {
      const region = matchMuscleRegion(m);
      if (region) muscleLoad[region] = (muscleLoad[region] || 0) + s;
    });
    (ex.secondary_muscles || []).forEach((m: string) => {
      const region = matchMuscleRegion(m);
      if (region) muscleLoad[region] = (muscleLoad[region] || 0) + s * 0.4;
    });
  });

  const maxLoad = Math.max(...Object.values(muscleLoad), 1);
  const heatmap: Record<string, number> = {};
  for (const [region, load] of Object.entries(muscleLoad)) {
    heatmap[region] = Math.max(1, Math.round((load / maxLoad) * 5));
  }

  const topMuscles = Object.entries(muscleLoad)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([region, load]) => ({
      region,
      label: MUSCLE_LABELS[region as MuscleRegion] || region,
      sets: Math.round(load),
    }));

  const allMainMuscles: MuscleRegion[] = [
    'peitoral_superior', 'latissimo', 'deltoide_lateral',
    'biceps', 'triceps', 'quadriceps', 'isquiotibiais', 'gluteos',
  ];
  const underworked = allMainMuscles
    .filter((m) => (muscleLoad[m] || 0) < maxLoad * 0.2)
    .map((m) => ({ region: m, label: MUSCLE_LABELS[m] }));

  return NextResponse.json({
    heatmap,
    top_muscles: topMuscles,
    underworked,
    total_sets: Object.values(exerciseCounts).reduce((a, b) => a + b, 0),
    days,
  });
}
