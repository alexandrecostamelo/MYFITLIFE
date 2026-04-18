import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { FOOD_SUBSTITUTION_SYSTEM, buildSubstitutionContext } from '@myfitlife/ai/prompts/food-substitution';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';
import { z } from 'zod';

export const maxDuration = 30;

const DAILY_LIMIT = 30;

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

  const limit = await checkDailyLimit(user.id, 'food_substitution', DAILY_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: up } = await supabase
    .from('user_profiles')
    .select('food_restrictions, diet_preference')
    .eq('user_id', user.id)
    .single();

  const context = buildSubstitutionContext({
    originalName: parsed.data.food_name,
    originalAmountG: parsed.data.amount_g,
    userRestrictions: up?.food_restrictions || [],
    userPreferences: up?.diet_preference || undefined,
  });

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: FOOD_SUBSTITUTION_SYSTEM,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await logUsage(user.id, 'food_substitution', 1);
      return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    const substitutions = await Promise.all(
      (result.substitutions || []).map(async (sub: any) => {
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

    await logUsage(user.id, 'food_substitution', 1);

    return NextResponse.json({
      original: result.original,
      substitutions,
      tips: result.tips,
    });
  } catch (err) {
    console.error('[food-substitution]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
