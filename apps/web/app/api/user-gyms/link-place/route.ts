import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  gym_place_id: z.string().uuid(),
  make_primary: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const { data: existing } = await supabase
    .from('user_gyms')
    .select('id')
    .eq('user_id', user.id)
    .eq('gym_place_id', parsed.data.gym_place_id)
    .maybeSingle();

  if (existing) {
    if (parsed.data.make_primary) {
      await supabase.from('user_gyms').update({ is_primary: false }).eq('user_id', user.id);
      await supabase.from('user_gyms').update({ is_primary: true }).eq('id', existing.id);
    }
    return NextResponse.json({ id: existing.id, already_linked: true });
  }

  const { data: place } = await supabase
    .from('gym_places')
    .select('name, city, state')
    .eq('id', parsed.data.gym_place_id)
    .single();

  if (!place) return NextResponse.json({ error: 'place_not_found' }, { status: 404 });

  const { count } = await supabase
    .from('user_gyms')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const shouldBePrimary = parsed.data.make_primary || (count ?? 0) === 0;

  if (shouldBePrimary) {
    await supabase.from('user_gyms').update({ is_primary: false }).eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('user_gyms')
    .insert({
      user_id: user.id,
      gym_place_id: parsed.data.gym_place_id,
      name: place.name,
      city: place.city,
      state: place.state,
      is_primary: shouldBePrimary,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { awardXp, checkAchievements } = await import('@/lib/gamification');
    await awardXp(supabase, user.id, 'GYM_CREATED');
    await checkAchievements(supabase, user.id);
  } catch {}

  return NextResponse.json({ id: data.id });
}
