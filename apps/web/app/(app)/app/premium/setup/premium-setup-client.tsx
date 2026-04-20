'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

const SPEC_LABELS: Record<string, string> = {
  nutrition: 'Nutrição',
  training: 'Treino',
  physio: 'Fisio',
};

export interface Pool {
  id: string;
  specialty: string;
  professional_id: string;
  professional: {
    full_name: string;
    avatar_url: string | null;
    council_type: string;
    council_number: string;
    bio: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

export function PremiumSetupClient({
  pools,
  currentBySpec,
}: {
  pools: Pool[];
  currentBySpec: Record<string, string>;
}) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');

  const select = async (professionalId: string, specialty: string) => {
    setSelecting(true);
    setError('');
    try {
      const res = await fetch('/api/premium/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professionalId, specialty }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || data.error || 'Erro ao selecionar profissional');
      }
    } finally {
      setSelecting(false);
    }
  };

  const grouped: Record<string, Pool[]> = { nutrition: [], training: [], physio: [] };
  for (const p of pools) {
    if (grouped[p.specialty]) grouped[p.specialty].push(p);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header className="flex items-center gap-2">
        <Link href="/app/premium" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configurar Premium</h1>
          <p className="text-sm text-muted-foreground">Escolha seu nutricionista e personal trainer</p>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(['nutrition', 'training', 'physio'] as const).map(
        (spec) =>
          grouped[spec].length > 0 && (
            <section key={spec} className="space-y-3">
              <h2 className="font-semibold">{SPEC_LABELS[spec]}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[spec].map((p) => {
                  const isCurrent = currentBySpec[spec] === p.professional_id;
                  return (
                    <button
                      key={p.id}
                      disabled={selecting || isCurrent}
                      onClick={() => select(p.professional_id, spec)}
                      className={`text-left rounded-xl border-2 p-4 transition-colors ${
                        isCurrent
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {p.professional?.avatar_url && (
                          <img
                            src={p.professional.avatar_url}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{p.professional?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.professional?.council_type} {p.professional?.council_number}
                          </p>
                          {p.professional?.city && (
                            <p className="text-xs text-muted-foreground">
                              {p.professional.city}/{p.professional.state}
                            </p>
                          )}
                          {p.professional?.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {p.professional.bio}
                            </p>
                          )}
                        </div>
                        {isCurrent && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                        {selecting && !isCurrent && (
                          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ),
      )}

      {pools.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Pool Premium ainda em montagem. Em breve profissionais disponíveis.
        </p>
      )}
    </main>
  );
}
