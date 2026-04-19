import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FOOD_SUBSTITUTION_SYSTEM, buildSubstitutionContext } from '@myfitlife/ai/prompts/food-substitution';
import { callAI } from '@/lib/ai-call';
import { checkAndIncrementLimit } from '@/lib/rate-limit-v2';
import { checkPromptSafety } from '@/lib/prompt-safety';
import { z } from 'zod';

export const maxDuration = 30;

const bodySchema = z.object({
  food_name: z.string().min(1).max(100),
  amount_g: z.number().positive().optional(),
});

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = await checkAndIncrementLimit(supabase, user.id, 'food_substitution');
  if (!limit.allowed) {
    return NextResponse.json({ error: 'daily_limit_reached', reset_at: limit.resetAt }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const safety = checkPromptSafety(parsed.data.food_name);
  if (!safety.safe) return NextResponse.json({ error: 'unsafe_input' }, { status: 400 });

  const { data: up } = await supabase
    .from('user_profiles')
    .select('food_restrictions, diet_preference')
    .eq('user_id', user.id)
    .single();

  const context = buildSubstitutionContext({
    originalName: safety.sanitized,
    originalAmountG: parsed.data.amount_g,
    userRestrictions: up?.food_restrictions || [],
    userPreferences: up?.diet_preference || undefined,
  });

  const cacheInput = `${safety.sanitized}|${parsed.data.amount_g || ''}|${(up?.food_restrictions || []).sort().join(',')}|${up?.diet_preference || ''}`;

  try {
    const result = await callAI({
      feature: 'food_substitution',
      userId: user.id,
      system: FOOD_SUBSTITUTION_SYSTEM,
      messages: [{ role: 'user', content: context }],
      max_tokens: 1500,
      cache_input: cacheInput,
      cache_ttl_minutes: 60 * 24 * 7,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });

    const aiResult = JSON.parse(jsonMatch[0]);

    const substitutions = await Promise.all(
      (aiResult.substitutions || []).map(async (sub: any) => {
        const searchTerm = normalize(sub.name);
        const { data: matches } = await supabase
          .from('foods')
          .select('id, name, calories_kcal, protein_g, carbs_g, fats_g')
          .ilike('name', `%${searchTerm}%`)
          .limit(1);

        const match = matches?.[0];
        const factor = (sub.equivalent_amount_g || 0) / 100;

        return {
          ...sub,
          food_id: match?.id || null,
          food_name: match?.name || null,
          in_database: !!match,
          calories_kcal: match ? Math.round(match.calories_kcal * factor * 100) / 100 : null,
          protein_g: match ? Math.round(match.protein_g * factor * 100) / 100 : null,
          carbs_g: match ? Math.round(match.carbs_g * factor * 100) / 100 : null,
          fats_g: match ? Math.round(match.fats_g * factor * 100) / 100 : null,
        };
      })
    );

    return NextResponse.json({
      original: aiResult.original,
      substitutions,
      tips: aiResult.tips,
      _cached: result.cached,
    });
  } catch (err: any) {
    console.error('[food-substitution]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
