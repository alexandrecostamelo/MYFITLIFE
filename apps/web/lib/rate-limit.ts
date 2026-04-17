import { createClient } from '@/lib/supabase/server';

export async function checkDailyLimit(userId: string, feature: string, maxPerDay: number): Promise<{ allowed: boolean; usedToday: number; remaining: number }> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', startOfDay.toISOString());

  const used = count ?? 0;
  return {
    allowed: used < maxPerDay,
    usedToday: used,
    remaining: Math.max(0, maxPerDay - used),
  };
}

export async function logUsage(userId: string, feature: string, costUnits = 1) {
  const supabase = await createClient();
  await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    feature,
    cost_units: costUnits,
  });
}
