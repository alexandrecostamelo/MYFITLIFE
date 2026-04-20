'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressChart } from '@/components/ui/progress-chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target, Check, Trash2 } from 'lucide-react';
import type { WeightPredictionResult } from '@/lib/predictions/weight';

interface Props {
  goals: Record<string, unknown>[];
  prediction: WeightPredictionResult | null;
}

export function GoalsClient({ goals, prediction }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: '',
    target_value: '',
    unit: '',
    deadline: '',
    category: 'custom',
  });

  const createGoal = async () => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        target_value: form.target_value ? parseFloat(form.target_value) : null,
        metric_type: form.target_value ? 'number' : 'boolean',
      }),
    });
    setShowNew(false);
    setForm({ title: '', target_value: '', unit: '', deadline: '', category: 'custom' });
    router.refresh();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  const daysLabel =
    prediction?.predictedDate
      ? `${Math.ceil((new Date(prediction.predictedDate).getTime() - Date.now()) / 86400000)} dias`
      : null;

  return (
    <main className="mx-auto max-w-lg px-4 pt-4 pb-28 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="display-title">Metas</h1>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {/* Weight prediction */}
      {prediction && (
        <section className="space-y-2">
          <h2 className="section-title">Predição de peso</h2>
          {prediction.predictedDate && prediction.targetWeight && (
            <div className="glass-card-elevated p-4 accent-glow">
              <p className="text-sm text-muted-foreground">Você atinge</p>
              <p className="text-3xl font-display font-bold">
                {prediction.targetWeight}
                <span className="text-lg text-muted-foreground ml-1">kg</span>
              </p>
              <p className="text-sm text-accent font-semibold mt-1">
                em {daysLabel}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Taxa: {prediction.dailyRate > 0 ? '+' : ''}
                {prediction.dailyRate} kg/dia · Confiança: {prediction.confidence}
              </p>
            </div>
          )}
          <ProgressChart
            data={prediction.chartData}
            projection={prediction.chartProjection}
            targetValue={prediction.targetWeight ?? undefined}
            targetDate={prediction.predictedDate ?? undefined}
            unit="kg"
            height={160}
          />
        </section>
      )}

      {/* New goal form */}
      {showNew && (
        <section className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Nova meta</h2>
          <div className="space-y-1">
            <Label className="text-xs">O que você quer atingir?</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Supino 100kg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Valor alvo (opcional)</Label>
              <Input
                type="number"
                value={form.target_value}
                onChange={(e) =>
                  setForm({ ...form, target_value: e.target.value })
                }
                placeholder="100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unidade</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, cm, dias"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prazo (opcional)</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
          <Button
            onClick={createGoal}
            disabled={!form.title}
            className="w-full"
          >
            Criar meta
          </Button>
        </section>
      )}

      {/* Active goals */}
      <section className="space-y-2">
        <h2 className="section-title">Ativas ({active.length})</h2>
        {active.map((g) => {
          const targetVal = Number(g.target_value) || 0;
          const currentVal = Number(g.current_value) || 0;
          const pct = Number(g.progress_pct) || 0;
          const unitStr = String(g.unit || '');
          const deadlineStr = g.deadline
            ? new Date(String(g.deadline)).toLocaleDateString('pt-BR')
            : null;

          return (
            <div key={String(g.id)} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Target className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{String(g.title)}</h3>
                    {targetVal > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {currentVal} / {targetVal} {unitStr}
                      </p>
                    )}
                    {deadlineStr && (
                      <p className="text-[10px] text-muted-foreground">
                        até {deadlineStr}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-mono font-light text-accent">
                  {Math.round(pct)}%
                </span>
              </div>
              {targetVal > 0 && (
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma meta ativa
          </p>
        )}
      </section>

      {/* Completed goals */}
      {completed.length > 0 && (
        <section className="space-y-2">
          <h2 className="section-title">Concluídas ({completed.length})</h2>
          {completed.slice(0, 5).map((g) => (
            <div
              key={String(g.id)}
              className="glass-card p-3 flex items-center gap-3 opacity-60"
            >
              <Check className="h-4 w-4 text-accent" />
              <span className="text-sm flex-1">{String(g.title)}</span>
              <button onClick={() => deleteGoal(String(g.id))}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
