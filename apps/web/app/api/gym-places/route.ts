import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const latStr = req.nextUrl.searchParams.get('lat');
  const lngStr = req.nextUrl.searchParams.get('lng');
  const radiusStr = req.nextUrl.searchParams.get('radius');
  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const city = req.nextUrl.searchParams.get('city')?.trim();

  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = radiusStr ? parseFloat(radiusStr) : 5;

    const { data, error } = await supabase.rpc('nearby_gyms', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radius,
      result_limit: 50,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ gyms: data || [] });
  }

  let query = supabase
    .from('gym_places')
    .select('id, name, address, city, state, latitude, longitude, rating_avg, rating_count, checkins_total')
    .limit(50);

  if (q) query = query.ilike('name', `%${q}%`);
  if (city) query = query.ilike('city', `%${city}%`);

  const { data, error } = await query.order('checkins_total', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gyms: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 });

  const { data: existing } = await supabase
    .from('gym_places')
    .select('id, name')
    .ilike('name', parsed.data.name)
    .gte('latitude', parsed.data.latitude - 0.005)
    .lte('latitude', parsed.data.latitude + 0.005)
    .gte('longitude', parsed.data.longitude - 0.005)
    .lte('longitude', parsed.data.longitude + 0.005)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ id: existing[0].id, duplicate: true });
  }

  const { data, error } = await supabase
    .from('gym_places')
    .insert({ ...parsed.data, contributed_by: user.id })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { awardXp, checkAchievements } = await import('@/lib/gamification');
    await awardXp(supabase, user.id, 'GYM_CREATED', { description: 'Cadastrou academia colaborativa' });
    await checkAchievements(supabase, user.id);
  } catch {}

  return NextResponse.json({ id: data.id });
}
