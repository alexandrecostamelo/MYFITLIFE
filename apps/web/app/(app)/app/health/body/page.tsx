import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BodyCompClient } from './body-comp-client';

export const dynamic = 'force-dynamic';

export default async function BodyCompositionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: records } = await supabase
    .from('body_compositions')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(50);

  return (
    <BodyCompClient
      records={(records || []) as Record<string, unknown>[]}
    />
  );
}
