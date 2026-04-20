import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { challenge_id, day } = await req.json();
  if (!challenge_id || typeof day !== 'number') {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 });
  }

  const { data: prog } = await supabase
    .from('user_mini_challenge_progress')
    .select('id, completed_days, current_day')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge_id)
    .maybeSingle();

  if (!prog) {
    return NextResponse.json({ error: 'not_started' }, { status: 404 });
  }

  const completedDays = (prog.completed_days as number[]) || [];
  if (completedDays.includes(day)) {
    return NextResponse.json({ error: 'already_completed' }, { status: 409 });
  }

  const updatedDays = [...completedDays, day].sort((a, b) => a - b);
  const nextDay = day + 1;

  const { data: challenge } = await supabase
    .from('mini_challenges')
    .select('total_days')
    .eq('id', challenge_id)
    .single();

  const totalDays = Number(challenge?.total_days) || 7;
  const isComplete = updatedDays.length >= totalDays;

  const updateData: Record<string, unknown> = {
    completed_days: updatedDays,
    current_day: Math.min(nextDay, totalDays),
  };
  if (isComplete) {
    updateData.completed_at = new Date().toISOString();
  }

  await supabase
    .from('user_mini_challenge_progress')
    .update(updateData)
    .eq('id', prog.id);

  return NextResponse.json({ completed_days: updatedDays, is_complete: isComplete });
}
