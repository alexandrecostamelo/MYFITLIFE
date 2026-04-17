import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { ONBOARDING_SYSTEM_PROMPT } from '@myfitlife/ai/prompts/onboarding';
import { z } from 'zod';

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: ONBOARDING_SYSTEM_PROMPT,
      messages: parsed.data.messages,
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let profileComplete = null;
    if (jsonMatch) {
      try {
        profileComplete = JSON.parse(jsonMatch[1]);
      } catch {
        profileComplete = null;
      }
    }

    return NextResponse.json({
      reply: text.replace(/```json[\s\S]*?```/g, '').trim(),
      profile: profileComplete,
    });
  } catch (err) {
    console.error('[onboarding/chat]', err);
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
