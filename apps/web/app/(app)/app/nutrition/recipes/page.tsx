import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RecipesClient } from './recipes-client';

export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; region?: string; diet?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1'));
  const offset = (page - 1) * PER_PAGE;

  // Fetch all regions/diets for filters (lightweight query)
  const { data: allActive } = await supabase
    .from('recipes')
    .select('region, diet')
    .eq('is_active', true);

  const allRows = (allActive || []) as Record<string, unknown>[];
  const regions = [
    ...new Set(allRows.map((r) => String(r.region)).filter(Boolean)),
  ].sort();
  const diets = [
    ...new Set(
      allRows.flatMap((r) => {
        const d = r.diet;
        return Array.isArray(d) ? d.map(String) : [];
      }),
    ),
  ].sort();

  // Build paginated query with filters
  let query = supabase
    .from('recipes')
    .select(
      'id, title, description, region, diet, calories, protein_g, carbs_g, fat_g, fiber_g, prep_time_min, cook_time_min, servings, difficulty, ingredients, instructions, tags',
      { count: 'exact' },
    )
    .eq('is_active', true)
    .order('title')
    .range(offset, offset + PER_PAGE - 1);

  if (params.region) query = query.eq('region', params.region);
  if (params.diet) query = query.contains('diet', [params.diet]);
  if (params.q) query = query.ilike('title', `%${params.q}%`);

  const { data: recipes, count } = await query;
  const totalPages = Math.ceil((count || 0) / PER_PAGE);

  return (
    <RecipesClient
      initialRecipes={(recipes || []) as Record<string, unknown>[]}
      regions={regions}
      diets={diets}
      page={page}
      totalPages={totalPages}
      serverRegion={params.region}
      serverDiet={params.diet}
      serverQuery={params.q}
    />
  );
}
