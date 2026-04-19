import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CacheAdminClient } from './cache-admin-client';

export const dynamic = 'force-dynamic';

export default async function AiCachePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && profile?.role !== 'admin') redirect('/app');

  const { data: stats } = await supabase
    .from('ai_cache_stats')
    .select('*')
    .gte('day', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10))
    .order('day', { ascending: false });

  const { data: topEntries } = await supabase
    .from('ai_response_cache')
    .select('normalized_query, context_type, hit_count, tokens_input, tokens_output, last_hit_at')
    .order('hit_count', { ascending: false })
    .limit(30);

  const { count: totalEntries } = await supabase
    .from('ai_response_cache')
    .select('*', { count: 'exact', head: true });

  return (
    <CacheAdminClient
      stats={stats || []}
      topEntries={topEntries || []}
      totalEntries={totalEntries || 0}
    />
  );
}
