'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Loader2, Database } from 'lucide-react';

interface Stat {
  day: string;
  context_type: string;
  hits: number;
  misses: number;
  tokens_saved_input: number;
  tokens_saved_output: number;
}

interface Entry {
  normalized_query: string;
  context_type: string;
  hit_count: number;
  tokens_input: number | null;
  tokens_output: number | null;
  last_hit_at: string | null;
}

export function CacheAdminClient({
  stats,
  topEntries,
  totalEntries,
}: {
  stats: Stat[];
  topEntries: Entry[];
  totalEntries: number;
}) {
  const [clearing, setClearing] = useState(false);

  const totals = useMemo(() => {
    const totalHits = stats.reduce((acc, s) => acc + s.hits, 0);
    const totalMisses = stats.reduce((acc, s) => acc + s.misses, 0);
    const tokensSavedIn = stats.reduce((acc, s) => acc + Number(s.tokens_saved_input || 0), 0);
    const tokensSavedOut = stats.reduce((acc, s) => acc + Number(s.tokens_saved_output || 0), 0);
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;
    const estimatedSavings = tokensSavedIn * 0.000003 + tokensSavedOut * 0.000015;
    return { totalHits, totalMisses, hitRate, tokensSavedIn, tokensSavedOut, estimatedSavings };
  }, [stats]);

  const handleClear = async () => {
    if (!confirm('Apagar TODO o cache de IA? Essa ação é irreversível.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/admin/ai-cache/clear', { method: 'POST' });
      if (res.ok) location.reload();
    } finally {
      setClearing(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app/gym-admin" className="rounded p-2 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Database className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Cache de IA</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClear} disabled={clearing}>
          {clearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Limpar tudo
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total no cache" value={totalEntries.toLocaleString('pt-BR')} />
        <StatCard label="Hit rate (30d)" value={`${totals.hitRate.toFixed(1)}%`} accent />
        <StatCard label="Hits (30d)" value={totals.totalHits.toLocaleString('pt-BR')} />
        <StatCard label="Economia est." value={`$${totals.estimatedSavings.toFixed(2)}`} accent />
      </div>

      <section>
        <h2 className="font-semibold mb-3">Top 30 queries mais cacheadas</h2>
        <Card className="divide-y">
          {topEntries.map((e, i) => (
            <div key={i} className="p-3 flex items-start gap-3">
              <span className="text-xs font-mono text-slate-400 w-6 flex-shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{e.normalized_query}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {e.last_hit_at ? new Date(e.last_hit_at).toLocaleString('pt-BR') : 'nunca usado'}
                </p>
              </div>
              <span className="text-xs rounded bg-slate-100 px-2 py-0.5">{e.context_type}</span>
              <span className="text-xs font-semibold rounded bg-primary/10 text-primary px-2 py-0.5">
                {e.hit_count} hits
              </span>
            </div>
          ))}
          {topEntries.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">Cache vazio</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Estatísticas por dia</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left p-2">Dia</th>
                <th className="text-left p-2">Contexto</th>
                <th className="text-right p-2">Hits</th>
                <th className="text-right p-2">Misses</th>
                <th className="text-right p-2">Hit rate</th>
                <th className="text-right p-2">Tokens poupados</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => {
                const total = s.hits + s.misses;
                const rate = total > 0 ? (s.hits / total) * 100 : 0;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-mono text-xs">{s.day}</td>
                    <td className="p-2">
                      <span className="text-xs rounded bg-slate-100 px-2 py-0.5">{s.context_type}</span>
                    </td>
                    <td className="p-2 text-right">{s.hits}</td>
                    <td className="p-2 text-right text-slate-400">{s.misses}</td>
                    <td className="p-2 text-right font-semibold">{rate.toFixed(1)}%</td>
                    <td className="p-2 text-right text-xs">
                      {(Number(s.tokens_saved_input) + Number(s.tokens_saved_output)).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-sm text-slate-400">Sem dados ainda</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-3 ${accent ? 'bg-primary/5 border-primary/30' : ''}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-primary' : ''}`}>{value}</p>
    </Card>
  );
}
