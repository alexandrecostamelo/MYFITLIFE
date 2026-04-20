import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CancelFlowClient } from './cancel-flow-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cancelar assinatura — MyFitLife' };

export default async function CancelFlowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, billing_cycle, status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  const subRec = sub as Record<string, unknown> | null;
  if (!subRec || subRec.status === 'canceled') redirect('/app/billing');

  return (
    <CancelFlowClient
      currentTier={String(subRec.plan || 'pro')}
      cycle={String(subRec.billing_cycle || 'monthly')}
      periodEnd={subRec.current_period_end ? String(subRec.current_period_end) : null}
    />
  );
}
