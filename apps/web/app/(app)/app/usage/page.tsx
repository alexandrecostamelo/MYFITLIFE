'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Zap } from 'lucide-react';

const LABELS: Record<string, string> = {
  coach_message: 'Mensagens do coach',
  coach_stream: 'Conversas com coach',
  food_vision: 'Reconhecimento de alimentos',
  equipment_scan: 'Reconhecimento de aparelhos',
  adaptive_workout: 'Treinos adaptativos',
  shopping_list: 'Listas de compras',
  food_substitution: 'Substituições de alimentos',
  lab_extraction: 'Análise de exames',
  daily_quests: 'Quests diárias',
  moderation_text: 'Moderação de texto',
  proactive_check: 'Coach proativo',
  autopilot: 'Autopilot',
};

export default function UsagePage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/ai-usage').then((r) => r.json()).then((d) => {
      setUsage(d.usage || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const sorted = [...usage].sort((a, b) => b.used - a.used);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/profile" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Uso de IA</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="h-4 w-4" />
          Seus limites diários de uso das features de IA
        </div>
      </Card>

      <div className="space-y-2">
        {sorted.map((u) => {
          const pct = u.max > 0 ? Math.round((u.used / u.max) * 100) : 0;
          const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary';
          return (
            <Card key={u.bucket} className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{LABELS[u.bucket] || u.bucket}</span>
                <span className="text-xs text-muted-foreground">{u.used}/{u.max}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Limites resetam a cada 24 horas. Os limites existem pra manter o app sustentável.
      </p>
    </main>
  );
}
