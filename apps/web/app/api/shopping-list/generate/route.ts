import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { SHOPPING_LIST_SYSTEM, buildShoppingListContext } from '@myfitlife/ai/prompts/shopping-list';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';
import { z } from 'zod';

export const maxDuration = 60;

const DAILY_LIMIT = 10;

const bodySchema = z.object({
  days: z.number().int().min(1).max(14).default(7),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const limit = await checkDailyLimit(user.id, 'shopping_list', DAILY_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'daily_limit_reached' }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  const days = parsed.success ? parsed.data.days : 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = new Date().toISOString().slice(0, 10);

  const { data: plans } = await supabase
    .from('daily_plans')
    .select('plan_date, meals_suggestion')
    .eq('user_id', user.id)
    .gte('plan_date', startStr)
    .lte('plan_date', endStr)
    .order('plan_date');

  if (!plans || plans.length === 0) {
    return NextResponse.json({
      error: 'no_plans',
      message: 'Gere um plano no Autopilot primeiro para criar sua lista.',
    }, { status: 400 });
  }

  const mealsData = plans.map((p: any) => ({
    date: p.plan_date,
    items: (p.meals_suggestion || []) as Array<{ meal_type: string; items: string[] }>,
  }));

  const context = buildShoppingListContext({
    daysCount: plans.length,
    meals: mealsData,
  });

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      system: SHOPPING_LIST_SYSTEM,
      messages: [{ role: 'user', content: context }],
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await logUsage(user.id, 'shopping_list', 1);
      return NextResponse.json({ error: 'ai_no_json' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    const itemsWithState = (result.items || []).map((i: any) => ({
      ...i,
      checked: false,
    }));

    const { data: saved, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id,
        title: result.title || `Lista de ${startStr} a ${endStr}`,
        source: 'autopilot',
        plan_date_from: startStr,
        plan_date_to: endStr,
        items: itemsWithState,
      })
      .select('id, title, items')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logUsage(user.id, 'shopping_list', 1);

    return NextResponse.json({ list: saved });
  } catch (err) {
    console.error('[shopping-list/generate]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
