import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, rateLimitHeaders } from './index';
import { getClientIp, getUserAndTier } from './request-info';
import type { RateLimitedEndpoint } from './config';
import type { Tier } from './config';

const MESSAGES: Record<string, string> = {
  per_minute_exceeded: 'Muitas solicitações por minuto. Aguarde um pouco.',
  per_hour_exceeded: 'Limite de uso por hora atingido.',
  per_day_exceeded: 'Limite diário atingido. Considere fazer upgrade pra Pro.',
  ip_per_minute_exceeded: 'Muitas solicitações desse dispositivo. Aguarde um pouco.',
  suspicious_pattern: 'Atividade suspeita detectada. Acesso temporariamente bloqueado.',
};

export interface RateLimitPassResult {
  userId: string | null;
  tier: Tier;
}

export async function enforceRateLimit(
  req: NextRequest,
  endpoint: RateLimitedEndpoint
): Promise<NextResponse | RateLimitPassResult> {
  const ip = getClientIp(req);
  const { userId, tier } = await getUserAndTier();

  const result = await checkRateLimit({ userId, ip, endpoint, tier });

  if (!result.allowed) {
    const reason = result.reason || '';
    const baseReason = reason.startsWith('blocked:') ? reason.split(':').slice(1).join(':') : reason;
    const msg = MESSAGES[baseReason] || MESSAGES[reason] || 'Limite de requisições atingido.';
    const upgradeMsg =
      tier === 'free' && reason.includes('per_day')
        ? ' Faça upgrade para Pro em /app/billing.'
        : '';
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: msg + upgradeMsg,
        retry_after_seconds: result.retryAfter,
        tier,
      },
      {
        status: 429,
        headers: rateLimitHeaders(result),
      }
    );
  }

  return { userId, tier };
}
