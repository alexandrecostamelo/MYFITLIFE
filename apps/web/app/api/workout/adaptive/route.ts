import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { ADAPTIVE_WORKOUT_SYSTEM, buildAdaptiveWorkoutContext } from '@myfitlife/ai/prompts/adaptive-workout';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';
import { z } from 'zod';

export const maxDuration = 60;

const DAILY_LIMIT = 20;

const bodySchema = z.object({
  gym_id: z.string().uuid(),
  focus: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = await checkDailyLimit(user.id, 'adaptive_workout', DAILY_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: gym } = await supabase
    .from('user_gyms')
    .select('id, name')
    .eq('id', parsed.data.gym_id)
    .eq('user_id', user.id)
    .single();

  if (!gym) return NextResponse.json({ error: 'gym_not_found' }, { status: 404 });

  const { data: equipment } = await supabase
    .from('gym_equipment')
    .select('name')
    .eq('gym_id', gym.id);

  const equipmentList = (equipment || []).map((e: any) => e.name);
  if (equipmentList.length === 0) {
    return NextResponse.json({ error: 'no_equipment', message: 'Essa academia ainda não tem aparelhos cadastrados.' }, { status: 400 });
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const { data: up } = await supabase
    .from('user_profiles')
    .select('primary_goal, experience_level, injuries_notes, available_minutes_per_day')
    .eq('user_id', user.id)
    .single();

  const context = buildAdaptiveWorkoutContext({
    userName: profile?.full_name?.split(' ')[0] || 'atleta',
    goal: up?.primary_goal || 'general_health',
    level: up?.experience_level || 'beginner',
    injuriesNotes: up?.injuries_notes || '',
    minutesAvailable: up?.available_minutes_per_day || 60,
    focus: parsed.data.focus,
    gymName: gym.name,
    availableEquipment: equipmentList,
  });

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: ADAPTIVE_WORKOUT_SYSTEM,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await logUsage(user.id, 'adaptive_workout', 1);
      return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });
    }

    const workout = JSON.parse(jsonMatch[0]);

    await logUsage(user.id, 'adaptive_workout', 1);

    return NextResponse.json({
      workout,
      gym: { id: gym.id, name: gym.name },
      equipment_count: equipmentList.length,
    });
  } catch (err) {
    console.error('[adaptive-workout]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
