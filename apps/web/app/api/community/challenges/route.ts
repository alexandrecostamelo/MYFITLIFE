import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');

  let query = supabase
    .from('community_challenges')
    .select('*')
    .neq('status', 'draft')
    .order('featured', { ascending: false })
    .order('start_date', { ascending: true });

  if (status) query = query.eq('status', status);

  const { data: challenges } = await query;

  const ids = (challenges || []).map((c: any) => c.id);

  const { data: myParticipations } = ids.length > 0
    ? await supabase
        .from('community_challenge_participants')
        .select('challenge_id, current_progress, check_in_count, completed_at, abandoned_at')
        .eq('user_id', user.id)
        .in('challenge_id', ids)
    : { data: [] };

  const myMap = new Map((myParticipations || []).map((p: any) => [p.challenge_id, p]));

  const { data: counts } = ids.length > 0
    ? await supabase
        .from('community_challenge_participants')
        .select('challenge_id')
        .in('challenge_id', ids)
        .is('abandoned_at', null)
    : { data: [] };

  const countMap: Record<string, number> = {};
  (counts || []).forEach((c: any) => { countMap[c.challenge_id] = (countMap[c.challenge_id] || 0) + 1; });

  const enriched = (challenges || []).map((c: any) => ({
    ...c,
    my_participation: myMap.get(c.id) || null,
    participant_count: countMap[c.id] || 0,
  }));

  return NextResponse.json({ challenges: enriched });
}
