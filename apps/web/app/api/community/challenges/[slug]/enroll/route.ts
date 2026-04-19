import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: challenge } = await supabase
    .from('community_challenges')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (challenge.status !== 'enrollment' && challenge.status !== 'active') {
    return NextResponse.json({ error: 'not_open' }, { status: 400 });
  }

  if (challenge.max_participants) {
    const { count } = await supabase
      .from('community_challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id)
      .is('abandoned_at', null);
    if ((count || 0) >= challenge.max_participants) {
      return NextResponse.json({ error: 'full' }, { status: 400 });
    }
  }

  const { error } = await supabase.from('community_challenge_participants').insert({
    challenge_id: challenge.id,
    user_id: user.id,
  });

  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: challenge } = await supabase
    .from('community_challenges')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await supabase
    .from('community_challenge_participants')
    .update({ abandoned_at: new Date().toISOString() })
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
