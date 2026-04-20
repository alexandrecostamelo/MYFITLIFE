import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MyInvoicesClient from './my-invoices-client';

export default async function MyInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: invoices } = await supabase
    .from('nfse_invoices')
    .select('id, service_description, service_amount, status, nfse_number, pdf_url, issued_at, created_at')
    .eq('client_id', user.id)
    .eq('status', 'issued')
    .order('issued_at', { ascending: false })
    .limit(50);

  return <MyInvoicesClient invoices={invoices || []} />;
}
