import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { challenge_id } = await req.json();
  if (!challenge_id) {
    return NextResponse.json({ error: 'missing_challenge_id' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('user_mini_challenge_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'already_started' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('user_mini_challenge_progress')
    .insert({
      user_id: user.id,
      challenge_id,
      current_day: 1,
      completed_days: [],
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ progress: data });
}
