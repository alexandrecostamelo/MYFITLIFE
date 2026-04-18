'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhotoCapture } from '@/components/photo-capture';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Check, Info, Dumbbell } from 'lucide-react';

type SuggestedExercise = {
  id: string;
  slug: string;
  name_pt: string;
  category: string;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  equipment: string[] | null;
  difficulty: number;
  instructions: string[] | null;
  common_mistakes: string[] | null;
  breathing_notes: string | null;
  score: number;
};

type AnalysisResult = {
  recognition_id: string;
  equipment: {
    name_pt: string;
    name_en: string;
    category: string;
    primary_muscles: string[];
    confidence: 'high' | 'medium' | 'low';
    possible_alternatives: string[];
    how_to_use: string;
    common_mistakes: string[];
    notes: string;
  };
  suggestions: SuggestedExercise[];
  photo_path: string | null;
  usage: { used_today: number; remaining: number; daily_limit: number };
};

export default function EquipmentPage() {
  const router = useRouter();
  const params = useSearchParams();
  const workoutId = params.get('workout_id');

  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SuggestedExercise | null>(null);
  const [adding, setAdding] = useState(false);

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/workout/analyze-equipment', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao analisar');
        setAnalyzing(false);
        return;
      }

      setResult(data);
    } catch {
      setError('Erro de conexão');
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirm() {
    if (!result || !selected) return;
    setAdding(true);

    await fetch('/api/workout/confirm-equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognition_id: result.recognition_id,
        exercise_id: selected.id,
      }),
    });

    if (workoutId) {
      sessionStorage.setItem('pending_exercise', JSON.stringify({
        id: selected.id,
        name_pt: selected.name_pt,
        primary_muscles: selected.primary_muscles,
      }));
      router.push(`/app/workout?add_exercise=${selected.id}`);
    } else {
      router.push('/app/workout');
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/workout" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Identificar aparelho</h1>
      </header>

      {!result && (
        <>
          <Card className="mb-4 p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Fotografe um aparelho de academia e a IA identifica, explica como usar e sugere exercícios que você pode fazer nele.
            </p>
            <PhotoCapture onPhotoSelected={setFile} disabled={analyzing} />
          </Card>

          {file && !analyzing && (
            <Button onClick={analyze} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" /> Identificar aparelho
            </Button>
          )}

          {analyzing && (
            <Card className="p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Identificando aparelho... leva uns 10 segundos
              </div>
            </Card>
          )}

          {error && (
            <Card className="mt-4 border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                <p className="font-medium text-destructive">{error}</p>
              </div>
            </Card>
          )}
        </>
      )}

      {result && (
        <>
          <Card className="mb-4 bg-primary/5 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">{result.equipment.name_pt}</h2>
              <ConfidenceBadge level={result.equipment.confidence} />
            </div>
            {result.equipment.primary_muscles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Músculos: {result.equipment.primary_muscles.join(', ')}
              </p>
            )}
            {result.equipment.possible_alternatives.length > 0 && (
              <p className="mt-2 text-xs italic text-muted-foreground">
                Pode ser também: {result.equipment.possible_alternatives.join(' ou ')}
              </p>
            )}
          </Card>

          {result.equipment.how_to_use && (
            <Card className="mb-4 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Como usar</h3>
              </div>
              <p className="text-sm">{result.equipment.how_to_use}</p>

              {result.equipment.common_mistakes.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Erros comuns:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                    {result.equipment.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {result.suggestions.length > 0 ? (
            <Card className="mb-4 p-4">
              <h3 className="mb-3 text-sm font-medium">Exercícios sugeridos nesse aparelho</h3>
              <div className="space-y-2">
                {result.suggestions.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setSelected(ex)}
                    className={`flex w-full flex-col items-start gap-1 rounded border p-3 text-left transition-colors ${
                      selected?.id === ex.id
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium">{ex.name_pt}</span>
                      {selected?.id === ex.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {(ex.primary_muscles || []).slice(0, 3).map((m) => (
                        <span key={m} className="rounded bg-slate-100 px-1.5 py-0.5">{m}</span>
                      ))}
                      <span>· dificuldade {ex.difficulty}/5</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="mb-4 p-4 text-sm text-muted-foreground">
              Não encontramos exercícios exatos na base. Volte para a tela de treino e busque manualmente.
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setResult(null); setFile(null); setSelected(null); }} className="flex-1">
              Nova foto
            </Button>
            <Button onClick={confirm} disabled={adding || !selected} className="flex-1">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Check className="mr-1 h-4 w-4" /> Adicionar ao treino</>
              )}
            </Button>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {result.usage.remaining} análises restantes hoje
          </p>
        </>
      )}
    </main>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-red-100 text-red-800',
  };
  const labels = { high: 'alta', medium: 'média', low: 'baixa' };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${colors[level]}`}>
      {labels[level]}
    </span>
  );
}
