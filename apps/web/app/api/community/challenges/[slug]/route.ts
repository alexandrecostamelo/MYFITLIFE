import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
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

  const { data: myPart } = await supabase
    .from('community_challenge_participants')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { count: participantCount } = await supabase
    .from('community_challenge_participants')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challenge.id)
    .is('abandoned_at', null);

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayCheckin } = myPart
    ? await supabase
        .from('community_challenge_checkins')
        .select('*')
        .eq('participant_id', myPart.id)
        .eq('checkin_date', today)
        .maybeSingle()
    : { data: null };

  let recentCheckins: any[] = [];
  if (myPart) {
    const { data: checkins } = await supabase
      .from('community_challenge_checkins')
      .select('*')
      .eq('participant_id', myPart.id)
      .order('checkin_date', { ascending: false })
      .limit(14);
    recentCheckins = checkins || [];
  }

  return NextResponse.json({
    challenge,
    my_participation: myPart,
    today_checkin: todayCheckin,
    participant_count: participantCount || 0,
    recent_checkins: recentCheckins,
  });
}
