import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GymClassAdminClient } from './gym-class-admin-client';

export const dynamic = 'force-dynamic';

export default async function GymClassAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: gym } = await supabase
    .from('gym_places')
    .select('id, name')
    .eq('claimed_by', user.id)
    .limit(1)
    .maybeSingle();

  if (!gym) redirect('/app/gym-admin');

  const gymId = String((gym as Record<string, unknown>).id);
  const gymName = String((gym as Record<string, unknown>).name);

  const { data: classes } = await supabase
    .from('gym_classes')
    .select('*')
    .eq('gym_id', gymId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time');

  return (
    <GymClassAdminClient
      gymId={gymId}
      gymName={gymName}
      classes={(classes || []) as Record<string, unknown>[]}
    />
  );
}
