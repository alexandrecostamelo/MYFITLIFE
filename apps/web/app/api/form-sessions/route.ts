import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  exercise_id: z.string().uuid().nullable().optional(),
  exercise_name: z.string().min(1).max(200),
  pose_check_key: z.enum(['squat', 'push_up', 'plank', 'lunge']),
  duration_sec: z.number().int().min(0),
  reps_detected: z.number().int().min(0),
  avg_form_score: z.number().int().min(0).max(100),
  best_form_score: z.number().int().min(0).max(100),
  feedback_counts: z.record(z.number()).optional(),
  summary_cues: z.array(z.string()).max(10).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const exerciseId = req.nextUrl.searchParams.get('exercise_id');

  let query = supabase
    .from('form_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: false })
    .limit(50);

  if (exerciseId) query = query.eq('exercise_id', exerciseId);

  const { data } = await query;
  return NextResponse.json({ sessions: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data, error } = await supabase
    .from('form_sessions')
    .insert({ user_id: user.id, ...parsed.data })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await supabase.rpc('grant_xp', {
      p_user_id: user.id,
      p_amount: Math.round(parsed.data.reps_detected * 2),
      p_source: 'form_session',
      p_dimension: 'strength',
    });
  } catch {}

  return NextResponse.json({ id: data.id });
}
