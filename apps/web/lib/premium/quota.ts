import { createClient as createAdmin } from '@supabase/supabase-js';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export type Specialty = 'nutrition' | 'training' | 'physio';

export async function getCurrentQuota(userId: string) {
  const supa = admin();
  const { data } = await supa.rpc('get_or_create_current_quota', { p_user_id: userId });
  return data as Record<string, unknown> | null;
}

export async function canUseSession(
  userId: string,
  specialty: Specialty,
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const quota = await getCurrentQuota(userId);
  if (!quota) return { allowed: false, remaining: 0, reason: 'no_quota' };

  const used = (quota[`${specialty}_sessions_used`] as number) || 0;
  const total = (quota[`${specialty}_sessions_total`] as number) || 0;

  return {
    allowed: used < total,
    remaining: Math.max(0, total - used),
    reason: used >= total ? 'quota_exceeded' : undefined,
  };
}

export async function consumeSession(
  userId: string,
  specialty: Specialty,
  appointmentId: string,
): Promise<boolean> {
  const supa = admin();
  const quota = await getCurrentQuota(userId);
  if (!quota) return false;

  const field = `${specialty}_sessions_used`;
  const current = (quota[field] as number) || 0;
  const total = (quota[`${specialty}_sessions_total`] as number) || 0;
  if (current >= total) return false;

  const { error } = await supa
    .from('premium_quotas')
    .update({ [field]: current + 1, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', quota.id as string);

  if (error) return false;

  await supa
    .from('appointments')
    .update({ is_premium_included: true, premium_quota_id: quota.id } as Record<string, unknown>)
    .eq('id', appointmentId);

  return true;
}

export async function refundSession(userId: string, specialty: Specialty): Promise<void> {
  const supa = admin();
  const quota = await getCurrentQuota(userId);
  if (!quota) return;

  const field = `${specialty}_sessions_used`;
  const current = (quota[field] as number) || 0;
  if (current <= 0) return;

  await supa
    .from('premium_quotas')
    .update({ [field]: current - 1, updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', quota.id as string);
}

export async function isPremium(userId: string): Promise<boolean> {
  const supa = admin();
  const { data } = await supa
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();

  const rec = data as Record<string, unknown> | null;
  return rec?.subscription_tier === 'premium';
}
