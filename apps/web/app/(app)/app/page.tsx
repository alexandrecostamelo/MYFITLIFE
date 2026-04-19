'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MorningCheckin } from '@/components/morning-checkin';
import Link from 'next/link';
import { Loader2, Sparkles, Flame, Trophy } from 'lucide-react';

export default function AppHome() {
  const [profile, setProfile] = useState<any>(null);
  const [targets, setTargets] = useState<any>(null);
  const [checkin, setCheckin] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [totals, setTotals] = useState({ cal: 0, pro: 0, carb: 0, fat: 0 });
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [p, c, m] = await Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/checkin').then((r) => r.json()),
      fetch('/api/meals').then((r) => r.json()),
    ]);
    setProfile(p.profile);
    setTargets(p.targets);
    setCheckin(c.checkin);

    const t = (m.meals || []).reduce(
      (acc: any, x: any) => ({
        cal: acc.cal + Number(x.calories_kcal),
        pro: acc.pro + Number(x.protein_g),
        carb: acc.carb + Number(x.carbs_g),
        fat: acc.fat + Number(x.fats_g),
      }),
      { cal: 0, pro: 0, carb: 0, fat: 0 }
    );
    setTotals(t);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function generatePlan() {
    setGenerating(true);
    const res = await fetch('/api/autopilot/generate', { method: 'POST' });
    const data = await res.json();
    if (data.plan) setPlan(data.plan);
    setGenerating(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const firstName = profile?.full_name?.split(' ')[0] || 'você';
  const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Oi, {firstName}!</h1>
        <p className="text-muted-foreground">Seu plano do dia</p>
      </header>

      <StatsWidget />

      <Card className="mb-4 p-3">
        <div className="grid grid-cols-4 gap-2">
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/community"><span className="text-lg">💬</span><span className="text-xs">Comunidade</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/professionals"><span className="text-lg">👨‍⚕️</span><span className="text-xs">Profissionais</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/explore"><span className="text-lg">📍</span><span className="text-xs">Academias</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/challenges"><span className="text-lg">🎯</span><span className="text-xs">Desafios</span></Link>
          </Button>
        </div>
      </Card>

      <Card className="mb-4 p-3">
        <div className="grid grid-cols-4 gap-2">
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/appointments"><span className="text-lg">📅</span><span className="text-xs">Agendamentos</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/threads"><span className="text-lg">💌</span><span className="text-xs">Conversas</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/reports/weekly"><span className="text-lg">📊</span><span className="text-xs">Sua semana</span></Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-auto flex-col gap-1 py-2">
            <Link href="/app/reports/wrapped"><span className="text-lg">✨</span><span className="text-xs">Wrapped</span></Link>
          </Button>
        </div>
      </Card>

      {!checkin && <div className="mb-4"><MorningCheckin onDone={loadAll} /></div>}

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Progresso de hoje</h2>
        <div className="space-y-2">
          <ProgressRow label="Calorias" current={totals.cal} target={targets?.cal ?? 0} unit="kcal" pct={pct(totals.cal, targets?.cal)} />
          <ProgressRow label="Proteína" current={totals.pro} target={targets?.pro ?? 0} unit="g" pct={pct(totals.pro, targets?.pro)} />
          <ProgressRow label="Carboidratos" current={totals.carb} target={targets?.carb ?? 0} unit="g" pct={pct(totals.carb, targets?.carb)} />
          <ProgressRow label="Gorduras" current={totals.fat} target={targets?.fat ?? 0} unit="g" pct={pct(totals.fat, targets?.fat)} />
        </div>
      </Card>

      {!plan && (
        <Card className="mb-4 p-4">
          <h2 className="mb-2 text-sm font-medium">Autopilot</h2>
          <p className="mb-3 text-sm text-muted-foreground">Gere treino e cardápio sugerido pela IA para hoje.</p>
          <Button onClick={generatePlan} disabled={generating} className="w-full">
            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar plano do dia</>}
          </Button>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Lista de compras</h2>
            <p className="text-xs text-muted-foreground">Gerada a partir dos seus planos</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/shopping-list">Abrir</Link>
          </Button>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">Análise muscular</h2>
            <p className="text-xs text-muted-foreground">Heatmap de músculos trabalhados</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/insights/muscles">Ver</Link>
          </Button>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3">
            <Link href="/app/trails">
              <span className="text-lg">🎯</span>
              <span className="text-xs">Trilhas</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3">
            <Link href="/app/progress">
              <span className="text-lg">📸</span>
              <span className="text-xs">Fotos de progresso</span>
            </Link>
          </Button>
        </div>
      </Card>

      {plan && (
        <>
          {plan.ai_notes && (
            <Card className="mb-4 bg-primary/5 p-4">
              <p className="text-sm italic">&quot;{plan.ai_notes}&quot;</p>
            </Card>
          )}

          {plan.habits?.workout && (
            <Card className="mb-4 p-4">
              <h2 className="mb-2 font-medium">Treino sugerido</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                {plan.habits.workout.focus} · ~{plan.habits.workout.estimated_duration_min} min
              </p>
              <ol className="space-y-2 text-sm">
                {plan.habits.workout.exercises?.map((ex: any, i: number) => (
                  <li key={i} className="border-l-2 border-primary pl-3">
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ex.sets}x{ex.reps} · descanso {ex.rest_sec}s
                    </div>
                    {ex.notes && <div className="mt-1 text-xs italic text-muted-foreground">{ex.notes}</div>}
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {plan.meals_suggestion && (
            <Card className="mb-4 p-4">
              <h2 className="mb-2 font-medium">Refeições sugeridas</h2>
              <div className="space-y-3 text-sm">
                {plan.meals_suggestion.map((m: any, i: number) => (
                  <div key={i}>
                    <div className="font-medium capitalize">{m.meal_type?.replace('_', ' ')} · ~{m.approx_calories} kcal</div>
                    <ul className="list-inside list-disc text-muted-foreground">
                      {m.items?.map((it: string, j: number) => <li key={j}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {plan.water_goal_ml && (
            <Card className="p-4">
              <h2 className="mb-1 text-sm font-medium">Meta de água</h2>
              <p className="text-2xl font-bold">{plan.water_goal_ml} ml</p>
            </Card>
          )}
        </>
      )}
    </main>
  );
}

function StatsWidget() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { fetch('/api/me/stats').then((r) => r.json()).then((d) => setStats(d.stats)); }, []);
  if (!stats) return null;
  return (
    <Card className="mb-4 p-3">
      <Link href="/app/stats" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{stats.level}</div>
          <div><div className="text-sm font-medium">Nível {stats.level}</div><div className="text-xs text-muted-foreground">{stats.xp_to_next} XP pro próximo</div></div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" /><span>{stats.streak.current}</span></div>
          <Trophy className="h-4 w-4 text-amber-500" />
        </div>
      </Link>
    </Card>
  );
}

function ProgressRow({ label, current, target, unit, pct }: { label: string; current: number; target: number; unit: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{Math.round(current)}/{target} {unit}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-200">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
