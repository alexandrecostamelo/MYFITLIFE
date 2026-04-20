import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ImportClient } from './import-client';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: history } = await supabase
    .from('workout_imports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <ImportClient
      history={(history || []) as Record<string, unknown>[]}
    />
  );
}
