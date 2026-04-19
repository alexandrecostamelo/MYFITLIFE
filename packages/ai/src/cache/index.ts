import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeQuery, isCacheable } from './normalize';

export type CacheContext =
  | 'coach_general'
  | 'food_generic'
  | 'exercise_form'
  | 'supplement_faq'
  | 'nutrition_faq';

interface CachedEntry {
  response_text: string;
  tokens_input: number | null;
  tokens_output: number | null;
  hit_count: number;
}

interface CacheOptions {
  context: CacheContext;
  model: string;
  ttlHours?: number;
}

const DEFAULT_TTL_HOURS: Record<CacheContext, number> = {
  coach_general: 168,
  food_generic: 720,
  exercise_form: 720,
  supplement_faq: 336,
  nutrition_faq: 720,
};

function buildCacheKey(context: CacheContext, model: string, normalized: string): string {
  const hash = createHash('sha256')
    .update(`${context}:${model}:${normalized}`)
    .digest('hex');
  return hash.slice(0, 32);
}

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getCachedResponse(
  query: string,
  options: CacheOptions
): Promise<string | null> {
  if (!isCacheable(query)) return null;

  const normalized = normalizeQuery(query);
  const key = buildCacheKey(options.context, options.model, normalized);

  const supabase = getAdminClient();
  const { data } = await supabase
    .from('ai_response_cache')
    .select('response_text, tokens_input, tokens_output, hit_count')
    .eq('cache_key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data) {
    await logStat(supabase, options.context, 'miss', 0, 0);
    return null;
  }

  const entry = data as CachedEntry;

  // Update hit count non-blocking
  supabase
    .from('ai_response_cache')
    .update({
      hit_count: entry.hit_count + 1,
      last_hit_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('cache_key', key)
    .then(() => {});

  await logStat(
    supabase,
    options.context,
    'hit',
    entry.tokens_input || 0,
    entry.tokens_output || 0
  );

  return entry.response_text;
}

export async function setCachedResponse(
  query: string,
  response: string,
  tokensInput: number,
  tokensOutput: number,
  options: CacheOptions
): Promise<void> {
  if (!isCacheable(query)) return;
  if (!response || response.length < 20) return;

  const normalized = normalizeQuery(query);
  const key = buildCacheKey(options.context, options.model, normalized);
  const ttlHours = options.ttlHours ?? DEFAULT_TTL_HOURS[options.context];
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  const supabase = getAdminClient();
  await supabase.from('ai_response_cache').upsert(
    {
      cache_key: key,
      normalized_query: normalized,
      response_text: response,
      model: options.model,
      context_type: options.context,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      expires_at: expiresAt,
    } as Record<string, unknown>,
    { onConflict: 'cache_key' }
  );
}

async function logStat(
  supabase: SupabaseClient,
  context: CacheContext,
  kind: 'hit' | 'miss',
  tokensInput: number,
  tokensOutput: number
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from('ai_cache_stats')
    .select('id, hits, misses, tokens_saved_input, tokens_saved_output')
    .eq('day', today)
    .eq('context_type', context)
    .maybeSingle();

  if (!existing) {
    await supabase.from('ai_cache_stats').insert({
      day: today,
      context_type: context,
      hits: kind === 'hit' ? 1 : 0,
      misses: kind === 'miss' ? 1 : 0,
      tokens_saved_input: kind === 'hit' ? tokensInput : 0,
      tokens_saved_output: kind === 'hit' ? tokensOutput : 0,
    } as Record<string, unknown>);
  } else {
    await supabase
      .from('ai_cache_stats')
      .update({
        hits: (existing as any).hits + (kind === 'hit' ? 1 : 0),
        misses: (existing as any).misses + (kind === 'miss' ? 1 : 0),
        tokens_saved_input: Number((existing as any).tokens_saved_input) + (kind === 'hit' ? tokensInput : 0),
        tokens_saved_output: Number((existing as any).tokens_saved_output) + (kind === 'hit' ? tokensOutput : 0),
      } as Record<string, unknown>)
      .eq('id', (existing as any).id);
  }
}

export async function clearExpiredCache(): Promise<number> {
  const supabase = getAdminClient();
  const { data } = await supabase.rpc('cleanup_expired_ai_cache');
  return typeof data === 'number' ? data : 0;
}

export async function clearAllCache(contextType?: CacheContext): Promise<void> {
  const supabase = getAdminClient();
  if (contextType) {
    await supabase.from('ai_response_cache').delete().eq('context_type', contextType);
  } else {
    await supabase.from('ai_response_cache').delete().gt('created_at', '1900-01-01');
  }
}

export { normalizeQuery, isCacheable, hasPersonalData } from './normalize';
