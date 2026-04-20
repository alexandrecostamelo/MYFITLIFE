import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { class_id, class_date } = await req.json();
  if (!class_id || !class_date)
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const { data: cls } = await supabase
    .from('gym_classes')
    .select('id, max_capacity, title, start_time')
    .eq('id', class_id)
    .eq('is_active', true)
    .single();

  if (!cls)
    return NextResponse.json({ error: 'class_not_found' }, { status: 404 });

  const maxCapacity = Number((cls as Record<string, unknown>).max_capacity) || 20;

  const { data: existing } = await supabase
    .from('gym_class_bookings')
    .select('id, status')
    .eq('class_id', class_id)
    .eq('user_id', user.id)
    .eq('class_date', class_date)
    .maybeSingle();

  const existingStatus = (existing as Record<string, unknown> | null)?.status;

  if (existingStatus === 'confirmed') {
    return NextResponse.json({ error: 'already_booked' }, { status: 409 });
  }

  const { data: countResult } = await supabase.rpc('count_confirmed_bookings', {
    p_class_id: class_id,
    p_date: class_date,
  });

  const confirmed = Number(countResult) || 0;
  const isFull = confirmed >= maxCapacity;

  if (existing) {
    const existingId = String((existing as Record<string, unknown>).id);
    await supabase
      .from('gym_class_bookings')
      .update({
        status: isFull ? 'waitlist' : 'confirmed',
        waitlist_position: isFull ? confirmed - maxCapacity + 1 : null,
        canceled_at: null,
        booked_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', existingId);
  } else {
    await supabase.from('gym_class_bookings').insert({
      class_id,
      user_id: user.id,
      class_date,
      status: isFull ? 'waitlist' : 'confirmed',
      waitlist_position: isFull ? confirmed - maxCapacity + 1 : null,
    } as Record<string, unknown>);
  }

  return NextResponse.json({
    ok: true,
    status: isFull ? 'waitlist' : 'confirmed',
    position: isFull ? confirmed - maxCapacity + 1 : null,
  });
}
