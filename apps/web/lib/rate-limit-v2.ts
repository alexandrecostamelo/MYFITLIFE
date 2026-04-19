import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

type LimitConfig = {
  max: number;
  window_minutes: number;
};

export const LIMITS: Record<string, LimitConfig> = {
  coach_message: { max: 30, window_minutes: 60 * 24 },
  coach_stream: { max: 30, window_minutes: 60 * 24 },
  food_vision: { max: 30, window_minutes: 60 * 24 },
  equipment_scan: { max: 50, window_minutes: 60 * 24 },
  adaptive_workout: { max: 20, window_minutes: 60 * 24 },
  shopping_list: { max: 10, window_minutes: 60 * 24 },
  food_substitution: { max: 30, window_minutes: 60 * 24 },
  lab_extraction: { max: 5, window_minutes: 60 * 24 },
  daily_quests: { max: 3, window_minutes: 60 * 24 },
  moderation_text: { max: 200, window_minutes: 60 * 24 },
  proactive_check: { max: 4, window_minutes: 60 },
  autopilot: { max: 3, window_minutes: 60 * 24 },
};

export async function checkAndIncrementLimit(
  supabase: Client,
  userId: string,
  bucket: string
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const config = LIMITS[bucket];
  if (!config) return { allowed: true, remaining: 99999, resetAt: new Date().toISOString() };

  const windowStart = new Date(Date.now() - config.window_minutes * 60000);

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('user_id', userId)
    .eq('bucket', bucket)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  const resetAt = new Date(Date.now() + config.window_minutes * 60000).toISOString();

  if (existing) {
    if (existing.count >= config.max) {
      const windowEndsAt = new Date(new Date(existing.window_start).getTime() + config.window_minutes * 60000).toISOString();
      return { allowed: false, remaining: 0, resetAt: windowEndsAt };
    }

    await supabase.from('rate_limits').update({ count: existing.count + 1 }).eq('id', existing.id);
    return { allowed: true, remaining: config.max - existing.count - 1, resetAt };
  }

  await supabase.from('rate_limits').insert({
    user_id: userId,
    bucket,
    window_start: new Date().toISOString(),
    count: 1,
  });

  return { allowed: true, remaining: config.max - 1, resetAt };
}

export async function getUsageFor(supabase: Client, userId: string, bucket: string): Promise<{ used: number; max: number; remaining: number }> {
  const config = LIMITS[bucket] || { max: 0, window_minutes: 60 * 24 };
  const windowStart = new Date(Date.now() - config.window_minutes * 60000);

  const { data } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('bucket', bucket)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  const used = data?.count || 0;
  return { used, max: config.max, remaining: Math.max(0, config.max - used) };
}
