import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RecipesClient } from './recipes-client';

export const dynamic = 'force-dynamic';

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_active', true)
    .order('title')
    .limit(100);

  // Extract unique regions and diets for filters
  const allRecipes = (recipes || []) as Record<string, unknown>[];
  const regions = [
    ...new Set(allRecipes.map((r) => String(r.region)).filter(Boolean)),
  ].sort();
  const diets = [
    ...new Set(
      allRecipes.flatMap((r) => {
        const d = r.diet;
        return Array.isArray(d) ? d.map(String) : [];
      }),
    ),
  ].sort();

  return (
    <RecipesClient
      initialRecipes={allRecipes}
      regions={regions}
      diets={diets}
    />
  );
}
