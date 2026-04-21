'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActivityRings } from '@/components/ui/activity-rings';
import { MetricHero } from '@/components/ui/metric-hero';
import { WeekStrip } from '@/components/ui/week-strip';
import { CalendarHeatmap } from '@/components/ui/calendar-heatmap';
import {
  Bell,
  ChevronRight,
  Check,
  Circle,
  Scale,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CoachAvatar } from '@/components/ui/coach-avatar';
import { getPersona } from '@/lib/ai/personas';
import { FirstTimeTooltip } from '@/components/help/first-time-tooltip';

interface Props {
  name: string;
  avatar: string | null;
  tier: string;
  coachPersona?: string;
  rings: { value: number; max: number; color: string; label: string }[];
  streak: number;
  monthSessions: number;
  todayMinutes: number;
  weekDays: boolean[];
  heatmap: Record<
    string,
    number | { workouts: number; meals: number; checkins: number }
  >;
  todo: {
    checkinDone: boolean;
    workoutDone: boolean;
    mealsDone: boolean;
    hasPlan: boolean;
  };
  currentWeight?: number;
  workoutTitle?: string;
  readiness?: {
    score: number;
    zone: 'green' | 'yellow' | 'red';
    recommendation: string;
  };
  sleepScore?: {
    total: number;
    label: string;
    avgHours: number;
    tip: string;
  };
  heroMetrics?: { value: string | number; label: string }[];
}

const TODO_ITEMS = [
  { key: 'checkinDone', label: 'Check-in matinal', href: '/app/checkin' },
  { key: 'workoutDone', label: 'Treinar hoje', href: '/app/workout' },
  {
    key: 'mealsDone',
    label: 'Registrar 3 refei\u00e7\u00f5es',
    href: '/app/nutrition',
  },
] as const;

export function DashboardClient(props: Props) {
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? 'Bom dia'
      : now.getHours() < 18
        ? 'Boa tarde'
        : 'Boa noite';
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const [showWeight, setShowWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(
    props.currentWeight?.toString() || '',
  );

  const saveWeight = async () => {
    if (!weightInput) return;
    await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight_kg: parseFloat(weightInput) }),
    });
    setShowWeight(false);
  };

  const metrics = props.heroMetrics || [
    { label: 'Streak', value: props.streak },
    { label: 'Sess\u00f5es', value: props.monthSessions },
    { label: 'Minutos', value: props.todayMinutes },
  ];

  return (
    <main className="mx-auto max-w-lg px-4 pt-4 pb-28 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {props.avatar ? (
            <img
              src={props.avatar}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
              {props.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold">
              {greeting}, {props.name}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">
              {dateStr}
            </p>
          </div>
        </div>
        <Link href="/app/notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Link>
      </header>

      {/* Activity Rings + Configurable Metrics */}
      <FirstTimeTooltip
        id="dashboard-rings"
        title="Anéis de Atividade"
        description="Seus anéis mostram o progresso diário: treino, nutrição e check-in. Complete todos para manter seu streak!"
        position="bottom"
      >
      <section className="glass-card p-5 flex flex-col items-center">
        <ActivityRings
          rings={props.rings}
          size={160}
          strokeWidth={14}
        />
        <div className="grid grid-cols-3 gap-6 mt-5 w-full">
          {metrics.map((m, i) => (
            <MetricHero key={i} label={m.label} value={m.value} />
          ))}
        </div>
      </section>
      </FirstTimeTooltip>

      {/* Week Strip */}
      <section className="glass-card p-4">
        <WeekStrip completed={props.weekDays} />
      </section>

      {/* Sleep Score */}
      {props.sleepScore && (
        <Link href="/app/checkin">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-violet-400" />
                <div>
                  <p className="metric-label">Sleep Fitness</p>
                  <p className="font-mono text-2xl font-light">
                    {props.sleepScore.total}
                    <span className="text-xs text-muted-foreground">
                      /100
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-accent font-medium">
                  {props.sleepScore.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {props.sleepScore.avgHours}h m\u00e9dia
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {props.sleepScore.tip}
            </p>
          </div>
        </Link>
      )}

      {/* Readiness */}
      {props.readiness && (
        <Link href="/app/health/readiness">
          <div
            className={`glass-card p-4 border ${
              props.readiness.zone === 'red'
                ? 'border-red-500/40'
                : props.readiness.zone === 'yellow'
                  ? 'border-amber-500/40'
                  : 'border-accent/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title">Readiness</h2>
              <span
                className={`text-2xl font-mono font-light ${
                  props.readiness.zone === 'red'
                    ? 'text-red-400'
                    : props.readiness.zone === 'yellow'
                      ? 'text-amber-400'
                      : 'text-accent'
                }`}
              >
                {props.readiness.score}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  props.readiness.zone === 'red'
                    ? 'bg-red-500'
                    : props.readiness.zone === 'yellow'
                      ? 'bg-amber-500'
                      : 'bg-accent'
                }`}
                style={{ width: `${props.readiness.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {props.readiness.recommendation}
            </p>
          </div>
        </Link>
      )}

      {/* Today To-do */}
      <section className="space-y-2">
        <h2 className="section-title">Hoje</h2>
        <div className="space-y-1.5">
          {TODO_ITEMS.map((item) => {
            const done = props.todo[item.key];
            return (
              <Link key={item.key} href={item.href}>
                <div
                  className={`glass-card flex items-center gap-3 p-3 transition-colors ${done ? 'opacity-60' : ''}`}
                >
                  {done ? (
                    <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                      <Check className="h-3 w-3 text-accent-foreground" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-sm flex-1 ${done ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Weight */}
      {props.currentWeight !== undefined && (
        <section className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Peso atual</p>
              <p className="metric-number text-2xl">
                {props.currentWeight}{' '}
                <span className="text-sm text-muted-foreground">kg</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowWeight(!showWeight)}
            >
              <Scale className="h-4 w-4 mr-1" /> Atualizar
            </Button>
          </div>
          {showWeight && (
            <div className="flex gap-2 mt-3">
              <Input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="kg"
                className="flex-1"
              />
              <Button size="sm" onClick={saveWeight}>
                Salvar
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Workout of the day */}
      {props.workoutTitle && (
        <Link href="/app/workout">
          <div className="glass-card-elevated p-4 flex items-center gap-3 accent-glow">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-lg">
                {'\uD83D\uDCAA'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {props.workoutTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                Autopilot gerou seu treino
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-accent" />
          </div>
        </Link>
      )}

      {/* Coach card */}
      {props.coachPersona && (
        <Link href="/app/coach">
          <div className="glass-card p-4 flex items-center gap-3">
            <CoachAvatar
              persona={
                props.coachPersona as 'leo' | 'sofia' | 'rafa'
              }
              size="md"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {getPersona(props.coachPersona).name}
              </p>
              <p className="text-xs text-muted-foreground">
                {getPersona(props.coachPersona).tagline}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Calendar Heatmap */}
      <section className="glass-card p-4">
        <CalendarHeatmap
          data={props.heatmap}
          month={now.getMonth()}
          year={now.getFullYear()}
        />
      </section>
    </main>
  );
}
