import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvoicesClient from './invoices-client';

export default async function ProfessionalInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: invoices } = await supabase
    .from('nfse_invoices')
    .select('id, reference, client_name, service_description, service_amount, tax_amount, net_amount, status, nfse_number, pdf_url, issued_at, created_at, error_message')
    .eq('professional_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return <InvoicesClient invoices={invoices || []} />;
}
