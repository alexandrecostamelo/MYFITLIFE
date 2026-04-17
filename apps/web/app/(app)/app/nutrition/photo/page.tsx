'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoCapture } from '@/components/photo-capture';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Trash2, Check } from 'lucide-react';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Café da manhã' },
  { value: 'morning_snack', label: 'Lanche da manhã' },
  { value: 'lunch', label: 'Almoço' },
  { value: 'afternoon_snack', label: 'Lanche da tarde' },
  { value: 'dinner', label: 'Jantar' },
  { value: 'evening_snack', label: 'Ceia' },
  { value: 'pre_workout', label: 'Pré-treino' },
  { value: 'post_workout', label: 'Pós-treino' },
];

type DetectedItem = {
  food_id: string | null;
  food_name: string | null;
  detected_name: string;
  amount_g: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  matched: boolean;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
};

type AnalysisResult = {
  meal_description: string;
  confidence_overall: 'high' | 'medium' | 'low';
  items: DetectedItem[];
  warnings: string[];
  photo_path: string | null;
  usage: { used_today: number; remaining: number; daily_limit: number };
};

export default function PhotoMealPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('meal_type', mealType);

    try {
      const res = await fetch('/api/nutrition/analyze-photo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || 'Erro ao analisar foto');
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

  function updateItem(i: number, field: string, value: number) {
    if (!result) return;
    const items = [...result.items];
    const item = { ...items[i] };

    if (field === 'amount_g' && item.matched && item.amount_g > 0) {
      const ratio = value / item.amount_g;
      item.calories_kcal = Math.round((item.calories_kcal ?? 0) * ratio * 100) / 100;
      item.protein_g = Math.round((item.protein_g ?? 0) * ratio * 100) / 100;
      item.carbs_g = Math.round((item.carbs_g ?? 0) * ratio * 100) / 100;
      item.fats_g = Math.round((item.fats_g ?? 0) * ratio * 100) / 100;
    }

    item.amount_g = value;
    items[i] = item;
    setResult({ ...result, items });
  }

  function removeItem(i: number) {
    if (!result) return;
    setResult({ ...result, items: result.items.filter((_, idx) => idx !== i) });
  }

  async function save() {
    if (!result || result.items.length === 0) return;
    setSaving(true);

    const res = await fetch('/api/nutrition/save-photo-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_type: mealType,
        items: result.items.map((i) => ({
          food_id: i.food_id,
          detected_name: i.detected_name,
          food_name: i.food_name,
          amount_g: i.amount_g,
          calories_kcal: i.calories_kcal,
          protein_g: i.protein_g,
          carbs_g: i.carbs_g,
          fats_g: i.fats_g,
        })),
        photo_path: result.photo_path,
      }),
    });

    if (res.ok) {
      router.push('/app/nutrition');
      router.refresh();
    } else {
      setError('Erro ao salvar');
      setSaving(false);
    }
  }

  const totals = result?.items.reduce(
    (acc, m) => ({
      cal: acc.cal + (Number(m.calories_kcal) || 0),
      pro: acc.pro + (Number(m.protein_g) || 0),
      carb: acc.carb + (Number(m.carbs_g) || 0),
      fat: acc.fat + (Number(m.fats_g) || 0),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0 }
  ) || { cal: 0, pro: 0, carb: 0, fat: 0 };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/nutrition" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Refeição por foto</h1>
      </header>

      {!result && (
        <>
          <Card className="mb-4 p-4">
            <Label className="mb-2 block">Qual refeição?</Label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="mb-4 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            >
              {MEAL_TYPES.map((mt) => <option key={mt.value} value={mt.value}>{mt.label}</option>)}
            </select>

            <PhotoCapture onPhotoSelected={setFile} disabled={analyzing} />
          </Card>

          {file && !analyzing && (
            <Button onClick={analyze} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" /> Analisar com IA
            </Button>
          )}

          {analyzing && (
            <Card className="p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando sua foto... isso leva uns 10-20 segundos
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
            <div className="mb-1 text-xs text-muted-foreground">Detectado na foto</div>
            <p className="text-sm italic">&quot;{result.meal_description}&quot;</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Confiança: <ConfidenceBadge level={result.confidence_overall} />
              {' · '}
              {result.usage.remaining} análises restantes hoje
            </div>
          </Card>

          {result.warnings.length > 0 && (
            <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-2 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div>
                  {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              </div>
            </Card>
          )}

          <Card className="mb-4 p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><div className="text-xs text-muted-foreground">Cal</div><div className="font-bold">{Math.round(totals.cal)}</div></div>
              <div><div className="text-xs text-muted-foreground">Pro</div><div className="font-bold">{Math.round(totals.pro)}g</div></div>
              <div><div className="text-xs text-muted-foreground">Carb</div><div className="font-bold">{Math.round(totals.carb)}g</div></div>
              <div><div className="text-xs text-muted-foreground">Gord</div><div className="font-bold">{Math.round(totals.fat)}g</div></div>
            </div>
          </Card>

          <div className="mb-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Revise e ajuste as quantidades. Alimentos em cinza não foram encontrados na base e não contam macros.
            </p>
            {result.items.map((item, i) => (
              <Card key={i} className={`p-3 ${!item.matched ? 'bg-slate-100' : ''}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {item.food_name || item.detected_name}
                      {!item.matched && <span className="ml-2 text-xs text-muted-foreground">(não reconhecido)</span>}
                    </div>
                    {item.food_name && item.food_name !== item.detected_name && (
                      <div className="text-xs text-muted-foreground">Detectado: {item.detected_name}</div>
                    )}
                    {item.notes && <div className="text-xs italic text-muted-foreground">{item.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge level={item.confidence} />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    value={item.amount_g}
                    onChange={(e) => updateItem(i, 'amount_g', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">gramas</span>
                  {item.matched && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {Math.round(item.calories_kcal ?? 0)} kcal
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setResult(null); setFile(null); }} className="flex-1">
              Refazer
            </Button>
            <Button onClick={save} disabled={saving || result.items.length === 0} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" /> Salvar refeição</>}
            </Button>
          </div>
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
