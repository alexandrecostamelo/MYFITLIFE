import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardMetricsClient } from './dashboard-metrics-client';

export const dynamic = 'force-dynamic';

export default async function DashboardMetricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('dashboard_metrics')
    .eq('id', user.id)
    .single();

  const rec = profile as Record<string, unknown> | null;
  const current = Array.isArray(rec?.dashboard_metrics)
    ? (rec.dashboard_metrics as string[])
    : ['streak', 'sessions', 'minutes'];

  return <DashboardMetricsClient current={current} />;
}
