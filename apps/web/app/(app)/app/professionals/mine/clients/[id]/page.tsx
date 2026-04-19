'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Shield, Dumbbell, Utensils, Scale, Moon, Zap, AlertCircle } from 'lucide-react';

export default function ClientHistoryPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/professionals/mine/clients/${id}/history`).then(async (r) => {
      if (r.ok) {
        setData(await r.json());
      } else {
        const err = await r.json();
        setError(err.message || err.error || 'Erro');
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
          <p className="text-sm">{error}</p>
        </Card>
      </main>
    );
  }

  const h = data?.history || {};

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/appointments" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">{data?.client?.full_name || 'Cliente'}</h1>
      </header>

      <Card className="mb-4 border-blue-200 bg-blue-50 p-3 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-700" />
          <span className="text-blue-900">O cliente autorizou compartilhar este resumo com você.</span>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <StatCard icon={Dumbbell} label="Treinos (30d)" value={h.workouts_30d ?? 0} />
        <StatCard icon={Utensils} label="Refeições (30d)" value={h.meals_30d ?? 0} />
        <StatCard icon={Scale} label="Peso atual" value={h.last_weight_kg ? `${h.last_weight_kg}kg` : '-'} sub={h.weight_change_30d_kg !== null && h.weight_change_30d_kg !== undefined ? `${h.weight_change_30d_kg > 0 ? '+' : ''}${h.weight_change_30d_kg}kg em 30d` : ''} />
        <StatCard icon={Moon} label="Sono (14d)" value={h.avg_sleep_14d ? `${h.avg_sleep_14d}/10` : '-'} />
        <StatCard icon={Zap} label="Energia (14d)" value={h.avg_energy_14d ? `${h.avg_energy_14d}/10` : '-'} />
        <StatCard icon={Dumbbell} label="Kcal médias" value={h.avg_calories_14d ? `${h.avg_calories_14d}` : '-'} sub="diárias (14d)" />
      </div>

      <Card className="mb-4 p-4">
        <h3 className="mb-2 text-sm font-medium">Perfil</h3>
        <div className="space-y-1 text-sm">
          {h.primary_goal && <div><span className="text-muted-foreground">Objetivo:</span> {h.primary_goal}</div>}
          {h.experience_level && <div><span className="text-muted-foreground">Nível:</span> {h.experience_level}</div>}
          {h.current_streak > 0 && <div><span className="text-muted-foreground">Streak atual:</span> {h.current_streak} dias</div>}
          {h.food_restrictions?.length > 0 && (
            <div>
              <span className="text-muted-foreground">Restrições alimentares:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {h.food_restrictions.map((r: string, i: number) => (
                  <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {h.recent_injuries?.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-amber-900">Regiões com dor recente (14d)</h3>
          <div className="flex flex-wrap gap-1">
            {h.recent_injuries.map((r: string, i: number) => (
              <span key={i} className="rounded bg-white px-1.5 py-0.5 text-xs">{r}</span>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}
