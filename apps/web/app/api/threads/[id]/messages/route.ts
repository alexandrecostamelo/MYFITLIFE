import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderateText } from '@/lib/moderation';
import { z } from 'zod';
import { notifyChatMessage } from '@/lib/push/events';

export const maxDuration = 20;

const schema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const moderation = await moderateText(parsed.data.content);
  if (moderation.decision === 'flagged') {
    return NextResponse.json({ error: 'flagged', reason: moderation.reason }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('professional_messages')
    .insert({
      thread_id: id,
      sender_id: user.id,
      content: parsed.data.content,
    })
    .select('id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the other participant
  const { data: thread } = await supabase
    .from('professional_threads')
    .select('client_id, professional_id, professionals(user_id)')
    .eq('id', id)
    .maybeSingle();
  if (thread) {
    const t = thread as Record<string, unknown>;
    const profArr = t.professionals as { user_id: string }[] | { user_id: string } | null;
    const professionalUserId = Array.isArray(profArr)
      ? profArr[0]?.user_id
      : (profArr as { user_id: string } | null)?.user_id;
    const recipientId =
      t.client_id === user.id
        ? professionalUserId
        : (t.client_id as string);
    if (recipientId) {
      notifyChatMessage(user.id, recipientId, id, parsed.data.content).catch(console.error);
    }
  }

  return NextResponse.json(data);
}
