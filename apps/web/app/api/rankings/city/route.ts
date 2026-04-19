import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') || '7');
  const cityParam = req.nextUrl.searchParams.get('city');
  const stateParam = req.nextUrl.searchParams.get('state');

  let city = cityParam;
  let state = stateParam;

  if (!city || !state) {
    const { data: myProfile } = await supabase
      .from('user_profiles')
      .select('city, state')
      .eq('user_id', user.id)
      .maybeSingle();
    city = city || myProfile?.city || null;
    state = state || myProfile?.state || null;
  }

  if (!city || !state) {
    return NextResponse.json({ ranking: [], reason: 'no_city' });
  }

  const { data } = await supabase.rpc('ranking_by_city', {
    p_state: state,
    p_city: city,
    p_days: days,
    p_limit: 50,
  });

  const ranking = (data || []).map((r: any, idx: number) => ({
    ...r,
    rank: idx + 1,
    is_me: r.user_id === user.id,
  }));

  return NextResponse.json({
    ranking: ranking.slice(0, 30),
    city,
    state,
    my_entry: ranking.find((r: any) => r.is_me),
    total: ranking.length,
    days,
  });
}
