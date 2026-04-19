import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  RATE_LIMITS,
  IP_LIMITS,
  SUSPICIOUS_THRESHOLDS,
  type Tier,
  type RateLimitedEndpoint,
  type RateLimitRule,
} from './config';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  reason?: string;
}

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function countCalls(
  supabase: SupabaseClient,
  field: 'user_id' | 'ip_address',
  value: string,
  endpoint: RateLimitedEndpoint,
  sinceSeconds: number
): Promise<number> {
  const since = new Date(Date.now() - sinceSeconds * 1000).toISOString();
  const { count } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq(field, value)
    .eq('endpoint', endpoint)
    .eq('blocked', false)
    .gte('created_at', since);
  return count || 0;
}

async function isBlocked(
  supabase: SupabaseClient,
  userId: string | null,
  ip: string | null
): Promise<{ blocked: boolean; until?: Date; reason?: string }> {
  const now = new Date().toISOString();

  if (userId) {
    const { data } = await supabase
      .from('ai_rate_blocks')
      .select('blocked_until, reason')
      .eq('user_id', userId)
      .gt('blocked_until', now)
      .order('blocked_until', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      return { blocked: true, until: new Date(data.blocked_until), reason: data.reason };
    }
  }

  if (ip) {
    const { data } = await supabase
      .from('ai_rate_blocks')
      .select('blocked_until, reason')
      .eq('ip_address', ip)
      .gt('blocked_until', now)
      .order('blocked_until', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      return { blocked: true, until: new Date(data.blocked_until), reason: data.reason };
    }
  }

  return { blocked: false };
}

async function addBlock(
  supabase: SupabaseClient,
  userId: string | null,
  ip: string | null,
  reason: string,
  durationMinutes: number
): Promise<void> {
  const until = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  await supabase.from('ai_rate_blocks').insert({
    user_id: userId,
    ip_address: ip,
    reason,
    blocked_until: until,
  } as Record<string, unknown>);
}

async function logCall(
  supabase: SupabaseClient,
  userId: string | null,
  ip: string | null,
  endpoint: RateLimitedEndpoint,
  tier: Tier,
  blocked: boolean,
  blockReason?: string
): Promise<void> {
  await supabase.from('ai_usage_log').insert({
    user_id: userId,
    ip_address: ip,
    endpoint,
    tier,
    blocked,
    block_reason: blockReason,
  } as Record<string, unknown>);
}

function nextResetAt(sinceSeconds: number): Date {
  return new Date(Date.now() + sinceSeconds * 1000);
}

export async function checkRateLimit(params: {
  userId: string | null;
  ip: string | null;
  endpoint: RateLimitedEndpoint;
  tier: Tier;
}): Promise<RateLimitResult> {
  const supabase = admin();
  const { userId, ip, endpoint, tier } = params;

  // Check existing blocks
  const blockCheck = await isBlocked(supabase, userId, ip);
  if (blockCheck.blocked) {
    const retryAfter = Math.max(1, Math.ceil((blockCheck.until!.getTime() - Date.now()) / 1000));
    await logCall(supabase, userId, ip, endpoint, tier, true, blockCheck.reason);
    return {
      allowed: false,
      retryAfter,
      limit: 0,
      remaining: 0,
      resetAt: blockCheck.until!,
      reason: `blocked:${blockCheck.reason}`,
    };
  }

  const userRule: RateLimitRule = userId
    ? RATE_LIMITS[endpoint][tier]
    : { perMinute: 0, perHour: 0, perDay: 0 };

  // User-based rate limiting
  if (userId) {
    const perMin = await countCalls(supabase, 'user_id', userId, endpoint, 60);

    // Suspicious pattern detection
    if (perMin >= SUSPICIOUS_THRESHOLDS.callsPerMinuteToTriggerBlock) {
      await addBlock(
        supabase,
        userId,
        ip,
        `Suspicious activity: ${perMin} calls in last minute on ${endpoint}`,
        SUSPICIOUS_THRESHOLDS.blockDurationMinutes
      );
      await logCall(supabase, userId, ip, endpoint, tier, true, 'suspicious_pattern');
      return {
        allowed: false,
        retryAfter: SUSPICIOUS_THRESHOLDS.blockDurationMinutes * 60,
        limit: userRule.perMinute,
        remaining: 0,
        resetAt: new Date(Date.now() + SUSPICIOUS_THRESHOLDS.blockDurationMinutes * 60 * 1000),
        reason: 'suspicious_pattern',
      };
    }

    if (perMin >= userRule.perMinute) {
      await logCall(supabase, userId, ip, endpoint, tier, true, 'per_minute_exceeded');
      return {
        allowed: false,
        retryAfter: 60,
        limit: userRule.perMinute,
        remaining: 0,
        resetAt: nextResetAt(60),
        reason: 'per_minute_exceeded',
      };
    }

    const perHour = await countCalls(supabase, 'user_id', userId, endpoint, 3600);
    if (perHour >= userRule.perHour) {
      await logCall(supabase, userId, ip, endpoint, tier, true, 'per_hour_exceeded');
      return {
        allowed: false,
        retryAfter: 3600,
        limit: userRule.perHour,
        remaining: 0,
        resetAt: nextResetAt(3600),
        reason: 'per_hour_exceeded',
      };
    }

    const perDay = await countCalls(supabase, 'user_id', userId, endpoint, 86400);
    if (perDay >= userRule.perDay) {
      await logCall(supabase, userId, ip, endpoint, tier, true, 'per_day_exceeded');
      return {
        allowed: false,
        retryAfter: 86400,
        limit: userRule.perDay,
        remaining: 0,
        resetAt: nextResetAt(86400),
        reason: 'per_day_exceeded',
      };
    }
  }

  // IP-based rate limiting
  if (ip) {
    const ipRule = IP_LIMITS[endpoint];
    const ipPerMin = await countCalls(supabase, 'ip_address', ip, endpoint, 60);
    if (ipPerMin >= ipRule.perMinute) {
      await logCall(supabase, userId, ip, endpoint, tier, true, 'ip_per_minute_exceeded');
      return {
        allowed: false,
        retryAfter: 60,
        limit: ipRule.perMinute,
        remaining: 0,
        resetAt: nextResetAt(60),
        reason: 'ip_per_minute_exceeded',
      };
    }
  }

  // Allowed
  await logCall(supabase, userId, ip, endpoint, tier, false);
  const currentPerMin = userId
    ? await countCalls(supabase, 'user_id', userId, endpoint, 60)
    : 0;
  return {
    allowed: true,
    limit: userRule.perMinute,
    remaining: Math.max(0, userRule.perMinute - currentPerMin),
    resetAt: nextResetAt(60),
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const h: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
  };
  if (result.retryAfter) {
    h['Retry-After'] = String(result.retryAfter);
  }
  return h;
}
