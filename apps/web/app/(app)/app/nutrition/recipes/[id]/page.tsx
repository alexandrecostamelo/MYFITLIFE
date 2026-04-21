import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RecipeDetailClient } from './recipe-detail-client';

export const dynamic = 'force-dynamic';

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!recipe) redirect('/app/nutrition/recipes');

  return <RecipeDetailClient recipe={recipe} userId={user.id} />;
}
