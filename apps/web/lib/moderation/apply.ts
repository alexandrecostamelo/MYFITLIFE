import { createClient } from '@supabase/supabase-js';
import { moderateText, type AppliedModeration } from '@/lib/moderation';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function applyTextModeration(
  text: string,
  authorId: string,
  context?: string,
): Promise<AppliedModeration> {
  const supa = admin();

  const { data: state } = await supa
    .from('user_moderation_state')
    .select('is_banned, banned_until, shadowban, trust_score')
    .eq('user_id', authorId)
    .maybeSingle();

  if (state?.is_banned && (!state.banned_until || new Date(state.banned_until) > new Date())) {
    return { decision: 'rejected', reason: 'Usuário banido', categories: ['user_banned'], score: 1 };
  }

  const result = await moderateText(text, context);

  if (state?.shadowban) {
    return {
      decision: 'pending_review',
      reason: 'Shadowban ativo',
      categories: ['shadowban', ...result.categories],
      score: result.score,
    };
  }

  // Adjust score by trust: lower trust = higher effective score
  const trust = state?.trust_score ?? 1.0;
  const adjustedScore = result.score * (2 - Number(trust));

  if (adjustedScore >= 0.8 && result.decision !== 'rejected') {
    return { ...result, decision: 'rejected' };
  }
  if (adjustedScore >= 0.4 && result.decision === 'approved') {
    return { ...result, decision: 'pending_review' };
  }

  return result;
}

export async function logModerationAction(
  moderatorId: string | null,
  contentType: string,
  contentId: string,
  authorId: string,
  action: 'approve' | 'remove' | 'warn_author' | 'ban_author' | 'dismiss_report',
  reason: string,
  source: 'ai_auto' | 'human' | 'user_report_confirmed',
): Promise<void> {
  const supa = admin();
  await supa.from('moderation_actions').insert({
    moderator_id: moderatorId,
    content_type: contentType,
    content_id: contentId,
    author_id: authorId,
    action,
    reason,
    source,
  } as Record<string, unknown>);
}

export async function warnUser(userId: string, reason: string): Promise<void> {
  const supa = admin();
  const { data: existing } = await supa
    .from('user_moderation_state')
    .select('warnings_count, trust_score')
    .eq('user_id', userId)
    .maybeSingle();

  const newWarnings = (existing?.warnings_count || 0) + 1;
  const newTrust = Math.max(0.3, Number(existing?.trust_score || 1.0) - 0.15);
  const shouldBan = newWarnings >= 3;

  await supa.from('user_moderation_state').upsert(
    {
      user_id: userId,
      warnings_count: newWarnings,
      last_warning_at: new Date().toISOString(),
      trust_score: newTrust,
      is_banned: shouldBan,
      banned_until: shouldBan ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() : null,
      ban_reason: shouldBan ? `Acumulou ${newWarnings} avisos: ${reason}` : null,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>,
    { onConflict: 'user_id' },
  );
}

export async function banUser(userId: string, reason: string, durationDays?: number): Promise<void> {
  const supa = admin();
  const until = durationDays
    ? new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString()
    : null;

  await supa.from('user_moderation_state').upsert(
    {
      user_id: userId,
      is_banned: true,
      banned_until: until,
      ban_reason: reason,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>,
    { onConflict: 'user_id' },
  );
}
