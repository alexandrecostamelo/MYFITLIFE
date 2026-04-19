import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: challenge } = await supabase
    .from('community_challenges')
    .select('id, challenge_type')
    .eq('slug', slug)
    .single();
  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const orderField =
    challenge.challenge_type === 'total_reps' || challenge.challenge_type === 'accumulated_minutes'
      ? 'current_progress'
      : 'check_in_count';

  const { data: participants } = await supabase
    .from('community_challenge_participants')
    .select('*')
    .eq('challenge_id', challenge.id)
    .is('abandoned_at', null)
    .order(orderField, { ascending: false })
    .order('longest_streak', { ascending: false })
    .limit(50);

  const userIds = (participants || []).map((p: any) => p.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds)
    : { data: [] };

  const profMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const leaderboard = (participants || []).map((p: any, idx: number) => ({
    ...p,
    rank: idx + 1,
    user: profMap.get(p.user_id) || { full_name: 'Usuário' },
    is_me: p.user_id === user.id,
  }));

  const myEntry = leaderboard.find((l: any) => l.is_me);

  return NextResponse.json({
    leaderboard: leaderboard.slice(0, 20),
    my_entry: myEntry,
    total: leaderboard.length,
  });
}
