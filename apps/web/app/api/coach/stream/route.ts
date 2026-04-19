import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { COACH_SYSTEM, buildCoachContext } from '@myfitlife/ai/prompts/coach';
import { computeCurrentPhase, cycleTrainingHints, cycleNutritionHints } from '@myfitlife/core/cycle';
import { checkDailyLimit, logUsage } from '@/lib/rate-limit';

export const maxDuration = 60;

const DAILY_LIMIT = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const limit = await checkDailyLimit(user.id, 'coach_stream', DAILY_LIMIT);
  if (!limit.allowed) return new Response('daily_limit_reached', { status: 429 });

  const { message, history } = await req.json();
  if (!message || typeof message !== 'string') return new Response('invalid', { status: 400 });

  const [profileRes, upRes, statsRes, checkinRes, cycleSettingsRes, cycleLastRes] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('user_profiles').select('primary_goal, experience_level').eq('user_id', user.id).single(),
    supabase.from('user_stats').select('level, current_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('morning_checkins').select('sleep_quality, energy_level, mood').eq('user_id', user.id).eq('checkin_date', new Date().toISOString().slice(0, 10)).maybeSingle(),
    supabase.from('menstrual_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('menstrual_cycles').select('period_start').eq('user_id', user.id).order('period_start', { ascending: false }).limit(1).maybeSingle(),
  ]);

  let cycleContext = '';
  if (cycleSettingsRes.data?.tracking_enabled && cycleLastRes.data) {
    const phase = computeCurrentPhase({
      lastPeriodStart: cycleLastRes.data.period_start,
      averageCycleLength: cycleSettingsRes.data.average_cycle_length || 28,
      averagePeriodLength: cycleSettingsRes.data.average_period_length || 5,
    });
    if (phase.phase !== 'unknown') {
      cycleContext = `\nFase do ciclo: ${phase.phase} (dia ${phase.dayInCycle}). Treino: ${cycleTrainingHints(phase.phase)} Nutrição: ${cycleNutritionHints(phase.phase)}`;
    }
  }

  const context = buildCoachContext({
    userName: profileRes.data?.full_name?.split(' ')[0] || 'você',
    goal: upRes.data?.primary_goal || 'general_health',
    level: upRes.data?.experience_level || 'beginner',
    streak: statsRes.data?.current_streak || 0,
    userLevel: statsRes.data?.level || 1,
    recentCheckin: checkinRes.data || null,
    extraContext: cycleContext,
  });

  const anthropic = getAnthropicClient();
  const messages = (history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content }));
  messages.push({ role: 'user', content: message });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: 1200,
          system: COACH_SYSTEM + context,
          messages,
        });

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();

        await logUsage(user.id, 'coach_stream', 1);
      } catch (err: any) {
        console.error('[coach/stream]', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || 'ai_error' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
