import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

export async function computeUserProgress(
  supabase: Client,
  userId: string,
  metric: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const start = `${startDate}T00:00:00`;
  const end = `${endDate}T23:59:59`;

  if (metric === 'workouts') {
    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('started_at', start)
      .lte('started_at', end)
      .not('finished_at', 'is', null);
    return count || 0;
  }

  if (metric === 'sets') {
    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', start)
      .lte('started_at', end);
    const ids = (workouts || []).map((w: any) => w.id);
    if (ids.length === 0) return 0;
    const { count } = await supabase
      .from('set_logs')
      .select('*', { count: 'exact', head: true })
      .in('workout_log_id', ids);
    return count || 0;
  }

  if (metric === 'meals') {
    const { count } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('logged_at', start)
      .lte('logged_at', end);
    return count || 0;
  }

  if (metric === 'checkins') {
    const { count } = await supabase
      .from('morning_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate);
    return count || 0;
  }

  if (metric === 'weight_logs') {
    const { count } = await supabase
      .from('weight_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('logged_at', start)
      .lte('logged_at', end);
    return count || 0;
  }

  if (metric === 'xp') {
    const { data } = await supabase
      .from('xp_events')
      .select('xp_awarded')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end);
    return (data || []).reduce((acc: number, e: any) => acc + (e.xp_awarded || 0), 0);
  }

  if (metric === 'trail_days') {
    const { data } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'TRAIL_DAY')
      .gte('created_at', start)
      .lte('created_at', end);
    return (data || []).length;
  }

  if (metric === 'streak_days') {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', userId)
      .single();
    return stats?.current_streak || 0;
  }

  return 0;
}
