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

  const { data: booking } = await supabase
    .from('gym_class_bookings')
    .select('id, class_id, class_date, status')
    .eq('id', booking_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!booking)
    return NextResponse.json(
      { error: 'booking_not_found' },
      { status: 404 },
    );

  const bookingRec = booking as Record<string, unknown>;

  await supabase
    .from('gym_class_bookings')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', String(bookingRec.id));

  // Promote next from waitlist if the canceled booking was confirmed
  if (bookingRec.status === 'confirmed') {
    const { data: nextWaitlist } = await supabase
      .from('gym_class_bookings')
      .select('id')
      .eq('class_id', String(bookingRec.class_id))
      .eq('class_date', String(bookingRec.class_date))
      .eq('status', 'waitlist')
      .order('booked_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextWaitlist) {
      await supabase
        .from('gym_class_bookings')
        .update({
          status: 'confirmed',
          waitlist_position: null,
        } as Record<string, unknown>)
        .eq('id', String((nextWaitlist as Record<string, unknown>).id));
    }
  }

  return NextResponse.json({ ok: true });
}
