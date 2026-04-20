import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function updateGoalProgress(userId: string): Promise<number> {
  const supa = admin();
  const { data: goals } = await supa
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  let updated = 0;

  for (const goal of (goals || []) as Record<string, unknown>[]) {
    let currentValue = Number(goal.current_value) || 0;
    let newPct = Number(goal.progress_pct) || 0;

    if (goal.auto_track_source === 'weight_logs') {
      const { data: latest } = await supa
        .from('weight_logs')
        .select('weight_kg')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) currentValue = Number(latest.weight_kg);
    }

    if (goal.auto_track_source === 'workout_count') {
      const startDate = String(goal.created_at);
      const { count } = await supa
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startDate);
      currentValue = count || 0;
    }

    if (goal.auto_track_source === 'streak') {
      const { data: stats } = await supa
        .from('user_stats')
        .select('current_streak')
        .eq('user_id', userId)
        .maybeSingle();
      currentValue = Number(stats?.current_streak) || 0;
    }

    const targetValue = Number(goal.target_value) || 0;
    if (targetValue !== 0) {
      const start = Number(goal.start_value) || 0;
      const range = targetValue - start;
      if (range !== 0) {
        newPct = Math.min(
          100,
          Math.max(0, ((currentValue - start) / range) * 100)
        );
      }
    }

    const isCompleted = newPct >= 100;

    if (
      currentValue !== Number(goal.current_value) ||
      newPct !== Number(goal.progress_pct)
    ) {
      await supa
        .from('user_goals')
        .update({
          current_value: currentValue,
          progress_pct: Math.round(newPct * 10) / 10,
          status: isCompleted ? 'completed' : 'active',
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', goal.id);
      updated++;
    }
  }

  return updated;
}
