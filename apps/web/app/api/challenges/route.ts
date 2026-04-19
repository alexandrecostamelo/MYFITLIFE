import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { notifyChallengeInvite } from '@/lib/push/events';

const createSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().max(300).optional(),
  metric: z.enum(['workouts', 'sets', 'meals', 'streak_days', 'xp', 'weight_logs', 'checkins', 'trail_days']),
  target_value: z.number().int().positive(),
  start_date: z.string(),
  end_date: z.string(),
  is_public: z.boolean().optional(),
  invited_user_ids: z.array(z.string().uuid()).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: participations } = await supabase
    .from('challenge_participants')
    .select('challenge_id, current_progress, completed_at, joined_at')
    .eq('user_id', user.id);

  const challengeIds = (participations || []).map((p: any) => p.challenge_id);

  let challenges: any[] = [];
  if (challengeIds.length > 0) {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .in('id', challengeIds)
      .order('end_date', { ascending: false });
    challenges = data || [];
  }

  const myStateMap = new Map((participations || []).map((p: any) => [p.challenge_id, p]));

  const result = challenges.map((c) => ({
    ...c,
    my_progress: myStateMap.get(c.id)?.current_progress || 0,
    my_completed_at: myStateMap.get(c.id)?.completed_at || null,
  }));

  return NextResponse.json({ challenges: result });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const { data: challenge, error } = await supabase
    .from('challenges')
    .insert({
      creator_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      metric: parsed.data.metric,
      target_value: parsed.data.target_value,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      is_public: parsed.data.is_public ?? false,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const participants = [{ challenge_id: challenge.id, user_id: user.id }];
  if (parsed.data.invited_user_ids && parsed.data.invited_user_ids.length > 0) {
    parsed.data.invited_user_ids.forEach((id) => participants.push({ challenge_id: challenge.id, user_id: id }));
  }

  await supabase.from('challenge_participants').insert(participants);

  if (parsed.data.invited_user_ids && parsed.data.invited_user_ids.length > 0) {
    for (const invitedId of parsed.data.invited_user_ids) {
      notifyChallengeInvite(user.id, invitedId, challenge.id, parsed.data.title).catch(console.error);
    }
  }

  return NextResponse.json({ id: challenge.id });
}
