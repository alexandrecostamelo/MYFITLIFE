import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { AUTOPILOT_DAILY_SYSTEM, buildAutopilotContext } from '@myfitlife/ai/prompts/autopilot';
import { buildSystemPrompt } from '@/lib/ai/personas';
import { enforceRateLimit } from '@/lib/rate-limit/with-rate-limit';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await enforceRateLimit(req, 'autopilot_generate');
  if (gate instanceof NextResponse) return gate;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from('daily_plans')
    .select('id, meals_suggestion, water_goal_ml, ai_notes, habits')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ plan: existing });
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, coach_persona').eq('id', user.id).single();
  const { data: up } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!up) return NextResponse.json({ error: 'profile_incomplete' }, { status: 400 });

  const { data: checkin } = await supabase
    .from('morning_checkins')
    .select('sleep_quality, energy_level, sore_muscles, soreness_details')
    .eq('user_id', user.id)
    .eq('checkin_date', today)
    .maybeSingle();

  const { data: primaryGym } = await supabase
    .from('user_gyms')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();

  let activeGym: { name: string; equipment: string[] } | null = null;
  if (primaryGym) {
    const { data: gymEq } = await supabase
      .from('gym_equipment')
      .select('name')
      .eq('gym_id', primaryGym.id);
    activeGym = {
      name: primaryGym.name,
      equipment: (gymEq || []).map((e: any) => e.name),
    };
  }

  const weekdayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const weekdayName = weekdayNames[new Date().getDay()];

  const context = buildAutopilotContext({
    userName: profile?.full_name?.split(' ')[0] || 'você',
    goal: up.primary_goal,
    level: up.experience_level,
    targetCalories: up.target_calories ?? 2000,
    targetProteinG: up.target_protein_g ?? 120,
    targetCarbsG: up.target_carbs_g ?? 200,
    targetFatsG: up.target_fats_g ?? 60,
    dietPreference: up.diet_preference ?? 'balanced',
    foodRestrictions: up.food_restrictions ?? [],
    trainingLocations: (up.preferred_training_locations as any) ?? ['gym'],
    availableEquipment: up.available_equipment ?? [],
    injuriesNotes: up.injuries_notes ?? '',
    daysPerWeek: 5,
    minutesPerSession: up.available_minutes_per_day ?? 60,
    weekdayName,
    lastCheckin: checkin ? {
      sleep_quality: checkin.sleep_quality,
      energy_level: checkin.energy_level,
      sore_muscles: checkin.sore_muscles,
      soreness_details: checkin.soreness_details as any,
    } : undefined,
    activeGym,
  });

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: buildSystemPrompt(String(profile?.coach_persona || 'leo'), AUTOPILOT_DAILY_SYSTEM),
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });

    const plan = JSON.parse(jsonMatch[0]);

    const { data: saved, error } = await supabase
      .from('daily_plans')
      .insert({
        user_id: user.id,
        plan_date: today,
        meals_suggestion: plan.meals,
        water_goal_ml: plan.water_goal_ml,
        habits: { workout: plan.workout, active_gym: activeGym?.name || null },
        ai_notes: plan.coach_message,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ plan: saved });
  } catch (err) {
    console.error('[autopilot/generate]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
