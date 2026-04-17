import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTargets } from '@myfitlife/core/nutrition';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(1),
  age: z.number().min(10).max(120),
  height_cm: z.number().min(80).max(250),
  current_weight_kg: z.number().min(25).max(400),
  target_weight_kg: z.number().nullable(),
  primary_goal: z.enum([
    'lose_fat',
    'gain_muscle',
    'maintain',
    'general_health',
    'performance',
  ]),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  training_locations: z.array(z.string()),
  available_equipment: z.array(z.string()),
  days_per_week: z.number().min(1).max(7),
  minutes_per_session: z.number().min(10).max(240),
  diet_preference: z.string(),
  food_restrictions: z.array(z.string()),
  injuries_notes: z.string().default(''),
  sleep_hours_avg: z.number().min(0).max(24),
  coach_tone: z.enum(['warm', 'motivational', 'technical', 'tough']),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_profile', issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const p = parsed.data;

  const targets = calculateTargets({
    age: p.age,
    weight_kg: p.current_weight_kg,
    height_cm: p.height_cm,
    goal: p.primary_goal,
    activity_level: 'moderate',
  });

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      full_name: p.full_name,
      onboarding_completed: true,
    })
    .eq('id', user.id);

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const { error: userProfileErr } = await supabase
    .from('user_profiles')
    .update({
      height_cm: p.height_cm,
      current_weight_kg: p.current_weight_kg,
      target_weight_kg: p.target_weight_kg,
      primary_goal: p.primary_goal,
      experience_level: p.experience_level,
      preferred_training_locations: p.training_locations as any,
      available_equipment: p.available_equipment,
      diet_preference: p.diet_preference as any,
      food_restrictions: p.food_restrictions,
      injuries_notes: p.injuries_notes,
      sleep_hours_avg: p.sleep_hours_avg,
      coach_tone: p.coach_tone,
      available_minutes_per_day: p.minutes_per_session,
      target_calories: targets.calories,
      target_protein_g: targets.protein_g,
      target_carbs_g: targets.carbs_g,
      target_fats_g: targets.fats_g,
      target_water_ml: targets.water_ml,
    })
    .eq('user_id', user.id);

  if (userProfileErr) {
    return NextResponse.json({ error: userProfileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
