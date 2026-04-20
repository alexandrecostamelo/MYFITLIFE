import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { ModerationClient } from './moderation-client';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) redirect('/app/dashboard');

  const [pendingRes, reportsRes, actionsRes] = await Promise.all([
    supabase
      .from('community_posts')
      .select('id, content, photo_path, created_at, moderation_reason, moderation_categories, ai_moderation_score, author_id, group_id')
      .in('moderation_status', ['pending_review', 'flagged'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('content_reports')
      .select('id, target_type, target_id, reason, details, created_at, status, reporter_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('moderation_actions')
      .select('action, source, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
  ]);

  const pending = pendingRes.data || [];
  const reports = reportsRes.data || [];

  // Enrich with author profiles
  const authorIds = Array.from(new Set([
    ...pending.map((p: any) => p.author_id),
    ...reports.map((r: any) => r.reporter_id),
  ].filter(Boolean)));

  const { data: profiles } = authorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', authorIds)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const enrichedPending = pending.map((p: any) => ({
    ...p,
    author: profMap.get(p.author_id) || { full_name: 'Usuário' },
  }));

  const enrichedReports = reports.map((r: any) => ({
    ...r,
    reporter: profMap.get(r.reporter_id) || { full_name: 'Usuário' },
  }));

  const stats = (actionsRes.data || []).reduce(
    (acc: any, a: any) => {
      acc.total++;
      if (a.source === 'ai_auto') acc.aiAuto++;
      if (a.source === 'human') acc.human++;
      if (a.action === 'remove') acc.removed++;
      return acc;
    },
    { total: 0, aiAuto: 0, human: 0, removed: 0 },
  );

  return (
    <ModerationClient
      pending={enrichedPending}
      reports={enrichedReports}
      stats={stats}
    />
  );
}
