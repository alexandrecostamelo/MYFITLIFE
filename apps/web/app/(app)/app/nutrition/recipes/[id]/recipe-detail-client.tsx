'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Flame,
  Loader2,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  recipe: Record<string, unknown>;
  userId: string;
}

const REGION_LABELS: Record<string, string> = {
  nordestina: 'Nordestina',
  mineira: 'Mineira',
  gaucha: 'Gaúcha',
  paulista: 'Paulista',
  baiana: 'Baiana',
  nortista: 'Nortista',
  carioca: 'Carioca',
  nacional: 'Nacional',
};

export function RecipeDetailClient({ recipe }: Props) {
  const router = useRouter();
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const title = String(recipe.title || '');
  const description = String(recipe.description || '');
  const region = String(recipe.region || '');
  const difficulty = String(recipe.difficulty || 'medio');
  const calories = Number(recipe.calories) || 0;
  const proteinG = Number(recipe.protein_g) || 0;
  const carbsG = Number(recipe.carbs_g) || 0;
  const fatG = Number(recipe.fat_g) || 0;
  const fiberG = Number(recipe.fiber_g) || 0;
  const prepTime = Number(recipe.prep_time_min) || 0;
  const cookTime = Number(recipe.cook_time_min) || 0;
  const totalTime = prepTime + cookTime;
  const servings = Number(recipe.servings) || 1;
  const ingredients = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as { item: string; qty: string }[])
    : [];
  const instructions = Array.isArray(recipe.instructions)
    ? (recipe.instructions as string[])
    : [];
  const dietArr = Array.isArray(recipe.diet)
    ? (recipe.diet as string[])
    : [];

  const logAsMeal = async () => {
    setLogging(true);
    try {
      const res = await fetch('/api/nutrition/log-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipe.id,
          meal_type: 'lunch',
        }),
      });
      if (res.ok) setLogged(true);
    } finally {
      setLogging(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-4 pb-28 space-y-5">
      <Link
        href="/app/nutrition/recipes"
        className="flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Receitas
      </Link>

      <div>
        <h1 className="display-title">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {region && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">
            {REGION_LABELS[region] || region}
          </span>
        )}
        {dietArr.map((d) => (
          <span
            key={d}
            className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs"
          >
            {d}
          </span>
        ))}
        {difficulty && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">
            {difficulty}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="glass-card p-3 text-center">
          <Flame className="h-4 w-4 mx-auto text-accent mb-1" />
          <p className="font-mono text-lg font-light">{calories}</p>
          <p className="text-[9px] text-muted-foreground">kcal</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg font-light">{proteinG}g</p>
          <p className="text-[9px] text-muted-foreground">proteína</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg font-light">{carbsG}g</p>
          <p className="text-[9px] text-muted-foreground">carbs</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="font-mono text-lg font-light">{fatG}g</p>
          <p className="text-[9px] text-muted-foreground">gordura</p>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {totalTime} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {servings}{' '}
          {servings === 1 ? 'porção' : 'porções'}
        </span>
        <span className="flex items-center gap-1">
          <ChefHat className="h-3 w-3" /> {difficulty}
        </span>
      </div>

      <section className="glass-card p-4 space-y-2">
        <h2 className="section-title">Ingredientes</h2>
        {ingredients.map((ing, i) => {
          const item =
            typeof ing === 'object' ? String(ing.item) : String(ing);
          const qty = typeof ing === 'object' ? String(ing.qty || '') : '';
          return (
            <div
              key={i}
              className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0"
            >
              <span>{item}</span>
              {qty && (
                <span className="text-muted-foreground text-xs">{qty}</span>
              )}
            </div>
          );
        })}
      </section>

      <section className="glass-card p-4 space-y-3">
        <h2 className="section-title">Modo de Preparo</h2>
        {instructions.map((step, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center font-semibold">
              {i + 1}
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {String(step)}
            </p>
          </div>
        ))}
      </section>

      {fiberG > 0 && (
        <div className="text-xs text-muted-foreground">
          Fibras: {fiberG}g por porção
        </div>
      )}

      <div className="sticky bottom-20 z-10">
        <Button
          onClick={logAsMeal}
          disabled={logging || logged}
          className="w-full"
          size="lg"
        >
          {logging && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {logged && <Check className="h-4 w-4 mr-2" />}
          {logged ? 'Registrado!' : 'Registrar como refeição'}
        </Button>
      </div>
    </main>
  );
}
