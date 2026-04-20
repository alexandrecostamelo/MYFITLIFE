import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ref = body.ref || body.reference || '';
    const status = body.status || '';

    if (!ref) {
      return NextResponse.json({ error: 'missing ref' }, { status: 400 });
    }

    const supa = admin();

    const { data: invoice } = await supa
      .from('nfse_invoices')
      .select('id, status')
      .eq('reference', ref)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: 'invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'issued') {
      return NextResponse.json({ ok: true, message: 'already issued' });
    }

    const updateData: Record<string, unknown> = {
      focusnfe_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'autorizado') {
      updateData.status = 'issued';
      updateData.nfse_number = body.numero || null;
      updateData.verification_code = body.codigo_verificacao || null;
      updateData.issued_at = new Date().toISOString();
    } else if (status === 'erro_autorizacao' || status === 'cancelado') {
      updateData.status = 'error';
      updateData.error_message = body.mensagem || body.erros?.[0]?.mensagem || status;
    }

    await supa
      .from('nfse_invoices')
      .update(updateData as Record<string, unknown>)
      .eq('id', invoice.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('focusnfe webhook error:', err);
    return NextResponse.json({ error: String(err.message) }, { status: 500 });
  }
}
