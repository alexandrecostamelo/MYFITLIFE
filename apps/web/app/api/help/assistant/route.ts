import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callWithRetry, CLAUDE_MODEL_FAST } from '@myfitlife/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SYSTEM_PROMPT = `Você é o assistente de ajuda do MyFitLife, um app de fitness com IA como coach pessoal.

Sua função é ajudar os usuários a entenderem e usarem todas as funcionalidades do app:
- Treinos personalizados com IA (geração automática, splits, progressão)
- Nutrição inteligente (plano alimentar, contagem de macros, substituições, foto de refeição)
- Check-in diário (humor, dor, energia, peso, sono)
- Coach IA (chat para dúvidas de fitness, dicas, motivação)
- Gamificação (XP, níveis, streaks, conquistas, quests diárias)
- Social (feed, amigos, desafios, grupos, transformações)
- Trilhas guiadas (21/30/60 dias)
- Fotos de progresso e medidas corporais
- Explorar academias e profissionais

Regras:
- Responda SEMPRE em português do Brasil
- Seja conciso e direto (máximo 3-4 frases)
- Use linguagem amigável e motivacional
- Se não souber algo específico do app, diga honestamente
- Não invente funcionalidades que não existem
- Foque em ajudar o usuário a navegar e usar o app`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { message, context, history } = body as {
    message: string;
    context: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!message || typeof message !== 'string' || message.length > 500) {
    return NextResponse.json({ error: 'invalid message' }, { status: 400 });
  }

  const contextLine = context ? `\n[O usuário está na página: ${context}]` : '';

  const messages = [
    ...(history || []).slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content),
    })),
    { role: 'user' as const, content: `${message}${contextLine}` },
  ];

  try {
    const result = await callWithRetry({
      model: CLAUDE_MODEL_FAST,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.3,
      feature: 'help_assistant',
      userId: user.id,
    });

    // Log usage
    await supabase
      .from('ai_usage_log')
      .insert({
        user_id: user.id,
        feature: 'help_assistant',
        model: result.model_used,
        input_tokens: result.input_tokens,
        output_tokens: result.output_tokens,
        latency_ms: result.latency_ms,
      } as Record<string, unknown>);

    return NextResponse.json({ reply: result.text });
  } catch (err: any) {
    console.error('[help/assistant] Error:', err?.message);
    return NextResponse.json(
      { reply: 'Desculpe, estou com dificuldade no momento. Tente novamente em alguns segundos.' },
      { status: 200 },
    );
  }
}
