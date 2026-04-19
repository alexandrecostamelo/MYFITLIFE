import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { buildCoachSystemPrompt } from '@myfitlife/ai/prompts/coach';
import { getCachedResponse, setCachedResponse } from '@myfitlife/ai/cache';
import { enforceRateLimit } from '@/lib/rate-limit/with-rate-limit';
import { z } from 'zod';

const bodySchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().min(1),
  no_cache: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const gate = await enforceRateLimit(req, 'coach_chat');
  if (gate instanceof NextResponse) return gate;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const { data: up } = await supabase
    .from('user_profiles')
    .select('primary_goal, experience_level, coach_tone, target_calories, target_protein_g')
    .eq('user_id', user.id)
    .single();

  let convId = parsed.data.conversation_id;
  if (!convId) {
    const { data: newConv } = await supabase
      .from('coach_conversations')
      .insert({ user_id: user.id, title: parsed.data.message.slice(0, 60) })
      .select('id')
      .single();
    convId = newConv!.id;
  }

  await supabase.from('coach_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: parsed.data.message,
  });

  const { data: history } = await supabase
    .from('coach_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(50);

  const systemPrompt = buildCoachSystemPrompt({
    userName: profile?.full_name?.split(' ')[0] || 'você',
    tone: (up?.coach_tone as any) || 'warm',
    goal: up?.primary_goal || 'general_health',
    level: up?.experience_level || 'beginner',
    targetCalories: up?.target_calories,
    targetProteinG: up?.target_protein_g,
  });

  const bypassCache = parsed.data.no_cache === true;
  const isFirstMessage = (history || []).length === 1;

  // Cache lookup — only for first message in conversation (generic questions)
  if (!bypassCache && isFirstMessage) {
    const cached = await getCachedResponse(parsed.data.message, {
      context: 'coach_general',
      model: CLAUDE_MODEL,
    });
    if (cached) {
      await supabase.from('coach_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: cached,
        model: CLAUDE_MODEL,
        tokens_used: 0,
      });
      return NextResponse.json({ conversation_id: convId, reply: cached, cached: true });
    }
  }

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: (history || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
    });

    const reply = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    await supabase.from('coach_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: reply,
      model: CLAUDE_MODEL,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });

    // Cache set — only for first message (generic question, no personal context)
    if (!bypassCache && isFirstMessage) {
      setCachedResponse(
        parsed.data.message,
        reply,
        response.usage.input_tokens,
        response.usage.output_tokens,
        { context: 'coach_general', model: CLAUDE_MODEL }
      ).catch((err) => console.error('[coach/chat] cache set failed:', err));
    }

    return NextResponse.json({ conversation_id: convId, reply, cached: false });
  } catch (err) {
    console.error('[coach/chat]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const convId = req.nextUrl.searchParams.get('conversation_id');

  if (convId) {
    const { data } = await supabase
      .from('coach_messages')
      .select('role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    return NextResponse.json({ messages: data });
  }

  const { data } = await supabase
    .from('coach_conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20);
  return NextResponse.json({ conversations: data });
}
