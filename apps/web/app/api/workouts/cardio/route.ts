import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ACTIVITY_LABELS: Record<string, string> = {
  running: 'Corrida',
  walking: 'Caminhada',
  cycling: 'Ciclismo',
  hiking: 'Trilha',
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const durationSec = Number(body.duration_seconds) || 0;
  const distanceM = Number(body.distance_meters) || 0;
  const distKm = (distanceM / 1000).toFixed(2);
  const label = ACTIVITY_LABELS[body.activity_type] || 'Cardio';

  const endedAt = new Date();
  const startedAt = new Date(endedAt.getTime() - durationSec * 1000);

  // Create workout_log
  const { data: log } = await supabase
    .from('workout_logs')
    .insert({
      user_id: user.id,
      started_at: startedAt.toISOString(),
      finished_at: endedAt.toISOString(),
      duration_sec: durationSec,
      notes: `[GPS] ${label} — ${distKm}km`,
    } as Record<string, unknown>)
    .select()
    .single();

  const logId = log
    ? String((log as Record<string, unknown>).id)
    : null;

  // Create cardio_session
  const { data: session } = await supabase
    .from('cardio_sessions')
    .insert({
      user_id: user.id,
      workout_log_id: logId,
      activity_type: body.activity_type,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSec,
      distance_meters: distanceM,
      avg_pace_sec_per_km: body.avg_pace_sec_per_km || null,
      best_pace_sec_per_km: body.best_pace_sec_per_km || null,
      avg_speed_kmh: body.avg_speed_kmh || null,
      calories_estimated: body.calories_estimated || null,
      elevation_gain_m: body.elevation_gain_m || null,
      elevation_loss_m: body.elevation_loss_m || null,
      route_polyline: body.route_polyline || null,
      splits: body.splits || null,
      status: 'completed',
    } as Record<string, unknown>)
    .select()
    .single();

  const sessionId = session
    ? String((session as Record<string, unknown>).id)
    : null;

  // Save health_samples (fire-and-forget)
  const now = new Date().toISOString();
  try {
    await supabase.from('health_samples').insert(
      [
        {
          user_id: user.id,
          metric: 'active_calories',
          value: body.calories_estimated || 0,
          unit: 'kcal',
          source: 'manual',
          sampled_at: now,
        },
        {
          user_id: user.id,
          metric: 'steps',
          value: Math.round(distanceM / 0.75),
          unit: 'count',
          source: 'manual',
          sampled_at: now,
        },
      ].map((r) => r as Record<string, unknown>),
    );
  } catch {
    // non-critical
  }

  // Write to native Health (Apple Health / Google Health Connect)
  try {
    const { writeWorkoutToHealth } = await import('@/lib/health/sync');
    writeWorkoutToHealth({
      type: 'cardio',
      startDate: startedAt,
      endDate: endedAt,
      calories: Number(body.calories_estimated) || 0,
    }).catch(() => null);
  } catch {
    // non-critical
  }

  return NextResponse.json({
    ok: true,
    session_id: sessionId,
    workout_log_id: logId,
  });
}
