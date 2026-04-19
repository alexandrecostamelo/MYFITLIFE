import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({ blocked_id: z.string().uuid() });

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_blocks')
    .select('id, blocked_id, created_at')
    .eq('blocker_id', user.id);

  const ids = (data || []).map((b: any) => b.blocked_id);
  const { data: profiles } = ids.length > 0
    ? await supabase.from('profiles').select('id, full_name, username').in('id', ids)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  const enriched = (data || []).map((b: any) => ({ ...b, user: profMap.get(b.blocked_id) || {} }));

  return NextResponse.json({ blocks: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.blocked_id === user.id) return NextResponse.json({ error: 'cannot_block_self' }, { status: 400 });

  await supabase
    .from('user_blocks')
    .upsert({ blocker_id: user.id, blocked_id: parsed.data.blocked_id }, { onConflict: 'blocker_id,blocked_id' });

  await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${parsed.data.blocked_id}),and(requester_id.eq.${parsed.data.blocked_id},addressee_id.eq.${user.id})`);

  return NextResponse.json({ ok: true });
}
