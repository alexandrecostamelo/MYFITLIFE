import { createClient as createServiceClient } from '@supabase/supabase-js';
import { issueNfse, downloadPdf, downloadXml } from '@myfitlife/fiscal';

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const MAX_RETRIES = 3;

export async function requestNfseIssuance(appointmentId: string): Promise<{ ok: boolean; invoiceId?: string; reason?: string }> {
  const supa = admin();

  const { data: appointment } = await supa
    .from('appointments')
    .select('id, professional_id, client_id, price, status, scheduled_at')
    .eq('id', appointmentId)
    .maybeSingle();

  if (!appointment || !appointment.price) return { ok: false, reason: 'appointment_not_found' };

  const { data: existing } = await supa
    .from('nfse_invoices')
    .select('id, status')
    .eq('appointment_id', appointmentId)
    .maybeSingle();

  if (existing && ['issued', 'processing', 'pending'].includes(existing.status)) {
    return { ok: true, invoiceId: existing.id, reason: 'already_exists' };
  }

  const { data: fiscal } = await supa
    .from('professional_fiscal_config')
    .select('*')
    .eq('professional_id', appointment.professional_id)
    .eq('is_active', true)
    .maybeSingle();

  if (!fiscal) return { ok: false, reason: 'professional_not_configured' };

  const { data: clientProfile } = await supa
    .from('profiles')
    .select('full_name, email')
    .eq('id', appointment.client_id)
    .maybeSingle();

  const { data: professional } = await supa
    .from('professionals')
    .select('profession')
    .eq('user_id', appointment.professional_id)
    .maybeSingle();

  const reference = `mfl-${appointmentId.slice(0, 8)}-${Date.now()}`;
  const professionLabel = String(professional?.profession || 'profissional');
  const description = `Consulta ${professionLabel} via MyFitLife`;
  const amount = Number(appointment.price);
  const taxRate = Number(fiscal.tax_rate);
  const taxAmount = Math.round(amount * taxRate * 100) / 100;
  const netAmount = Math.round((amount - taxAmount) * 100) / 100;

  const { data: invoice } = await supa
    .from('nfse_invoices')
    .insert({
      appointment_id: appointmentId,
      professional_id: appointment.professional_id,
      client_id: appointment.client_id,
      client_name: clientProfile?.full_name || 'Cliente',
      client_email: clientProfile?.email || null,
      service_description: description,
      service_amount: amount,
      tax_amount: taxAmount,
      net_amount: netAmount,
      reference,
      status: 'pending',
    } as Record<string, unknown>)
    .select()
    .single();

  if (!invoice) return { ok: false, reason: 'invoice_create_failed' };

  return { ok: true, invoiceId: invoice.id };
}

export async function processInvoice(invoiceId: string): Promise<void> {
  const supa = admin();

  const { data: invoice } = await supa
    .from('nfse_invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) return;
  if (invoice.status === 'issued') return;
  if (invoice.retries >= MAX_RETRIES) {
    await supa.from('nfse_invoices').update({ status: 'error', error_message: 'Max retries exceeded' } as Record<string, unknown>).eq('id', invoiceId);
    return;
  }

  const { data: fiscal } = await supa
    .from('professional_fiscal_config')
    .select('*')
    .eq('professional_id', invoice.professional_id)
    .maybeSingle();

  if (!fiscal) {
    await supa.from('nfse_invoices').update({ status: 'error', error_message: 'No fiscal config' } as Record<string, unknown>).eq('id', invoiceId);
    return;
  }

  await supa.from('nfse_invoices').update({ status: 'processing' } as Record<string, unknown>).eq('id', invoiceId);

  try {
    const prestador: Record<string, unknown> = {
      codigo_municipio: fiscal.address_city_code,
      inscricao_municipal: fiscal.municipal_registration || undefined,
    };

    if (fiscal.document_type === 'cpf') {
      prestador.cpf = String(fiscal.document_number).replace(/\D/g, '');
    } else {
      prestador.cnpj = String(fiscal.document_number).replace(/\D/g, '');
    }

    const tomador: Record<string, unknown> = {
      razao_social: invoice.client_name,
      email: invoice.client_email || undefined,
    };

    if (invoice.client_document) {
      const doc = String(invoice.client_document).replace(/\D/g, '');
      if (doc.length === 11) tomador.cpf = doc;
      else if (doc.length === 14) tomador.cnpj = doc;
    }

    const payload = {
      reference: invoice.reference,
      prestador: prestador as any,
      tomador: tomador as any,
      servico: {
        aliquota: Number(fiscal.tax_rate),
        discriminacao: invoice.service_description,
        iss_retido: 'false' as const,
        item_lista_servico: fiscal.service_code,
        codigo_cnae: fiscal.cnae || undefined,
        valor_servicos: Number(invoice.service_amount),
        valor_iss: Number(invoice.tax_amount),
        valor_liquido: Number(invoice.net_amount),
      },
    };

    const result = await issueNfse(payload);

    await supa
      .from('nfse_invoices')
      .update({
        focusnfe_reference: invoice.reference,
        focusnfe_status: result.status,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', invoiceId);

    if (result.status === 'autorizado' || result.numero) {
      await persistDocuments(invoice.reference, invoiceId, invoice.professional_id, invoice.client_id);
      await supa
        .from('nfse_invoices')
        .update({
          status: 'issued',
          nfse_number: result.numero || null,
          verification_code: result.codigo_verificacao || null,
          issued_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', invoiceId);
    }
  } catch (err: any) {
    const code = err.code || 'unknown';
    const isTransient = ['timeout', 'network_error', 503, 502, 504].includes(code);
    const newRetries = (invoice.retries || 0) + 1;

    await supa
      .from('nfse_invoices')
      .update({
        status: isTransient && newRetries < MAX_RETRIES ? 'pending' : 'error',
        error_message: String(err.message || 'Unknown error').slice(0, 500),
        retries: newRetries,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', invoiceId);
  }
}

async function persistDocuments(
  reference: string,
  invoiceId: string,
  professionalId: string,
  clientId: string | null,
): Promise<void> {
  const supa = admin();

  try {
    const [pdfBuffer, xmlText] = await Promise.all([
      downloadPdf(reference).catch(() => null),
      downloadXml(reference).catch(() => null),
    ]);

    const folder = `${professionalId}/${clientId || 'none'}/${invoiceId}`;

    if (pdfBuffer) {
      const pdfPath = `${folder}/nfse.pdf`;
      await supa.storage.from('nfse-documents').upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
      const { data: pdfUrl } = await supa.storage.from('nfse-documents').createSignedUrl(pdfPath, 60 * 60 * 24 * 365);
      if (pdfUrl) {
        await supa.from('nfse_invoices').update({ pdf_url: pdfUrl.signedUrl } as Record<string, unknown>).eq('id', invoiceId);
      }
    }

    if (xmlText) {
      const xmlPath = `${folder}/nfse.xml`;
      await supa.storage.from('nfse-documents').upload(xmlPath, new Blob([xmlText]), {
        contentType: 'application/xml',
        upsert: true,
      });
      const { data: xmlUrl } = await supa.storage.from('nfse-documents').createSignedUrl(xmlPath, 60 * 60 * 24 * 365);
      if (xmlUrl) {
        await supa.from('nfse_invoices').update({ xml_url: xmlUrl.signedUrl } as Record<string, unknown>).eq('id', invoiceId);
      }
    }
  } catch (err) {
    console.error('persistDocuments failed:', err);
  }
}

export async function processPendingQueue(): Promise<{ processed: number; errors: number }> {
  const supa = admin();
  const { data: pending } = await supa
    .from('nfse_invoices')
    .select('id')
    .eq('status', 'pending')
    .lt('retries', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(20);

  let processed = 0;
  let errors = 0;
  for (const inv of pending || []) {
    try {
      await processInvoice(inv.id);
      processed++;
    } catch {
      errors++;
    }
  }
  return { processed, errors };
}
