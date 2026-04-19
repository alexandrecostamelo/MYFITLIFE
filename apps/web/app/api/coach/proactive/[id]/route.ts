import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({ action: z.enum(['read', 'dismiss']) });

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const updates: any = {};
  if (parsed.data.action === 'read') updates.read_at = new Date().toISOString();
  if (parsed.data.action === 'dismiss') updates.dismissed_at = new Date().toISOString();

  await supabase.from('proactive_messages').update(updates).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
