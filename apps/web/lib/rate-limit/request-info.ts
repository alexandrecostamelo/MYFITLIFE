import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tier } from './config';

export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}

export async function getUserAndTier(req?: NextRequest): Promise<{
  userId: string | null;
  tier: Tier;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, tier: 'free' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  let tier: Tier = 'free';
  if (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing') {
    const sub = profile?.subscription_tier as string | null;
    if (sub === 'premium') tier = 'premium';
    else if (sub === 'pro') tier = 'pro';
  }
  return { userId: user.id, tier };
}
