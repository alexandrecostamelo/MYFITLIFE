import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const itemSchema = z.object({
  food_id: z.string().uuid().nullable(),
  detected_name: z.string(),
  food_name: z.string().nullable(),
  amount_g: z.number().positive(),
  calories_kcal: z.number().nullable(),
  protein_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  fats_g: z.number().nullable(),
});

const bodySchema = z.object({
  meal_type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'pre_workout', 'post_workout']),
  items: z.array(itemSchema).min(1),
  photo_path: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const { meal_type, items, photo_path } = parsed.data;

  const inserts = items.map((item) => ({
    user_id: user.id,
    food_id: item.food_id,
    amount_g: item.amount_g,
    meal_type,
    calories_kcal: item.calories_kcal ?? 0,
    protein_g: item.protein_g ?? 0,
    carbs_g: item.carbs_g ?? 0,
    fats_g: item.fats_g ?? 0,
    input_method: 'photo',
    photo_url: photo_path,
  }));

  const { error } = await supabase.from('meal_logs').insert(inserts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, saved: inserts.length });
}
