import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_profiles')
    .select('target_calories, target_protein_g, target_carbs_g, target_fats_g, primary_goal, experience_level, coach_tone')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
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
      primary_goal: data?.primary_goal,
      experience_level: data?.experience_level,
      coach_tone: data?.coach_tone,
    },
  });
}
