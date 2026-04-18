'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BodyMap } from '@/components/body-map';
import { ArrowLeft, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

type HeatmapData = {
  heatmap: Record<string, number>;
  top_muscles: Array<{ region: string; label: string; sets: number }>;
  underworked: Array<{ region: string; label: string }>;
  total_sets: number;
  days: number;
};

export default function MuscleHeatmapPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  async function load(d: number) {
    setLoading(true);
    const res = await fetch(`/api/insights/muscle-heatmap?days=${d}`);
    const result = await res.json();
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(days); }, [days]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Músculos trabalhados</h1>
      </header>

      <Card className="mb-4 p-3">
        <div className="flex gap-2">
          <Button variant={days === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDays(7)} className="flex-1">
            7 dias
          </Button>
          <Button variant={days === 14 ? 'default' : 'outline'} size="sm" onClick={() => setDays(14)} className="flex-1">
            14 dias
          </Button>
          <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)} className="flex-1">
            30 dias
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !data || data.total_sets === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum treino registrado nos últimos {days} dias. Comece a registrar séries para ver o heatmap.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mb-4 p-4">
            <h2 className="mb-1 text-sm font-medium">Distribuição muscular</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {data.total_sets} séries registradas nos últimos {data.days} dias
            </p>
            <BodyMap value={[]} onChange={() => {}} readOnly heatmap={data.heatmap} />
          </Card>

          {data.top_muscles.length > 0 && (
            <Card className="mb-4 p-4">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-medium">Mais trabalhados</h2>
              </div>
              <div className="space-y-2">
                {data.top_muscles.map((m, i) => (
                  <div key={m.region} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{i + 1}. {m.label}</span>
                    <span className="font-medium">{m.sets} séries</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.underworked.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-medium text-amber-900">Pouco trabalhados</h2>
              </div>
              <p className="mb-2 text-xs text-amber-800">
                Grupos musculares grandes com pouca estimulação. Considere incluir no próximo treino:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.underworked.map((m) => (
                  <span key={m.region} className="rounded bg-white px-2 py-1 text-xs">
                    {m.label}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </main>
  );
}
