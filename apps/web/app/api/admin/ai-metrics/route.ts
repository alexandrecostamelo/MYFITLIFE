import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = await isPlatformAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const days = parseInt(req.nextUrl.searchParams.get('days') || '7');
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: metrics } = await supabase
    .from('ai_usage_metrics')
    .select('*')
    .gte('created_at', since);

  const all = metrics || [];

  const byFeature: Record<string, any> = {};
  all.forEach((m: any) => {
    if (!byFeature[m.feature]) {
      byFeature[m.feature] = {
        feature: m.feature,
        calls: 0,
        cache_hits: 0,
        fallback_used: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        _latencies: [] as number[],
      };
    }
    const b = byFeature[m.feature];
    b.calls += 1;
    if (m.cache_hit) b.cache_hits += 1;
    if (m.fallback_used) b.fallback_used += 1;
    b.input_tokens += m.input_tokens;
    b.output_tokens += m.output_tokens;
    b.cost_usd += Number(m.cost_estimate_usd || 0);
    if (m.latency_ms) b._latencies.push(m.latency_ms);
  });

  Object.values(byFeature).forEach((b: any) => {
    b.avg_latency_ms = b._latencies.length > 0
      ? Math.round(b._latencies.reduce((a: number, x: number) => a + x, 0) / b._latencies.length)
      : 0;
    b.cache_hit_rate = b.calls > 0 ? Math.round((b.cache_hits / b.calls) * 100) : 0;
    b.cost_usd = Math.round(b.cost_usd * 1000) / 1000;
    delete b._latencies;
  });

  const totalCost = all.reduce((acc: number, m: any) => acc + Number(m.cost_estimate_usd || 0), 0);
  const totalCalls = all.length;
  const totalCacheHits = all.filter((m: any) => m.cache_hit).length;

  const { data: cacheStats } = await supabase
    .from('ai_response_cache')
    .select('feature, hit_count')
    .gt('expires_at', new Date().toISOString());

  const cacheByFeature: Record<string, { entries: number; total_hits: number }> = {};
  (cacheStats || []).forEach((c: any) => {
    if (!cacheByFeature[c.feature]) cacheByFeature[c.feature] = { entries: 0, total_hits: 0 };
    cacheByFeature[c.feature].entries += 1;
    cacheByFeature[c.feature].total_hits += c.hit_count;
  });

  return NextResponse.json({
    summary: {
      days,
      total_calls: totalCalls,
      total_cost_usd: Math.round(totalCost * 1000) / 1000,
      total_cache_hits: totalCacheHits,
      cache_hit_rate_pct: totalCalls > 0 ? Math.round((totalCacheHits / totalCalls) * 100) : 0,
    },
    by_feature: Object.values(byFeature).sort((a: any, b: any) => b.cost_usd - a.cost_usd),
    cache_stats: cacheByFeature,
  });
}
