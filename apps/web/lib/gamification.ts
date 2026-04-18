import type { SupabaseClient } from '@supabase/supabase-js';
import { XP_REWARDS, type XpEvent, levelFromTotalXp, computeStreak } from '@myfitlife/core/gamification';

type Client = SupabaseClient<any, any, any>;

export async function ensureUserStats(supabase: Client, userId: string) {
  const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle();
  if (data) return data;
  const { data: inserted } = await supabase.from('user_stats').insert({ user_id: userId }).select('*').single();
  return inserted;
}

export async function awardXp(
  supabase: Client, userId: string, event: XpEvent,
  options?: { refTable?: string; refId?: string; description?: string; multiplier?: number }
) {
  const reward = XP_REWARDS[event];
  const xp = Math.round(reward.xp * (options?.multiplier ?? 1));
  if (xp <= 0) return;

  const stats = await ensureUserStats(supabase, userId);
  if (!stats) return;

  await supabase.from('xp_events').insert({
    user_id: userId, event_type: event, xp_awarded: xp, dimension: reward.dimension,
    ref_table: options?.refTable, ref_id: options?.refId, description: options?.description,
  });

  const dim = reward.dimension;
  const update: any = { total_xp: (stats.total_xp || 0) + xp };
  if (dim) { const key = `xp_${dim}`; update[key] = ((stats as any)[key] || 0) + xp; }
  update.level = levelFromTotalXp(update.total_xp);

  await supabase.from('user_stats').update(update).eq('user_id', userId);
}

export async function touchActivity(supabase: Client, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const stats = await ensureUserStats(supabase, userId);
  if (!stats) return { streak: 0 };

  const result = computeStreak({
    currentStreak: stats.current_streak || 0,
    lastActiveDate: stats.last_active_date,
    todayDate: today,
    freezesUsedThisMonth: stats.freezes_used_this_month || 0,
    freezesResetMonth: stats.freezes_reset_month,
  });

  const longest = Math.max(stats.longest_streak || 0, result.newStreak);

  await supabase.from('user_stats').update({
    current_streak: result.newStreak, longest_streak: longest,
    last_active_date: today, freezes_used_this_month: result.freezesUsedAfter,
    freezes_reset_month: today.slice(0, 7),
  }).eq('user_id', userId);

  if (result.newStreak > (stats.current_streak || 0)) {
    await awardXp(supabase, userId, 'STREAK_DAY', { description: `Streak dia ${result.newStreak}` });
  }

  return { streak: result.newStreak };
}

export async function checkAchievements(supabase: Client, userId: string) {
  const [
    { data: allAch }, { data: unlocked }, { data: stats },
    { count: workoutCount }, { count: mealCount }, { count: checkinCount },
    { count: weightLogsCount }, { count: gymsCount }, { count: equipmentScansCount },
    { count: questsCompletedCount }, { count: trailsCompletedCount },
  ] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    supabase.from('workout_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('finished_at', 'is', null),
    supabase.from('meal_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('morning_checkins').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('weight_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_gyms').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('equipment_recognitions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('daily_quests').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
    supabase.from('user_trails').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('completed_at', 'is', null),
  ]);

  const unlockedIds = new Set((unlocked || []).map((u: any) => u.achievement_id));
  const counters: Record<string, number> = {
    workouts_total: workoutCount || 0, meals_total: mealCount || 0,
    checkins_total: checkinCount || 0, weight_logs: weightLogsCount || 0,
    gyms_total: gymsCount || 0, equipment_scans: equipmentScansCount || 0,
    quests_completed: questsCompletedCount || 0, trails_completed: trailsCompletedCount || 0,
    streak: stats?.current_streak || 0, level: stats?.level || 1,
  };

  for (const ach of allAch || []) {
    if (unlockedIds.has(ach.id)) continue;
    const c = ach.criteria as any;
    let unlock = false;

    if (c.type && counters[c.type] !== undefined) unlock = counters[c.type] >= (c.count || 1);

    if (c.type === 'weight_diff') {
      const { data: logs } = await supabase.from('weight_logs').select('weight_kg').eq('user_id', userId).order('logged_at', { ascending: true });
      if (logs && logs.length >= 2) {
        const diff = Number(logs[logs.length - 1].weight_kg) - Number(logs[0].weight_kg);
        unlock = c.value < 0 ? diff <= c.value : diff >= c.value;
      }
    }

    if (unlock) {
      const { error } = await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: ach.id });
      if (!error && ach.xp_reward > 0) {
        await awardXp(supabase, userId, 'ACHIEVEMENT_UNLOCKED' as any, { refTable: 'achievements', refId: ach.id, description: `Desbloqueou: ${ach.title}`, multiplier: ach.xp_reward / 30 });
      }
    }
  }
}
