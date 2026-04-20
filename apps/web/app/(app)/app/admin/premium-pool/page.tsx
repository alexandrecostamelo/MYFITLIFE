import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import { PremiumPoolClient } from './premium-pool-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pool Premium — Admin' };

export default async function PremiumPoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformAdmin(supabase, user.id))) redirect('/app');

  return <PremiumPoolClient />;
}
