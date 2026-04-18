import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineKm } from '@myfitlife/core/geo';
import { z } from 'zod';

const schema = z.object({
  gym_place_id: z.string().uuid().optional(),
  user_gym_id: z.string().uuid().optional(),
  workout_log_id: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  force: z.boolean().optional(),
});

const PROXIMITY_RADIUS_KM = 0.3;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('gym_checkins')
    .select('*, gym_places(name, city)')
    .eq('user_id', user.id)
    .order('checked_in_at', { ascending: false })
    .limit(30);

  const active = (data || []).find((c: any) => c.left_at === null) || null;

  return NextResponse.json({ checkins: data || [], active });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  if (!parsed.data.gym_place_id && !parsed.data.user_gym_id) {
    return NextResponse.json({ error: 'need_gym' }, { status: 400 });
  }

  const { data: active } = await supabase
    .from('gym_checkins')
    .select('id')
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle();

  if (active) {
    return NextResponse.json({ error: 'already_checked_in', active_checkin_id: active.id }, { status: 409 });
  }

  if (parsed.data.gym_place_id && parsed.data.latitude && parsed.data.longitude && !parsed.data.force) {
    const { data: gym } = await supabase
      .from('gym_places')
      .select('latitude, longitude, name')
      .eq('id', parsed.data.gym_place_id)
      .single();

    if (gym) {
      const dist = haversineKm(parsed.data.latitude, parsed.data.longitude, gym.latitude, gym.longitude);
      if (dist > PROXIMITY_RADIUS_KM) {
        return NextResponse.json({
          error: 'too_far',
          distance_km: Math.round(dist * 1000) / 1000,
          max_radius_km: PROXIMITY_RADIUS_KM,
        }, { status: 400 });
      }
    }
  }

  const { data: created, error } = await supabase
    .from('gym_checkins')
    .insert({
      user_id: user.id,
      gym_place_id: parsed.data.gym_place_id,
      user_gym_id: parsed.data.user_gym_id,
      workout_log_id: parsed.data.workout_log_id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { touchActivity, awardXp, checkAchievements } = await import('@/lib/gamification');
    await awardXp(supabase, user.id, 'CHECKIN_DAILY', { description: 'Check-in na academia' });
    await touchActivity(supabase, user.id);
    await checkAchievements(supabase, user.id);
  } catch {}

  return NextResponse.json({ id: created.id });
}
