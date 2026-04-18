import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const bodySchema = z.object({
  food_id: z.string().uuid(),
  amount_g: z.number().positive(),
  meal_type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'pre_workout', 'post_workout']),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { food_id, amount_g, meal_type } = parsed.data;

  const { data: food } = await supabase
    .from('foods')
    .select('calories_kcal, protein_g, carbs_g, fats_g')
    .eq('id', food_id)
    .single();

  if (!food) return NextResponse.json({ error: 'food_not_found' }, { status: 404 });

  const factor = amount_g / 100;

  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    food_id,
    amount_g,
    meal_type,
    calories_kcal: Math.round(food.calories_kcal * factor * 100) / 100,
    protein_g: Math.round(food.protein_g * factor * 100) / 100,
    carbs_g: Math.round(food.carbs_g * factor * 100) / 100,
    fats_g: Math.round(food.fats_g * factor * 100) / 100,
    input_method: 'manual',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { awardXp, touchActivity, checkAchievements } = await import('@/lib/gamification');
  await awardXp(supabase, user.id, 'MEAL_LOGGED');
  await touchActivity(supabase, user.id);
  await checkAchievements(supabase, user.id);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const start = `${date}T00:00:00`;
  const end = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('meal_logs')
    .select('id, logged_at, meal_type, amount_g, calories_kcal, protein_g, carbs_g, fats_g, food_id, foods(name)')
    .eq('user_id', user.id)
    .gte('logged_at', start)
    .lte('logged_at', end)
    .order('logged_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meals: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
