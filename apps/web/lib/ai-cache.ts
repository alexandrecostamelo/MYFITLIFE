import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<any, any, any>;

const CACHE_TTL_MINUTES: Record<string, number> = {
  food_substitution: 60 * 24 * 7,
  shopping_list_template: 60 * 24,
  quest_template: 60 * 4,
  coach_faq: 60 * 24,
};

export function buildCacheKey(feature: string, input: string): string {
  const normalized = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  const hash = crypto.createHash('sha256').update(`${feature}::${normalized}`).digest('hex').slice(0, 32);
  return `${feature}:${hash}`;
}

export async function getCachedResponse(supabase: Client, cacheKey: string): Promise<string | null> {
  const { data } = await supabase
    .from('ai_response_cache')
    .select('response_text, id, hit_count')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data) return null;

  await supabase
    .from('ai_response_cache')
    .update({
      hit_count: (data.hit_count || 0) + 1,
      last_hit_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return data.response_text;
}

export async function setCachedResponse(
  supabase: Client,
  cacheKey: string,
  feature: string,
  responseText: string,
  ttlMinutes?: number
): Promise<void> {
  const ttl = ttlMinutes || CACHE_TTL_MINUTES[feature] || 60;
  const expiresAt = new Date(Date.now() + ttl * 60000).toISOString();

  await supabase.from('ai_response_cache').upsert({
    cache_key: cacheKey,
    feature,
    response_text: responseText,
    expires_at: expiresAt,
  }, { onConflict: 'cache_key' });
}
