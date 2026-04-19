'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shield, Zap, DollarSign, Gauge } from 'lucide-react';

export default function AdminAIMetricsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/ai-metrics?days=${days}`);
    if (!res.ok) { setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Métricas de IA</h1>
      </header>

      <Card className="mb-4 p-2">
        <div className="grid grid-cols-6 gap-1">
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/claims">Claims</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/professionals">Pros</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/reports">Denúncias</Link></Button>
          <Button asChild variant="default" size="sm"><Link href="/app/admin/ai-metrics">IA</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/feature-flags">Flags</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/app/admin/exercises">Vídeos</Link></Button>
        </div>
      </Card>

      <div className="mb-4 flex gap-2">
        {[1, 7, 30].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`flex-1 rounded-md border px-3 py-1.5 text-xs ${days === d ? 'border-primary bg-primary/10' : 'border-input'}`}>
            {d === 1 ? 'Hoje' : `${d} dias`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !data ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">Sem acesso ou dados.</Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Card className="p-3">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Chamadas</span></div>
              <div className="mt-1 text-2xl font-bold">{data.summary.total_calls}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Custo total</span></div>
              <div className="mt-1 text-2xl font-bold">${Number(data.summary.total_cost_usd).toFixed(2)}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Cache hits</span></div>
              <div className="mt-1 text-2xl font-bold">{data.summary.total_cache_hits}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Cache rate</span></div>
              <div className="mt-1 text-2xl font-bold">{data.summary.cache_hit_rate_pct}%</div>
            </Card>
          </div>

          <Card className="mb-4 p-4">
            <h2 className="mb-3 text-sm font-medium">Por feature</h2>
            <div className="space-y-2">
              {data.by_feature.map((f: any) => (
                <div key={f.feature} className="rounded border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{f.feature}</span>
                    <span className="text-xs font-bold">${Number(f.cost_usd).toFixed(3)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <span>{f.calls} chamadas</span>
                    <span>{f.input_tokens.toLocaleString()} in</span>
                    <span>{f.output_tokens.toLocaleString()} out</span>
                    <span>{f.avg_latency_ms}ms</span>
                  </div>
                  <div className="mt-1 flex gap-2 text-xs">
                    {f.cache_hit_rate > 0 && <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-800">{f.cache_hit_rate}% cache</span>}
                    {f.fallback_used > 0 && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">{f.fallback_used} fallback</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-medium">Cache atual</h2>
            {Object.keys(data.cache_stats).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum cache ativo.</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(data.cache_stats).map(([feature, s]: any) => (
                  <div key={feature} className="flex items-center justify-between text-sm">
                    <span>{feature}</span>
                    <span className="text-xs text-muted-foreground">{s.entries} entradas · {s.total_hits} hits totais</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
