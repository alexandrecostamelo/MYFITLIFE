import { callWithRetry, estimateCost, type CallResult } from '@myfitlife/ai/client';
import { createClient } from '@/lib/supabase/server';
import { getCachedResponse, setCachedResponse, buildCacheKey } from './ai-cache';

type Options = {
  feature: string;
  userId: string;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: any }>;
  max_tokens: number;
  temperature?: number;
  cache_input?: string;
  cache_ttl_minutes?: number;
};

export async function callAI(opts: Options): Promise<CallResult & { cached: boolean }> {
  const supabase = await createClient();

  if (opts.cache_input) {
    const cacheKey = buildCacheKey(opts.feature, opts.cache_input);
    const cached = await getCachedResponse(supabase, cacheKey);
    if (cached) {
      await supabase.from('ai_usage_metrics').insert({
        user_id: opts.userId,
        feature: opts.feature,
        model: 'cache',
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        cost_estimate_usd: 0,
        cache_hit: true,
      });
      return {
        text: cached,
        model_used: 'cache',
        input_tokens: 0,
        output_tokens: 0,
        latency_ms: 0,
        fallback_used: false,
        cached: true,
      };
    }
  }

  const result = await callWithRetry({
    max_tokens: opts.max_tokens,
    system: opts.system,
    messages: opts.messages,
    temperature: opts.temperature,
  });

  const cost = estimateCost(result.model_used, result.input_tokens, result.output_tokens);

  await supabase.from('ai_usage_metrics').insert({
    user_id: opts.userId,
    feature: opts.feature,
    model: result.model_used,
    input_tokens: result.input_tokens,
    output_tokens: result.output_tokens,
    cached_tokens: 0,
    cost_estimate_usd: cost,
    latency_ms: result.latency_ms,
    cache_hit: false,
    fallback_used: result.fallback_used,
  });

  if (opts.cache_input) {
    const cacheKey = buildCacheKey(opts.feature, opts.cache_input);
    await setCachedResponse(supabase, cacheKey, opts.feature, result.text, opts.cache_ttl_minutes);
  }

  return { ...result, cached: false };
}
