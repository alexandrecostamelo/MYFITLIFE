'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PERSONAS } from '@/lib/ai/personas';
import { CoachAvatar } from '@/components/ui/coach-avatar';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  isOnboarding?: boolean;
  currentPersona?: string;
}

const SAMPLE_PHRASES: Record<string, string> = {
  leo: '"Bora treinar! Hoje é dia de evoluir 💪"',
  sofia: '"Vamos otimizar sua periodização com base no seu volume semanal."',
  rafa: '"E aí, suave? Bora fazer um treino tranquilo e eficiente 😎"',
};

export function CoachSelectionClient({ isOnboarding = false, currentPersona }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentPersona || 'leo');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await fetch('/api/profile/coach-persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: selected }),
    });
    router.push(isOnboarding ? '/app' : '/app/settings');
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-8 pb-24 space-y-6">
      <div className="text-center">
        <h1 className="display-title">Escolha seu coach</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {isOnboarding
            ? 'Quem vai te acompanhar na jornada?'
            : 'Troque quando quiser'}
        </p>
      </div>

      <div className="space-y-3">
        {Object.values(PERSONAS).map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              selected === p.id
                ? 'border-accent bg-accent/5 accent-glow'
                : 'border-border hover:border-muted-foreground/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <CoachAvatar persona={p.id as 'leo' | 'sofia' | 'rafa'} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {selected === p.id && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </div>
                <p className="text-sm text-accent/80 font-medium">{p.tagline}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.description}
                </p>
              </div>
            </div>
            <div className="mt-3 glass-card p-3 text-sm italic text-muted-foreground">
              {SAMPLE_PHRASES[p.id]}
            </div>
          </button>
        ))}
      </div>

      <Button onClick={save} disabled={loading} className="w-full" size="lg">
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isOnboarding ? 'Começar com ' : 'Trocar para '}
        {PERSONAS[selected].name}
      </Button>
    </main>
  );
}
