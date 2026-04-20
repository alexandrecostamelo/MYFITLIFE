import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FiscalClient from './fiscal-client';

export default async function FiscalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: professional } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) redirect('/app');

  const { data: config } = await supabase
    .from('professional_fiscal_config')
    .select('*')
    .eq('professional_id', user.id)
    .maybeSingle();

  return <FiscalClient initialConfig={config} />;
}
