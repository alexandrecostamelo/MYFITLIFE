import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const gymId = req.nextUrl.searchParams.get('gym_id');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '7');

  let effectiveGymId = gymId;

  if (!effectiveGymId) {
    const { data: lastCheckin } = await supabase
      .from('gym_checkins')
      .select('gym_place_id')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    effectiveGymId = lastCheckin?.gym_place_id || null;
  }

  if (!effectiveGymId) {
    return NextResponse.json({ ranking: [], gym: null, reason: 'no_gym' });
  }

  const [gymRes, rankingRes] = await Promise.all([
    supabase.from('gym_places').select('id, name, city, state').eq('id', effectiveGymId).single(),
    supabase.rpc('ranking_by_gym', { p_gym_place_id: effectiveGymId, p_days: days, p_limit: 50 }),
  ]);

  const ranking = (rankingRes.data || []).map((r: any, idx: number) => ({
    ...r,
    rank: idx + 1,
    is_me: r.user_id === user.id,
  }));

  return NextResponse.json({
    ranking: ranking.slice(0, 30),
    gym: gymRes.data,
    my_entry: ranking.find((r: any) => r.is_me),
    total: ranking.length,
    days,
  });
}
