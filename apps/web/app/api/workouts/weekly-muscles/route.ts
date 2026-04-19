import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeActivation, normalizeActivation } from '@myfitlife/core/muscles';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '7');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get workout log IDs for the user within the time range
  const { data: wlogs, error: wErr } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', user.id)
    .gte('started_at', since);

  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

  const wlogIds = (wlogs ?? []).map((w: { id: string }) => w.id);
  if (wlogIds.length === 0) return NextResponse.json({ activation: {}, raw: {} });

  // Get set_logs with exercise names
  const { data, error } = await supabase
    .from('set_logs')
    .select('reps, exercises(name_pt)')
    .in('workout_log_id', wlogIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const exercises = (data ?? []).map((row: any) => ({
    name: row.exercises?.name_pt ?? '',
    sets: 1,
    reps: row.reps ?? 10,
  })).filter((e) => e.name.length > 0);

  const raw = computeActivation(exercises);
  const normalized = normalizeActivation(raw);

  return NextResponse.json({ activation: normalized, raw });
}
