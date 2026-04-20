import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isPlatformAdmin } from '@/lib/auth-helpers';
import FiscalReportClient from './fiscal-report-client';

export const dynamic = 'force-dynamic';

export default async function FiscalReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) redirect('/app');

  const { data: summary } = await supabase
    .from('nfse_invoices')
    .select('status, service_amount')
    .eq('source', 'subscription')
    .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString());

  const byStatus: Record<string, { count: number; total: number }> = {};
  let totalIssuedYear = 0;

  for (const inv of summary || []) {
    const s = String(inv.status || 'unknown');
    if (!byStatus[s]) byStatus[s] = { count: 0, total: 0 };
    byStatus[s].count++;
    byStatus[s].total += Number(inv.service_amount);
    if (s === 'issued') totalIssuedYear += Number(inv.service_amount);
  }

  return <FiscalReportClient byStatus={byStatus} totalIssuedYear={totalIssuedYear} />;
}
