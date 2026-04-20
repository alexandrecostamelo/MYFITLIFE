import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPlatformAdmin } from '@/lib/auth-helpers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const isAdmin = await isPlatformAdmin(supabase, user.id);
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month');
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'invalid_month', format: 'YYYY-MM' }, { status: 400 });
  }

  const [year, monthNum] = month.split('-').map(Number);
  const start = new Date(year, monthNum - 1, 1).toISOString();
  const end = new Date(year, monthNum, 0, 23, 59, 59).toISOString();

  const { data: invoices } = await supabase
    .from('nfse_invoices')
    .select('reference, nfse_number, issued_at, client_name, client_document, service_description, service_amount, tax_amount, net_amount')
    .eq('source', 'subscription')
    .eq('status', 'issued')
    .gte('issued_at', start)
    .lte('issued_at', end)
    .order('issued_at');

  const header = ['Numero NFSe', 'Data', 'Cliente', 'CPF/CNPJ', 'Servico', 'Valor', 'ISS', 'Liquido', 'Referencia'];

  const rows = (invoices || []).map((i: any) => [
    i.nfse_number || '',
    new Date(i.issued_at).toLocaleDateString('pt-BR'),
    i.client_name,
    i.client_document || '',
    i.service_description,
    Number(i.service_amount).toFixed(2).replace('.', ','),
    Number(i.tax_amount || 0).toFixed(2).replace('.', ','),
    Number(i.net_amount || 0).toFixed(2).replace('.', ','),
    i.reference,
  ]);

  const csv =
    '\uFEFF' +
    [header, ...rows]
      .map((r) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="nfse-myfitlife-${month}.csv"`,
    },
  });
}
