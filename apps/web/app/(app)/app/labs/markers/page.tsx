'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type MarkerSummary = {
  key: string;
  name: string;
  unit: string;
  latest: { value: number; measured_at: string; status: string | null };
  history: { value: number; measured_at: string }[];
  trend: 'up' | 'down' | 'flat';
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'border-green-300 bg-green-50 text-green-700' },
  low: { label: 'Baixo', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  high: { label: 'Alto', cls: 'border-amber-300 bg-amber-50 text-amber-700' },
  critical_low: { label: 'Crítico', cls: 'border-red-400 bg-red-50 text-red-700' },
  critical_high: { label: 'Crítico', cls: 'border-red-400 bg-red-50 text-red-700' },
};

function MiniBar({ value, history }: { value: number; history: { value: number }[] }) {
  if (history.length < 2) return null;
  const vals = [...history].reverse().map((h) => h.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  return (
    <div className="flex h-8 items-end gap-0.5">
      {vals.slice(-8).map((v, i) => {
        const h = Math.max(4, Math.round(((v - min) / range) * 28));
        const isCurrent = i === vals.slice(-8).length - 1;
        return (
          <div key={i} className={`w-3 rounded-sm ${isCurrent ? 'bg-primary' : 'bg-gray-200'}`} style={{ height: `${h}px` }} />
        );
      })}
    </div>
  );
}

export default function MarkersPage() {
  const [markers, setMarkers] = useState<MarkerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/biomarkers')
      .then((r) => r.json())
      .then((d) => setMarkers(d.markers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Biomarcadores</h1>
        <Link href="/app/labs" className="text-sm text-primary underline">← Exames</Link>
      </div>

      {markers.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum biomarcador ainda. Envie um exame para começar.
        </p>
      )}

      <div className="space-y-3">
        {markers.map((m) => {
          const badge = m.latest.status ? STATUS_BADGE[m.latest.status] : null;
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
          const trendColor = m.trend === 'up' ? 'text-red-500' : m.trend === 'down' ? 'text-blue-500' : 'text-gray-400';

          return (
            <Card key={m.key} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.name}</span>
                    {badge && <span className={`rounded border px-1.5 py-0.5 text-xs ${badge.cls}`}>{badge.label}</span>}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{m.latest.value}</span>
                    <span className="text-xs text-muted-foreground">{m.unit}</span>
                    <TrendIcon className={`ml-1 h-4 w-4 ${trendColor}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.history.length} medição(ões) · último: {m.latest.measured_at}
                  </p>
                </div>
                <MiniBar value={m.latest.value} history={m.history} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
