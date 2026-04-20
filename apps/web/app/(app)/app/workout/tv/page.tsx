'use client';

import { useState, useEffect, useCallback } from 'react';
import { CircularTimer } from '@/components/ui/circular-timer';
import { Dumbbell } from 'lucide-react';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  duration_sec?: number;
  thumbnail_url?: string;
}

export default function TVWorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'exercise' | 'rest' | 'idle'>('idle');
  const [restDuration, setRestDuration] = useState(60);
  const [workoutName, setWorkoutName] = useState('');

  const startWorkout = useCallback(
    (data: { exercises: Exercise[]; workoutName: string }) => {
      setExercises(data.exercises || []);
      setWorkoutName(data.workoutName || 'Treino');
      setCurrentIndex(0);
      setCurrentSet(1);
      setPhase('exercise');
    },
    [],
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'START_TV_WORKOUT') {
        startWorkout(e.data);
      }
      if (e.data?.type === 'NEXT_EXERCISE') {
        setCurrentIndex((i) =>
          Math.min(i + 1, (exercises.length || 1) - 1),
        );
        setCurrentSet(1);
        setPhase('exercise');
      }
      if (e.data?.type === 'START_REST') {
        setRestDuration(e.data.duration || 60);
        setPhase('rest');
      }
    };

    window.addEventListener('message', handler);

    const stored = sessionStorage.getItem('tv_workout');
    if (stored) {
      try {
        startWorkout(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    return () => window.removeEventListener('message', handler);
  }, [exercises.length, startWorkout]);

  const current = exercises[currentIndex];
  const next = exercises[currentIndex + 1];

  if (phase === 'idle' || !current) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A]">
        <div className="space-y-6 text-center">
          <Dumbbell className="mx-auto h-20 w-20 text-accent opacity-30" />
          <h1 className="font-display text-5xl font-bold text-white">
            MyFitLife
          </h1>
          <p className="text-xl text-muted-foreground">
            Aguardando treino...
          </p>
          <p className="text-sm text-muted-foreground">
            Inicie um treino no celular pra começar aqui
          </p>
        </div>
      </main>
    );
  }

  if (phase === 'rest') {
    return (
      <main className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-[#0A0A0A]">
        <p className="text-2xl uppercase tracking-widest text-muted-foreground">
          Descanso
        </p>
        <CircularTimer
          totalSeconds={restDuration}
          exerciseName="Descanso"
          nextExercise={
            currentSet < (current.sets || 3)
              ? `${current.name} \u2014 S\u00e9rie ${currentSet + 1}`
              : next?.name
          }
          size={320}
          onComplete={() => {
            if (currentSet < (current.sets || 3)) {
              setCurrentSet((s) => s + 1);
              setPhase('exercise');
            } else if (currentIndex < exercises.length - 1) {
              setCurrentIndex((i) => i + 1);
              setCurrentSet(1);
              setPhase('exercise');
            } else {
              setPhase('idle');
            }
          }}
        />
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen bg-[#0A0A0A]">
      {/* Left — thumbnail */}
      <div className="flex flex-1 items-center justify-center px-12">
        {current.thumbnail_url ? (
          <img
            src={current.thumbnail_url}
            alt=""
            className="h-64 w-64 rounded-3xl object-cover"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-3xl bg-white/5">
            <Dumbbell className="h-24 w-24 text-white/10" />
          </div>
        )}
      </div>

      {/* Right — info */}
      <div className="flex flex-1 flex-col justify-center gap-8 pr-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            {workoutName}
          </p>
          <h1 className="font-display mt-2 text-6xl font-bold leading-tight text-white">
            {current.name}
          </h1>
        </div>

        <div className="flex gap-12">
          <p className="font-mono text-7xl font-light text-white">
            {current.sets || 3}
            <span className="ml-2 text-3xl text-muted-foreground">sets</span>
          </p>
          <p className="font-mono text-7xl font-light text-white">
            {current.reps || 10}
            <span className="ml-2 text-3xl text-muted-foreground">reps</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-full bg-accent/10 px-6 py-3">
            <span className="text-xl font-bold text-accent">
              S\u00e9rie {currentSet}/{current.sets || 3}
            </span>
          </div>
          <span className="text-muted-foreground">
            Exerc\u00edcio {currentIndex + 1}/{exercises.length}
          </span>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setPhase('rest')}
            className="accent-glow rounded-full bg-accent px-10 py-4 text-lg font-semibold text-accent-foreground"
          >
            Feito \u2192 Descansar
          </button>
          <button
            onClick={() => {
              if (currentIndex < exercises.length - 1) {
                setCurrentIndex((i) => i + 1);
                setCurrentSet(1);
              } else {
                setPhase('idle');
              }
            }}
            className="rounded-full bg-white/10 px-8 py-4 text-lg font-medium text-white"
          >
            Pular
          </button>
        </div>

        {next && (
          <div className="glass-card mt-4 max-w-md p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pr\u00f3ximo
            </p>
            <p className="mt-1 text-lg font-medium text-white">{next.name}</p>
            <p className="text-sm text-muted-foreground">
              {next.sets || 3} sets \u00d7 {next.reps || 10} reps
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
