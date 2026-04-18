'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhotoCapture } from '@/components/photo-capture';
import { ArrowLeft, Loader2, Sparkles, Check, X, AlertCircle, Dumbbell } from 'lucide-react';

type DetectedEquipment = {
  name_pt: string;
  category: string;
  primary_muscles: string[];
  confidence: 'high' | 'medium' | 'low';
  possible_alternatives: string[];
  how_to_use: string;
};

type AnalyzeResult = {
  recognition_id: string;
  equipment: DetectedEquipment;
  photo_path: string | null;
  usage: { used_today: number; remaining: number; daily_limit: number };
};

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;

  const [gymName, setGymName] = useState('');
  const [scannedCount, setScannedCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/gyms/${gymId}`).then((r) => r.json()).then((d) => {
      setGymName(d.gym?.name || '');
      setScannedCount((d.equipment || []).length);
    });
  }, [gymId]);

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

  async function addToGym() {
    if (!result) return;
    setSaving(true);

    await fetch(`/api/gyms/${gymId}/equipment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: result.equipment.name_pt,
        category: result.equipment.category,
        primary_muscles: result.equipment.primary_muscles,
        confidence: result.equipment.confidence,
        recognition_id: result.recognition_id,
      }),
    });

    setScannedCount((c) => c + 1);
    setResult(null);
    setFile(null);
    setSaving(false);
  }

  function skip() {
    setResult(null);
    setFile(null);
  }

  function finish() {
    router.push(`/app/gyms/${gymId}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href={`/app/gyms/${gymId}`} className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Escanear {gymName}</h1>
          <p className="text-xs text-muted-foreground">
            {scannedCount} {scannedCount === 1 ? 'aparelho cadastrado' : 'aparelhos cadastrados'}
          </p>
        </div>
      </header>

      {!result && (
        <>
          <Card className="mb-4 p-4">
            <div className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Dumbbell className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>Fotografe cada aparelho da academia, um por vez. A IA identifica e adiciona ao inventário.</p>
            </div>
            <PhotoCapture onPhotoSelected={setFile} disabled={analyzing} />
          </Card>

          {file && !analyzing && (
            <div className="mb-4 flex gap-2">
              <Button onClick={analyze} className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" /> Identificar
              </Button>
              <Button variant="outline" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {analyzing && (
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Identificando...
              </div>
            </Card>
          )}

          {error && (
            <Card className="mb-4 border-destructive/50 bg-destructive/5 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                <p className="font-medium text-destructive">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setError(null); setFile(null); }} className="mt-3">
                Tentar outra foto
              </Button>
            </Card>
          )}

          {scannedCount > 0 && (
            <Button variant="outline" onClick={finish} className="w-full">
              Finalizar e ver inventário
            </Button>
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
                {result.equipment.primary_muscles.join(', ')}
              </p>
            )}
            {result.equipment.possible_alternatives.length > 0 && (
              <p className="mt-2 text-xs italic text-muted-foreground">
                Pode ser também: {result.equipment.possible_alternatives.join(' ou ')}
              </p>
            )}
          </Card>

          <div className="mb-4 flex gap-2">
            <Button variant="outline" onClick={skip} className="flex-1" disabled={saving}>
              <X className="mr-1 h-4 w-4" /> Descartar
            </Button>
            <Button onClick={addToGym} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <><Check className="mr-1 h-4 w-4" /> Adicionar e próximo</>
              )}
            </Button>
          </div>

          <Button variant="ghost" onClick={finish} className="w-full">
            Finalizar escaneamento
          </Button>

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
