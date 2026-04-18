import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const scope = req.nextUrl.searchParams.get('scope') || 'global';
  const period = req.nextUrl.searchParams.get('period') || 'alltime';

  let userIds: string[] | null = null;

  if (scope === 'friends') {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    userIds = [user.id, ...((friendships || []).map((f: any) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    ))];
  }

  if (period === 'alltime') {
    let q = supabase
      .from('user_stats')
      .select('user_id, total_xp, level, current_streak, longest_streak')
      .order('total_xp', { ascending: false })
      .limit(100);

    if (userIds) q = q.in('user_id', userIds);

    const { data: stats } = await q;

    const ids = (stats || []).map((s: any) => s.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

    const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const leaderboard = (stats || []).map((s: any, i: number) => ({
      rank: i + 1,
      user: profMap.get(s.user_id) || { id: s.user_id },
      xp: s.total_xp,
      level: s.level,
      current_streak: s.current_streak,
      longest_streak: s.longest_streak,
      is_me: s.user_id === user.id,
    }));

    return NextResponse.json({ leaderboard, scope, period });
  }

  const now = new Date();
  const since = new Date();
  if (period === 'week') since.setDate(now.getDate() - 7);
  else if (period === 'month') since.setDate(now.getDate() - 30);

  let xpQuery = supabase
    .from('xp_events')
    .select('user_id, xp_awarded')
    .gte('created_at', since.toISOString());

  if (userIds) xpQuery = xpQuery.in('user_id', userIds);

  const { data: events } = await xpQuery;

  const totals: Record<string, number> = {};
  (events || []).forEach((e: any) => {
    totals[e.user_id] = (totals[e.user_id] || 0) + (e.xp_awarded || 0);
  });

  const sortedIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]).slice(0, 100);

  if (sortedIds.length === 0) return NextResponse.json({ leaderboard: [], scope, period });

  const [profilesRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', sortedIds),
    supabase.from('user_stats').select('user_id, level').in('user_id', sortedIds),
  ]);

  const profMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
  const statsMap = new Map((statsRes.data || []).map((s: any) => [s.user_id, s]));

  const leaderboard = sortedIds.map((id, i) => ({
    rank: i + 1,
    user: profMap.get(id) || { id },
    xp: totals[id],
    level: statsMap.get(id)?.level || 1,
    is_me: id === user.id,
  }));

  return NextResponse.json({ leaderboard, scope, period });
}
