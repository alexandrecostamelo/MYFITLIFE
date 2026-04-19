import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const maxDuration = 30;

const schema = z.object({
  value: z.number().int().min(0).max(100000).default(1),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
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

  const { data: participant } = await supabase
    .from('community_challenge_participants')
    .select('*')
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!participant) return NextResponse.json({ error: 'not_enrolled' }, { status: 400 });
  if (participant.abandoned_at) return NextResponse.json({ error: 'abandoned' }, { status: 400 });
  if (participant.completed_at) return NextResponse.json({ error: 'already_completed' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  if (today < challenge.start_date) return NextResponse.json({ error: 'not_started' }, { status: 400 });
  if (today > challenge.end_date) return NextResponse.json({ error: 'ended' }, { status: 400 });

  const contentType = req.headers.get('content-type') || '';
  let value = 1;
  let notes: string | undefined;
  let photoFile: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const raw = formData.get('value') as string | null;
    value = raw ? parseInt(raw) : 1;
    notes = (formData.get('notes') as string) || undefined;
    photoFile = formData.get('photo') as File | null;
  } else {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    value = parsed.data.value;
    notes = parsed.data.notes;
  }

  let photoPath: string | null = null;
  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const fileName = `${user.id}/${challenge.id}/${today}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from('challenge-checkins')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });
    if (!uploadErr) photoPath = fileName;
  }

  if (challenge.challenge_type === 'photo_habit' && !photoPath) {
    return NextResponse.json({ error: 'photo_required' }, { status: 400 });
  }

  const { data: upserted, error } = await supabase
    .from('community_challenge_checkins')
    .upsert(
      {
        participant_id: participant.id,
        challenge_id: challenge.id,
        user_id: user.id,
        checkin_date: today,
        value,
        notes,
        photo_path: photoPath,
      },
      { onConflict: 'participant_id,checkin_date' },
    )
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: updated } = await supabase
    .from('community_challenge_participants')
    .select('*')
    .eq('id', participant.id)
    .single();

  let justCompleted = false;
  if (updated && !updated.completed_at) {
    let shouldComplete = false;

    if (
      challenge.challenge_type === 'daily_streak' ||
      challenge.challenge_type === 'photo_habit' ||
      challenge.challenge_type === 'daily_reps'
    ) {
      shouldComplete = updated.check_in_count >= challenge.duration_days;
    } else if (
      challenge.challenge_type === 'total_reps' ||
      challenge.challenge_type === 'accumulated_minutes'
    ) {
      shouldComplete = updated.current_progress >= challenge.target_value;
    }

    if (shouldComplete) {
      await supabase
        .from('community_challenge_participants')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', participant.id);

      try {
        await supabase.rpc('grant_xp', {
          p_user_id: user.id,
          p_amount: challenge.xp_on_complete,
          p_source: 'challenge_complete',
          p_dimension: challenge.category,
        });
      } catch { /* xp grant is best-effort */ }

      justCompleted = true;
    }
  }

  return NextResponse.json({ id: upserted.id, just_completed: justCompleted });
}
