import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { booking_id } = await req.json();
  if (!booking_id)
    return NextResponse.json({ error: 'missing_booking_id' }, { status: 400 });

  const { data: booking } = await supabase
    .from('gym_class_bookings')
    .select('id, status')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (!booking)
    return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });

  const rec = booking as Record<string, unknown>;

  await supabase
    .from('gym_class_bookings')
    .update({
      status: 'attended',
      attended_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', String(rec.id));

  // Award XP for attending
  try {
    const { awardXp, touchActivity } = await import('@/lib/gamification');
    await awardXp(supabase, user.id, 'CLASS_ATTENDED');
    await touchActivity(supabase, user.id);
  } catch {
    // gamification non-critical
  }

  return NextResponse.json({ ok: true });
}
