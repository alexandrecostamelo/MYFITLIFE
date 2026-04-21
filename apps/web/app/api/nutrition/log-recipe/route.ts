import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  recipe_id: z.string().uuid(),
  meal_type: z.enum([
    'breakfast',
    'morning_snack',
    'lunch',
    'afternoon_snack',
    'dinner',
    'evening_snack',
    'pre_workout',
    'post_workout',
  ]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { recipe_id, meal_type } = parsed.data;

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, title, calories, protein_g, carbs_g, fat_g, servings')
    .eq('id', recipe_id)
    .eq('is_active', true)
    .single();

  if (!recipe)
    return NextResponse.json({ error: 'recipe_not_found' }, { status: 404 });

  const rec = recipe as Record<string, unknown>;

  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    meal_type,
    calories_kcal: Number(rec.calories) || 0,
    protein_g: Number(rec.protein_g) || 0,
    carbs_g: Number(rec.carbs_g) || 0,
    fats_g: Number(rec.fat_g) || 0,
    amount_g: 0,
    input_method: 'recipe',
    food_id: null,
  } as Record<string, unknown>);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { awardXp, touchActivity } = await import('@/lib/gamification');
  await awardXp(supabase, user.id, 'MEAL_LOGGED');
  await touchActivity(supabase, user.id);

  return NextResponse.json({ ok: true });
}
