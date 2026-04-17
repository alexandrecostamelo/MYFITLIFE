import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTargets } from '@myfitlife/core/nutrition';
import { z } from 'zod';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, city, state')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    targets: {
      cal: data?.target_calories ?? 0,
      pro: data?.target_protein_g ?? 0,
      carb: data?.target_carbs_g ?? 0,
      fat: data?.target_fats_g ?? 0,
    },
    profile: {
      full_name: profile?.full_name,
      username: profile?.username,
      avatar_url: profile?.avatar_url,
      city: profile?.city,
      state: profile?.state,
      primary_goal: data?.primary_goal,
      experience_level: data?.experience_level,
      coach_tone: data?.coach_tone,
      height_cm: data?.height_cm,
      current_weight_kg: data?.current_weight_kg,
      target_weight_kg: data?.target_weight_kg,
      diet_preference: data?.diet_preference,
      food_restrictions: data?.food_restrictions,
      injuries_notes: data?.injuries_notes,
      sleep_hours_avg: data?.sleep_hours_avg,
      available_minutes_per_day: data?.available_minutes_per_day,
      activity_level: data?.activity_level,
    },
  });
}

const patchSchema = z.object({
  full_name: z.string().min(1).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  height_cm: z.number().min(80).max(250).optional(),
  current_weight_kg: z.number().min(25).max(400).optional(),
  target_weight_kg: z.number().nullable().optional(),
  primary_goal: z.enum(['lose_fat', 'gain_muscle', 'maintain', 'general_health', 'performance']).optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  coach_tone: z.enum(['warm', 'motivational', 'technical', 'tough']).optional(),
  diet_preference: z.string().optional(),
  food_restrictions: z.array(z.string()).optional(),
  injuries_notes: z.string().optional(),
  sleep_hours_avg: z.number().min(0).max(24).optional(),
  available_minutes_per_day: z.number().min(10).max(240).optional(),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  recalculate_targets: z.boolean().optional(),
  age: z.number().min(10).max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const p = parsed.data;

  const profilePatch: Record<string, unknown> = {};
  if (p.full_name !== undefined) profilePatch.full_name = p.full_name;
  if (p.city !== undefined) profilePatch.city = p.city;
  if (p.state !== undefined) profilePatch.state = p.state;

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase.from('profiles').update(profilePatch).eq('id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userProfilePatch: Record<string, unknown> = {};
  const fields = ['height_cm', 'current_weight_kg', 'target_weight_kg', 'primary_goal', 'experience_level', 'coach_tone', 'diet_preference', 'food_restrictions', 'injuries_notes', 'sleep_hours_avg', 'available_minutes_per_day', 'activity_level'] as const;
  for (const f of fields) {
    if (p[f] !== undefined) userProfilePatch[f] = p[f];
  }

  if (p.recalculate_targets && p.age && p.current_weight_kg && p.height_cm && p.primary_goal) {
    const targets = calculateTargets({
      age: p.age,
      weight_kg: p.current_weight_kg,
      height_cm: p.height_cm,
      goal: p.primary_goal,
      activity_level: (p.activity_level as any) ?? 'moderate',
    });
    userProfilePatch.target_calories = targets.calories;
    userProfilePatch.target_protein_g = targets.protein_g;
    userProfilePatch.target_carbs_g = targets.carbs_g;
    userProfilePatch.target_fats_g = targets.fats_g;
    userProfilePatch.target_water_ml = targets.water_ml;
  }

  if (Object.keys(userProfilePatch).length > 0) {
    const { error } = await supabase.from('user_profiles').update(userProfilePatch).eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
