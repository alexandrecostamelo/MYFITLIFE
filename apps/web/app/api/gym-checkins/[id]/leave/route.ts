import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: checkin } = await supabase
    .from('gym_checkins')
    .select('checked_in_at, left_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!checkin) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (checkin.left_at) return NextResponse.json({ error: 'already_left' }, { status: 409 });

  const now = new Date();
  const duration = Math.round((now.getTime() - new Date(checkin.checked_in_at).getTime()) / 1000);

  const { error } = await supabase
    .from('gym_checkins')
    .update({ left_at: now.toISOString(), duration_sec: duration })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, duration_sec: duration });
}
