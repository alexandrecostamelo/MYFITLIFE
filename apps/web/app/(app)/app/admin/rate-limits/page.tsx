import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RateLimitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin && profile?.role !== 'admin') redirect('/app');

  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // Top consumers (24h)
  const { data: usageRows } = await supabase
    .from('ai_usage_log')
    .select('user_id, endpoint, tier')
    .gte('created_at', since24h)
    .eq('blocked', false)
    .not('user_id', 'is', null)
    .limit(5000);

  const userAgg: Record<string, { user_id: string; calls: number; tier: string }> = {};
  for (const row of usageRows || []) {
    const key = row.user_id!;
    if (!userAgg[key]) userAgg[key] = { user_id: key, calls: 0, tier: String(row.tier) };
    userAgg[key].calls++;
  }
  const topList = Object.values(userAgg)
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 30);

  const { data: profiles } = topList.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', topList.map((u) => u.user_id))
    : { data: [] };
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  // Active blocks
  const { data: activeBlocks } = await supabase
    .from('ai_rate_blocks')
    .select('user_id, ip_address, reason, blocked_until, created_at')
    .gt('blocked_until', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(30);

  // Recent 429s
  const { data: blockedRecent } = await supabase
    .from('ai_usage_log')
    .select('user_id, ip_address, endpoint, block_reason, created_at')
    .eq('blocked', true)
    .gte('created_at', since24h)
    .order('created_at', { ascending: false })
    .limit(50);

  // Totals
  const { count: totalCalls24h } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since24h)
    .eq('blocked', false);

  const { count: totalBlocked24h } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since24h)
    .eq('blocked', true);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header className="flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Rate Limits</h1>
        <span className="text-sm text-slate-400 ml-auto">Últimas 24h</span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500">Calls (24h)</p>
          <p className="text-2xl font-bold mt-1">{(totalCalls24h || 0).toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-xs text-red-600">Bloqueados (24h)</p>
          <p className="text-2xl font-bold mt-1 text-red-700">{(totalBlocked24h || 0).toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500">Users únicos</p>
          <p className="text-2xl font-bold mt-1">{Object.keys(userAgg).length}</p>
        </Card>
        <Card className="p-3 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-yellow-700">Bloqueios ativos</p>
          <p className="text-2xl font-bold mt-1 text-yellow-800">{activeBlocks?.length || 0}</p>
        </Card>
      </div>

      <section>
        <h2 className="font-semibold mb-3">Top 30 consumidores</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-right p-2">Calls</th>
              </tr>
            </thead>
            <tbody>
              {topList.map((u, i) => {
                const p: any = profileMap.get(u.user_id);
                return (
                  <tr key={u.user_id} className="border-t">
                    <td className="p-2 font-mono text-xs">{i + 1}</td>
                    <td className="p-2">{p?.username || p?.full_name || u.user_id.slice(0, 8)}</td>
                    <td className="p-2">
                      <span className="text-xs rounded bg-slate-100 px-2 py-0.5">{u.tier}</span>
                    </td>
                    <td className="p-2 text-right font-semibold">{u.calls}</td>
                  </tr>
                );
              })}
              {topList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-sm text-slate-400">Sem dados</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Bloqueios ativos ({activeBlocks?.length || 0})</h2>
        <Card className="divide-y">
          {(activeBlocks || []).map((b: any, i: number) => (
            <div key={i} className="p-3 flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {b.user_id ? `user:${String(b.user_id).slice(0, 8)}` : `ip:${String(b.ip_address)}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{String(b.reason)}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Até: {new Date(b.blocked_until).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
          {(activeBlocks || []).length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">Nenhum bloqueio ativo</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Últimos 429 (50)</h2>
        <Card className="divide-y max-h-96 overflow-y-auto">
          {(blockedRecent || []).map((r: any, i: number) => (
            <div key={i} className="p-2 text-xs flex items-center justify-between gap-2">
              <span className="font-mono truncate max-w-[80px]">
                {r.user_id ? String(r.user_id).slice(0, 8) : String(r.ip_address)}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5">{String(r.endpoint)}</span>
              <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.5">{String(r.block_reason)}</span>
              <span className="text-slate-400 whitespace-nowrap">
                {new Date(r.created_at).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          ))}
          {(blockedRecent || []).length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">Nenhum 429 recente</p>
          )}
        </Card>
      </section>
    </main>
  );
}
