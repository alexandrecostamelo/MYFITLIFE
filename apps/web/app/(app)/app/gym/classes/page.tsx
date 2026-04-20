import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GymClassesClient } from './gym-classes-client';

export const dynamic = 'force-dynamic';

export default async function GymClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Find user's primary gym via user_gyms
  const { data: userGym } = await supabase
    .from('user_gyms')
    .select('gym_place_id, name')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .limit(1)
    .maybeSingle();

  // Fallback: latest checkin gym
  let gymPlaceId = userGym?.gym_place_id as string | null;
  let gymName = String(userGym?.name || '');

  if (!gymPlaceId) {
    const { data: lastCheckin } = await supabase
      .from('gym_checkins')
      .select('gym_place_id')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    gymPlaceId = (lastCheckin as Record<string, unknown> | null)
      ?.gym_place_id as string | null;

    if (gymPlaceId) {
      const { data: gp } = await supabase
        .from('gym_places')
        .select('name')
        .eq('id', gymPlaceId)
        .single();
      gymName = String((gp as Record<string, unknown> | null)?.name || '');
    }
  }

  if (!gymPlaceId) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6 text-center space-y-3">
        <h1 className="display-title">Aulas Coletivas</h1>
        <p className="text-sm text-muted-foreground">
          Faça check-in na sua academia primeiro pra ver as aulas disponíveis.
        </p>
      </main>
    );
  }

  const { data: classes } = await supabase
    .from('gym_classes')
    .select('*')
    .eq('gym_id', gymPlaceId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  const today = new Date();
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  const { data: myBookings } = await supabase
    .from('gym_class_bookings')
    .select('id, class_id, class_date, status')
    .eq('user_id', user.id)
    .in('class_date', weekDates)
    .in('status', ['confirmed', 'waitlist']);

  return (
    <GymClassesClient
      gymName={gymName || 'Sua academia'}
      classes={(classes || []) as Record<string, unknown>[]}
      myBookings={(myBookings || []) as Record<string, unknown>[]}
      weekDates={weekDates}
    />
  );
}
