import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({ user_id: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.user_id === user.id) return NextResponse.json({ error: 'self' }, { status: 400 });

  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${parsed.data.user_id}),and(requester_id.eq.${parsed.data.user_id},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'accepted') return NextResponse.json({ error: 'already_friends' }, { status: 409 });
    if (existing.status === 'pending') return NextResponse.json({ error: 'already_pending' }, { status: 409 });
    if (existing.status === 'blocked') return NextResponse.json({ error: 'blocked' }, { status: 403 });

    await supabase
      .from('friendships')
      .update({ status: 'pending', requester_id: user.id, addressee_id: parsed.data.user_id, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: user.id,
    addressee_id: parsed.data.user_id,
    status: 'pending',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
