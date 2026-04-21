import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RunDetailClient } from './run-detail-client';

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: session } = await supabase
    .from('cardio_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) redirect('/app/workouts/runs');

  return <RunDetailClient session={session} />;
}
