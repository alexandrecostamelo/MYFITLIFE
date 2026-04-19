import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL, CLAUDE_FALLBACK_MODEL, estimateCost } from '@myfitlife/ai/client';
import { COACH_SYSTEM } from '@myfitlife/ai/prompts/coach';
import { checkAndIncrementLimit } from '@/lib/rate-limit-v2';
import { checkPromptSafety } from '@/lib/prompt-safety';
import { buildRichCoachContext } from '@/lib/coach-context';
import { enforceRateLimit } from '@/lib/rate-limit/with-rate-limit';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const gate = await enforceRateLimit(req, 'coach_chat');
  if (gate instanceof NextResponse) return gate;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  const limit = await checkAndIncrementLimit(supabase, user.id, 'coach_stream');
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: 'daily_limit_reached', reset_at: limit.resetAt }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, history } = await req.json();
  if (!message || typeof message !== 'string') return new Response('invalid', { status: 400 });

  const safety = checkPromptSafety(message);
  if (!safety.safe) {
    return new Response(JSON.stringify({ error: 'unsafe_prompt', reason: safety.reason }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const richContext = await buildRichCoachContext(supabase, user.id);

  const messages = (history || []).slice(-10).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: typeof m.content === 'string' ? m.content : String(m.content),
  }));
  messages.push({ role: 'user', content: safety.sanitized });

  const encoder = new TextEncoder();
  const startedAt = Date.now();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let modelUsed = CLAUDE_MODEL;
  let fallbackUsed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const anthropic = getAnthropicClient();

      const tryStream = async (model: string): Promise<boolean> => {
        try {
          const response = anthropic.messages.stream({
            model,
            max_tokens: 1200,
            system: COACH_SYSTEM + '\n\n' + richContext,
            messages,
          });

          for await (const event of response) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }

          const finalMessage = await response.finalMessage();
          totalInputTokens = finalMessage.usage.input_tokens;
          totalOutputTokens = finalMessage.usage.output_tokens;
          modelUsed = model;
          return true;
        } catch (err: any) {
          const status = err?.status || err?.response?.status;
          const isRetriable = status === 429 || status === 500 || status === 502 || status === 503 || status === 529;
          return !isRetriable;
        }
      };

      const primaryOk = await tryStream(CLAUDE_MODEL);

      if (!primaryOk) {
        fallbackUsed = true;
        const fallbackOk = await tryStream(CLAUDE_FALLBACK_MODEL);
        if (!fallbackOk) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'ai_error' })}\n\n`));
        }
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();

      const cost = estimateCost(modelUsed, totalInputTokens, totalOutputTokens);
      await supabase.from('ai_usage_metrics').insert({
        user_id: user.id,
        feature: 'coach_stream',
        model: modelUsed,
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        cached_tokens: 0,
        cost_estimate_usd: cost,
        latency_ms: Date.now() - startedAt,
        cache_hit: false,
        fallback_used: fallbackUsed,
      });
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
