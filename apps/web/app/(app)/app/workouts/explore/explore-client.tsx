'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Loader2 } from 'lucide-react';

const CONTEXTS = [
  { id: 'wake_up', label: 'Acordar', icon: '\u2600\uFE0F' },
  { id: 'pre_workout', label: 'Pré-Treino', icon: '\uD83D\uDD25' },
  { id: 'office', label: 'Escritório', icon: '\uD83D\uDCBC' },
  { id: 'stressed', label: 'Estressado', icon: '\uD83D\uDE24' },
  { id: 'post_travel', label: 'Pós-Viagem', icon: '\u2708\uFE0F' },
  { id: 'pre_sleep', label: 'Pré-Sono', icon: '\uD83C\uDF19' },
  { id: 'rest_day', label: 'Descanso', icon: '\uD83E\uDDD8' },
  { id: 'no_time', label: 'Sem Tempo', icon: '\u26A1' },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

interface Props {
  contextual: Record<string, unknown>[];
  challenges: Record<string, unknown>[];
  progress: Record<string, unknown>[];
}

export function ExploreClient({ contextual, challenges, progress }: Props) {
  const router = useRouter();
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [startingChallenge, setStartingChallenge] = useState<string | null>(null);

  const filtered = activeContext
    ? contextual.filter((w) => w.context === activeContext)
    : contextual;

  const getProgress = (challengeId: string) =>
    progress.find((p) => p.challenge_id === challengeId);

  const startChallenge = async (challengeId: string) => {
    setStartingChallenge(challengeId);
    await fetch('/api/mini-challenges/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId }),
    });
    router.refresh();
    setStartingChallenge(null);
  };

  return (
    <main className="mx-auto max-w-lg px-4 pt-4 pb-28 space-y-6">
      <h1 className="display-title">Explorar</h1>

      {/* Context filters */}
      <section>
        <h2 className="section-title mb-3">Por momento</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CONTEXTS.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() =>
                setActiveContext(activeContext === ctx.id ? null : ctx.id)
              }
              className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-colors ${
                activeContext === ctx.id
                  ? 'bg-accent/20 border border-accent/40'
                  : 'glass-card'
              }`}
            >
              <span className="text-xl">{ctx.icon}</span>
              <span className="text-[10px] font-medium whitespace-nowrap">
                {ctx.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Contextual sessions */}
      <section className="space-y-2">
        <h2 className="section-title">
          Sessões{' '}
          {activeContext
            ? `\u2014 ${CONTEXTS.find((c) => c.id === activeContext)?.label}`
            : ''}
        </h2>
        {filtered.map((w) => {
          const exercises = (w.exercises as unknown[]) || [];
          return (
            <div key={String(w.id)} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{String(w.title)}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {String(w.description || '')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                  <Timer className="h-3 w-3" />
                  {String(w.duration_minutes)}min
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="chip text-[10px]">
                  {DIFFICULTY_LABELS[String(w.difficulty)] || String(w.difficulty)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {exercises.length} exercícios
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma sessão encontrada
          </p>
        )}
      </section>

      {/* Mini challenges */}
      <section className="space-y-2">
        <h2 className="section-title">Mini-desafios</h2>
        {challenges.map((ch) => {
          const prog = getProgress(String(ch.id));
          const completedDays = (prog?.completed_days as number[]) || [];
          const totalDays = Number(ch.total_days) || 7;
          const pct = (completedDays.length / totalDays) * 100;
          const isStarting = startingChallenge === String(ch.id);

          return (
            <div key={String(ch.id)} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{String(ch.title)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {String(ch.description || '')}
                  </p>
                </div>
                <span className="chip text-[10px]">{totalDays}d</span>
              </div>
              {prog && !prog.completed_at && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>
                      Dia {Number(prog.current_day)}/{totalDays}
                    </span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
              {!!prog?.completed_at && (
                <p className="mt-2 text-xs text-accent font-medium">
                  Concluído!
                </p>
              )}
              {!prog && (
                <button
                  onClick={() => startChallenge(String(ch.id))}
                  disabled={isStarting}
                  className="mt-2 text-xs text-accent font-medium flex items-center gap-1"
                >
                  {isStarting && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Começar \u2192
                </button>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
