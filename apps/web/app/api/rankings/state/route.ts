import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') || '7');
  const stateParam = req.nextUrl.searchParams.get('state');

  let state = stateParam;

  if (!state) {
    const { data: myProfile } = await supabase
      .from('user_profiles')
      .select('state')
      .eq('user_id', user.id)
      .maybeSingle();
    state = myProfile?.state || null;
  }

  if (!state) {
    return NextResponse.json({ ranking: [], reason: 'no_state' });
  }

  const { data } = await supabase.rpc('ranking_by_state', {
    p_state: state,
    p_days: days,
    p_limit: 100,
  });

  const ranking = (data || []).map((r: any, idx: number) => ({
    ...r,
    rank: idx + 1,
    is_me: r.user_id === user.id,
  }));

  return NextResponse.json({
    ranking: ranking.slice(0, 30),
    state,
    my_entry: ranking.find((r: any) => r.is_me),
    total: ranking.length,
    days,
  });
}
