import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_METRICS = [
  'streak',
  'sessions',
  'minutes',
  'calories',
  'weight',
  'sleep',
  'readiness',
  'xp',
  'workouts_week',
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { metrics } = await req.json();
  const filtered = (metrics as string[])
    .filter((m) => VALID_METRICS.includes(m))
    .slice(0, 3);

  if (filtered.length === 0)
    return NextResponse.json({ error: 'invalid_metrics' }, { status: 400 });

  await supabase
    .from('profiles')
    .update({ dashboard_metrics: filtered } as Record<string, unknown>)
    .eq('id', user.id);

  return NextResponse.json({ ok: true, metrics: filtered });
}
