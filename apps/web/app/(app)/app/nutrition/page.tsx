'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { FoodSubstituteModal } from '@/components/food-substitute-modal';
import { Plus, Trash2, Loader2, Camera, Replace } from 'lucide-react';
import { FirstTimeTooltip } from '@/components/help/first-time-tooltip';

type Food = {
  id: string;
  name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
};

type Meal = {
  id: string;
  meal_type: string;
  amount_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  foods: { name: string } | null;
};

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

export default function NutritionPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);
  const [amount, setAmount] = useState('100');
  const [mealType, setMealType] = useState('lunch');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [targets, setTargets] = useState<{ cal: number; pro: number; carb: number; fat: number }>({ cal: 0, pro: 0, carb: 0, fat: 0 });
  const [saving, setSaving] = useState(false);
  const [substituteOpen, setSubstituteOpen] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.foods || []);
    setSearching(false);
  }

  async function loadMeals() {
    const res = await fetch('/api/meals');
    const data = await res.json();
    setMeals(data.meals || []);
  }

  async function loadTargets() {
    const res = await fetch('/api/profile');
    const data = await res.json();
    if (data.targets) setTargets(data.targets);
  }

  useEffect(() => { loadMeals(); loadTargets(); }, []);

  async function addMeal() {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_id: selected.id, amount_g: parseFloat(amount), meal_type: mealType }),
    });
    setSelected(null);
    setQuery('');
    setResults([]);
    setAmount('100');
    await loadMeals();
    setSaving(false);
  }

  async function removeMeal(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: 'DELETE' });
    await loadMeals();
  }

  const totals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + Number(m.calories_kcal),
      pro: acc.pro + Number(m.protein_g),
      carb: acc.carb + Number(m.carbs_g),
      fat: acc.fat + Number(m.fats_g),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0 }
  );

  const byMealType = MEAL_TYPES.map((mt) => ({
    ...mt,
    meals: meals.filter((m) => m.meal_type === mt.value),
  })).filter((g) => g.meals.length > 0);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Nutrição</h1>

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Cal</div>
            <div className="text-lg font-bold">{Math.round(totals.cal)}</div>
            <div className="text-xs text-muted-foreground">/{targets.cal}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Pro</div>
            <div className="text-lg font-bold">{Math.round(totals.pro)}</div>
            <div className="text-xs text-muted-foreground">/{targets.pro}g</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Carb</div>
            <div className="text-lg font-bold">{Math.round(totals.carb)}</div>
            <div className="text-xs text-muted-foreground">/{targets.carb}g</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Gord</div>
            <div className="text-lg font-bold">{Math.round(totals.fat)}</div>
            <div className="text-xs text-muted-foreground">/{targets.fat}g</div>
          </div>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-medium">Adicionar rápido</h2>
        <div className="grid grid-cols-2 gap-2">
          <FirstTimeTooltip
            id="nutrition-photo"
            title="Foto de Refeição"
            description="Tire uma foto do seu prato e a IA identifica os alimentos e calcula os macros automaticamente!"
            position="top"
          >
          <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3">
            <Link href="/app/nutrition/photo">
              <Camera className="h-5 w-5" />
              <span className="text-xs">Por foto (IA)</span>
            </Link>
          </Button>
          </FirstTimeTooltip>
          <Button variant="outline" onClick={() => setSubstituteOpen(true)} className="h-auto flex-col gap-1 py-3">
            <Replace className="h-5 w-5" />
            <span className="text-xs">Substituir alimento</span>
          </Button>
        </div>
      </Card>

      <Card className="mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium">Adicionar alimento</h2>
        <Input
          placeholder="Buscar alimento..."
          value={query}
          onChange={(e) => search(e.target.value)}
          className="mb-2"
        />
        {searching && <Loader2 className="h-4 w-4 animate-spin" />}
        {results.length > 0 && !selected && (
          <div className="mb-2 max-h-64 overflow-y-auto rounded border">
            {results.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="flex w-full flex-col border-b p-2 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {f.calories_kcal} kcal · P {f.protein_g}g · C {f.carbs_g}g · G {f.fats_g}g (por 100g)
                </span>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="space-y-2">
            <div className="rounded bg-slate-100 p-2 text-sm">
              <div className="font-medium">{selected.name}</div>
              <div className="text-xs text-muted-foreground">
                {Math.round(selected.calories_kcal * (parseFloat(amount) || 0) / 100)} kcal em {amount}g
              </div>
            </div>
            <div className="flex gap-2">
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="gramas" />
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {MEAL_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>{mt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={addMeal} disabled={saving || !amount} className="flex-1">
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {byMealType.map((group) => (
          <Card key={group.value} className="p-4">
            <h3 className="mb-2 text-sm font-medium">{group.label}</h3>
            <div className="space-y-2">
              {group.meals.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div>{m.foods?.name || 'Alimento'}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.amount_g}g · {Math.round(Number(m.calories_kcal))} kcal
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeMeal(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {substituteOpen && (
        <FoodSubstituteModal
          onClose={() => setSubstituteOpen(false)}
        />
      )}
    </main>
  );
}
