'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Sparkles, ArrowRight } from 'lucide-react';

type Substitution = {
  name: string;
  equivalent_amount_g: number;
  reason: string;
  macro_similarity: 'alta' | 'média' | 'baixa';
  notes?: string;
  food_id: string | null;
  food_name: string | null;
  in_database: boolean;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
};

type Props = {
  initialFoodName?: string;
  initialAmountG?: number;
  onClose: () => void;
  onSelect?: (sub: Substitution) => void;
};

export function FoodSubstituteModal({ initialFoodName, initialAmountG, onClose, onSelect }: Props) {
  const [foodName, setFoodName] = useState(initialFoodName || '');
  const [amountG, setAmountG] = useState(initialAmountG ? String(initialAmountG) : '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ substitutions: Substitution[]; tips: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!foodName.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch('/api/nutrition/substitute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_name: foodName.trim(),
        amount_g: amountG ? parseFloat(amountG) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.message || data.error || 'Erro ao buscar substituições');
      return;
    }
    setResult(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl sm:rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div>
            <h2 className="text-lg font-bold">Substituir alimento</h2>
            <p className="text-xs text-muted-foreground">IA sugere alternativas equivalentes</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {!result && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Alimento</label>
                <Input
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Ex: peito de frango"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Quantidade (g) - opcional</label>
                <Input
                  type="number"
                  value={amountG}
                  onChange={(e) => setAmountG(e.target.value)}
                  placeholder="150"
                />
              </div>
              <Button onClick={search} disabled={loading || !foodName.trim()} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Buscar substituições</>
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.tips && (
                <p className="rounded bg-primary/5 p-3 text-sm italic">{result.tips}</p>
              )}

              <div className="space-y-2">
                {result.substitutions.map((sub, i) => (
                  <div
                    key={i}
                    className={`rounded border p-3 ${sub.in_database ? '' : 'bg-slate-50'}`}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{sub.food_name || sub.name}</span>
                          <MacroBadge similarity={sub.macro_similarity} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sub.equivalent_amount_g}g
                          {sub.in_database && sub.calories_kcal !== null && (
                            <> · {Math.round(sub.calories_kcal)} kcal · P {sub.protein_g}g · C {sub.carbs_g}g · G {sub.fats_g}g</>
                          )}
                        </div>
                      </div>
                      {onSelect && sub.in_database && (
                        <button
                          onClick={() => onSelect(sub)}
                          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                        >
                          Usar <ArrowRight className="ml-1 inline h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{sub.reason}</p>
                    {sub.notes && <p className="mt-1 text-xs italic text-muted-foreground">{sub.notes}</p>}
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={() => setResult(null)} className="w-full">
                Buscar outro alimento
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MacroBadge({ similarity }: { similarity: 'alta' | 'média' | 'baixa' }) {
  const colors: Record<string, string> = {
    alta: 'bg-green-100 text-green-800',
    'média': 'bg-amber-100 text-amber-800',
    baixa: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${colors[similarity] || colors['média']}`}>
      similaridade {similarity}
    </span>
  );
}
