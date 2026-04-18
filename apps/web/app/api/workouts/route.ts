import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const setSchema = z.object({
  action: z.literal('log_set'),
  workout_log_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  set_number: z.number().int().positive(),
  reps: z.number().int().optional(),
  weight_kg: z.number().optional(),
  rir: z.number().int().optional(),
  duration_sec: z.number().int().optional(),
});

const finishSchema = z.object({
  action: z.literal('finish'),
  workout_log_id: z.string().uuid(),
  perceived_effort: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'start') {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: user.id, started_at: new Date().toISOString() })
      .select('id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ workout_log_id: data.id });
  }

  if (body.action === 'log_set') {
    const parsed = setSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const { error } = await supabase.from('set_logs').insert({
      workout_log_id: parsed.data.workout_log_id,
      exercise_id: parsed.data.exercise_id,
      set_number: parsed.data.set_number,
      reps: parsed.data.reps,
      weight_kg: parsed.data.weight_kg,
      rir: parsed.data.rir,
      duration_sec: parsed.data.duration_sec,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { awardXp: ax } = await import('@/lib/gamification');
    await ax(supabase, user.id, 'SET_LOGGED');
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'finish') {
    const parsed = finishSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

    const now = new Date();
    const { data: log } = await supabase
      .from('workout_logs')
      .select('started_at')
      .eq('id', parsed.data.workout_log_id)
      .single();

    const duration = log ? Math.round((now.getTime() - new Date(log.started_at).getTime()) / 1000) : 0;

    const { error } = await supabase
      .from('workout_logs')
      .update({
        finished_at: now.toISOString(),
        duration_sec: duration,
        perceived_effort: parsed.data.perceived_effort,
        notes: parsed.data.notes,
      })
      .eq('id', parsed.data.workout_log_id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { awardXp: awx, touchActivity: ta, checkAchievements: ca } = await import('@/lib/gamification');
    await awx(supabase, user.id, 'WORKOUT_COMPLETED', { refTable: 'workout_logs', refId: parsed.data.workout_log_id });
    await ta(supabase, user.id);
    await ca(supabase, user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('workout_logs')
    .select('id, started_at, finished_at, duration_sec, perceived_effort')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(30);

  return NextResponse.json({ workouts: data });
}
