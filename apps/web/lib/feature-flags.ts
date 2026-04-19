import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

function hashUserForRollout(userId: string, flagKey: string): number {
  const hash = crypto.createHash('sha256').update(`${userId}:${flagKey}`).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export async function isFlagEnabled(
  supabase: Client,
  flagKey: string,
  userId?: string
): Promise<boolean> {
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('enabled, rollout_pct, target_user_ids')
    .eq('key', flagKey)
    .maybeSingle();

  if (!flag || !flag.enabled) return false;

  if (userId && flag.target_user_ids && flag.target_user_ids.includes(userId)) {
    return true;
  }

  if (flag.rollout_pct >= 100) return true;
  if (flag.rollout_pct <= 0) return false;

  if (!userId) return flag.rollout_pct === 100;

  const bucket = hashUserForRollout(userId, flagKey);
  return bucket < flag.rollout_pct;
}

export async function getAllFlagsForUser(
  supabase: Client,
  userId?: string
): Promise<Record<string, boolean>> {
  const { data: flags } = await supabase.from('feature_flags').select('key, enabled, rollout_pct, target_user_ids');
  if (!flags) return {};

  const result: Record<string, boolean> = {};
  for (const flag of flags as any[]) {
    if (!flag.enabled) {
      result[flag.key] = false;
      continue;
    }
    if (userId && flag.target_user_ids?.includes(userId)) {
      result[flag.key] = true;
      continue;
    }
    if (flag.rollout_pct >= 100) {
      result[flag.key] = true;
      continue;
    }
    if (!userId) {
      result[flag.key] = flag.rollout_pct === 100;
      continue;
    }
    result[flag.key] = hashUserForRollout(userId, flag.key) < flag.rollout_pct;
  }
  return result;
}
