import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderateText } from '@/lib/moderation';
import { z } from 'zod';

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
  return NextResponse.json(data);
}
