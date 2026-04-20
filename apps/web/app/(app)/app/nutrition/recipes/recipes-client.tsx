'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Clock,
  Flame,
  ChefHat,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  initialRecipes: Record<string, unknown>[];
  regions: string[];
  diets: string[];
}

const REGION_LABELS: Record<string, string> = {
  nordestina: 'Nordeste',
  mineira: 'Minas Gerais',
  gaucha: 'Gaúcha',
  paulista: 'São Paulo',
  baiana: 'Bahia',
  nortista: 'Norte',
  carioca: 'Rio de Janeiro',
  nacional: 'Nacional',
};

const DIET_LABELS: Record<string, string> = {
  vegan: 'Vegano',
  vegetarian: 'Vegetariano',
  'gluten-free': 'Sem Glúten',
  'low-carb': 'Low Carb',
  'high-protein': 'Alto Proteína',
  pescatarian: 'Pescatariano',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  facil: 'text-green-400',
  medio: 'text-yellow-400',
  dificil: 'text-red-400',
};

export function RecipesClient({ initialRecipes, regions, diets }: Props) {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialRecipes.filter((r) => {
      if (search) {
        const title = String(r.title || '').toLowerCase();
        const desc = String(r.description || '').toLowerCase();
        const q = search.toLowerCase();
        if (!title.includes(q) && !desc.includes(q)) return false;
      }
      if (selectedRegion && String(r.region) !== selectedRegion) return false;
      if (selectedDiet) {
        const dietArr = Array.isArray(r.diet) ? r.diet.map(String) : [];
        if (!dietArr.includes(selectedDiet)) return false;
      }
      return true;
    });
  }, [initialRecipes, search, selectedRegion, selectedDiet]);

  const clearFilters = () => {
    setSearch('');
    setSelectedRegion(null);
    setSelectedDiet(null);
  };

  const hasFilters = search || selectedRegion || selectedDiet;

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
      <h1 className="display-title">Receitas Regionais</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar receita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Region chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Região</p>
        <div className="flex flex-wrap gap-1.5">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() =>
                setSelectedRegion(selectedRegion === r ? null : r)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedRegion === r
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {REGION_LABELS[r] || r}
            </button>
          ))}
        </div>
      </div>

      {/* Diet chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Dieta</p>
        <div className="flex flex-wrap gap-1.5">
          {diets.map((d) => (
            <button
              key={d}
              onClick={() =>
                setSelectedDiet(selectedDiet === d ? null : d)
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedDiet === d
                  ? 'bg-accent text-black'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {DIET_LABELS[d] || d}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters / clear */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} receita{filtered.length !== 1 ? 's' : ''}{' '}
            encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-7"
          >
            <X className="h-3 w-3 mr-1" /> Limpar filtros
          </Button>
        </div>
      )}

      {/* Recipe cards */}
      <section className="space-y-3">
        {filtered.map((recipe) => {
          const id = String(recipe.id);
          const title = String(recipe.title || '');
          const description = String(recipe.description || '');
          const region = String(recipe.region || '');
          const calories = Number(recipe.calories) || 0;
          const proteinG = Number(recipe.protein_g) || 0;
          const carbsG = Number(recipe.carbs_g) || 0;
          const fatG = Number(recipe.fat_g) || 0;
          const fiberG = Number(recipe.fiber_g) || 0;
          const prepTime = Number(recipe.prep_time_min) || 0;
          const cookTime = Number(recipe.cook_time_min) || 0;
          const totalTime = prepTime + cookTime;
          const servings = Number(recipe.servings) || 1;
          const difficulty = String(recipe.difficulty || 'medio');
          const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients.map(String)
            : [];
          const instructions = Array.isArray(recipe.instructions)
            ? recipe.instructions.map(String)
            : [];
          const dietArr = Array.isArray(recipe.diet)
            ? recipe.diet.map(String)
            : [];
          const isExpanded = expandedId === id;

          return (
            <div key={id} className="glass-card overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {description}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Quick info row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-400" />
                    {calories} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {totalTime} min
                  </span>
                  <span
                    className={`flex items-center gap-1 ${DIFFICULTY_COLORS[difficulty] || ''}`}
                  >
                    <ChefHat className="h-3 w-3" />
                    {DIFFICULTY_LABELS[difficulty] || difficulty}
                  </span>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-white/5 text-[10px]">
                    {REGION_LABELS[region] || region}
                  </span>
                </div>

                {/* Diet badges */}
                {dietArr.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dietArr.map((d) => (
                      <span
                        key={d}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent"
                      >
                        {DIET_LABELS[d] || d}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-4">
                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="glass-card p-2">
                      <p className="font-mono text-sm font-light">
                        {proteinG}g
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Proteína
                      </p>
                    </div>
                    <div className="glass-card p-2">
                      <p className="font-mono text-sm font-light">
                        {carbsG}g
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Carbs
                      </p>
                    </div>
                    <div className="glass-card p-2">
                      <p className="font-mono text-sm font-light">
                        {fatG}g
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Gordura
                      </p>
                    </div>
                    <div className="glass-card p-2">
                      <p className="font-mono text-sm font-light">
                        {fiberG}g
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Fibra
                      </p>
                    </div>
                  </div>

                  {/* Time & servings */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Preparo: {prepTime} min</span>
                    <span>Cozimento: {cookTime} min</span>
                    <span>Rende: {servings} porções</span>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2">
                      Ingredientes
                    </h4>
                    <ul className="space-y-1">
                      {ingredients.map((ing, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-accent mt-0.5">•</span>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2">
                      Modo de Preparo
                    </h4>
                    <ol className="space-y-2">
                      {instructions.map((step, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex gap-2"
                        >
                          <span className="font-mono text-accent shrink-0">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Empty state */}
      {filtered.length === 0 && (
        <section className="glass-card p-6 text-center space-y-2">
          <ChefHat className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Nenhuma receita encontrada com esses filtros.
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </section>
      )}
    </main>
  );
}
