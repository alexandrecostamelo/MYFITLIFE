'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE = [
  { id: 'streak', label: 'Streak', desc: 'Dias consecutivos treinando', icon: '\u{1F525}' },
  { id: 'sessions', label: 'Sessões do mês', desc: 'Treinos completos este mês', icon: '\u{1F4AA}' },
  { id: 'minutes', label: 'Minutos hoje', desc: 'Tempo total treinando hoje', icon: '\u23F1' },
  { id: 'calories', label: 'Calorias hoje', desc: 'Kcal ativas queimadas', icon: '\u{1F525}' },
  { id: 'weight', label: 'Peso atual', desc: 'Último registro de peso', icon: '\u2696' },
  { id: 'sleep', label: 'Sleep Score', desc: 'Qualidade do sono 0-100', icon: '\u{1F319}' },
  { id: 'readiness', label: 'Readiness', desc: 'Score de recuperação do corpo', icon: '\u{1F49A}' },
  { id: 'xp', label: 'XP total', desc: 'Pontos de experiência acumulados', icon: '\u2B50' },
  { id: 'workouts_week', label: 'Treinos semana', desc: 'Treinos nos últimos 7 dias', icon: '\u{1F4C5}' },
];

interface Props {
  current: string[];
}

export function DashboardMetricsClient({ current }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(current.slice(0, 3));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile/dashboard-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: selected }),
    });
    setSaving(false);
    router.push('/app');
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
      <Link
        href="/app/settings"
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Configurações
      </Link>

      <div>
        <h1 className="display-title">Métricas do Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Escolha 3 números que aparecem no topo
        </p>
      </div>

      <div className="space-y-2">
        {AVAILABLE.map((m) => {
          const isSelected = selected.includes(m.id);
          const order = selected.indexOf(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`w-full glass-card p-4 flex items-center gap-3 text-left transition-colors ${
                isSelected ? 'border border-accent/40 bg-accent/5' : ''
              } ${!isSelected && selected.length >= 3 ? 'opacity-40' : ''}`}
            >
              <span className="text-xl">{m.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              {isSelected && (
                <span className="h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                  {order + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        onClick={save}
        disabled={saving || selected.length !== 3}
        className="w-full"
        size="lg"
      >
        Salvar ({selected.length}/3 selecionadas)
      </Button>
    </main>
  );
}
