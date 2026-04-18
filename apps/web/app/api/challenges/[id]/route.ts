import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeUserProgress } from '@/lib/challenge-progress';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (!challenge) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: participants } = await supabase
    .from('challenge_participants')
    .select('user_id, current_progress, completed_at, joined_at')
    .eq('challenge_id', id);

  const userIds = (participants || []).map((p: any) => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', userIds);

  const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const myParticipation = (participants || []).find((p: any) => p.user_id === user.id);
  if (myParticipation) {
    const freshProgress = await computeUserProgress(
      supabase,
      user.id,
      challenge.metric,
      challenge.start_date,
      challenge.end_date
    );

    if (freshProgress !== myParticipation.current_progress) {
      const completedAt = freshProgress >= challenge.target_value && !myParticipation.completed_at
        ? new Date().toISOString()
        : myParticipation.completed_at;

      await supabase
        .from('challenge_participants')
        .update({ current_progress: freshProgress, completed_at: completedAt })
        .eq('challenge_id', id)
        .eq('user_id', user.id);

      myParticipation.current_progress = freshProgress;
      myParticipation.completed_at = completedAt;
    }
  }

  const leaderboard = (participants || [])
    .map((p: any) => ({
      user: profilesMap.get(p.user_id) || { id: p.user_id },
      progress: p.current_progress,
      completed_at: p.completed_at,
      is_me: p.user_id === user.id,
    }))
    .sort((a, b) => b.progress - a.progress);

  return NextResponse.json({
    challenge,
    leaderboard,
    my_progress: myParticipation?.current_progress || 0,
    joined: !!myParticipation,
  });
}
