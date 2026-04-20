import { createClient as createAdmin } from '@supabase/supabase-js';
import { issueNfse, downloadPdf, downloadXml } from '@myfitlife/fiscal';

function admin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const MAX_RETRIES = 3;

function getMyfitlifeConfig() {
  return {
    cnpj: process.env.MYFITLIFE_CNPJ || '',
    legal_name: process.env.MYFITLIFE_LEGAL_NAME || 'MyFitLife Tecnologia LTDA',
    municipal_registration: process.env.MYFITLIFE_MUNICIPAL_REG || '',
    service_code: process.env.MYFITLIFE_SERVICE_CODE || '01.05',
    cnae: process.env.MYFITLIFE_CNAE || '',
    tax_rate: parseFloat(process.env.MYFITLIFE_TAX_RATE || '0.05'),
    city_code: process.env.MYFITLIFE_ADDR_CITY_CODE || '3550308',
  };
}

interface SubscriptionInvoiceInput {
  user_id: string;
  subscription_id: string;
  amount_cents: number;
  source_type: 'stripe' | 'pagarme' | 'pix';
  source_id: string;
  description: string;
}

export async function requestSubscriptionNfse(
  input: SubscriptionInvoiceInput,
): Promise<{ ok: boolean; invoiceId?: string; reason?: string }> {
  const supa = admin();

  // Deduplicate by source
  const sourceField =
    input.source_type === 'stripe'
      ? 'stripe_invoice_id'
      : input.source_type === 'pagarme'
        ? 'pagarme_invoice_id'
        : 'pix_charge_id';

  const { data: existing } = await supa
    .from('nfse_invoices')
    .select('id, status')
    .eq(sourceField, input.source_id)
    .eq('source', 'subscription')
    .maybeSingle();

  if (existing && existing.status !== 'error') {
    return { ok: true, invoiceId: existing.id, reason: 'already_exists' };
  }

  const { data: profile } = await supa
    .from('profiles')
    .select('full_name, email')
    .eq('id', input.user_id)
    .maybeSingle();

  const { data: fiscal } = await supa
    .from('user_fiscal_info')
    .select('document, document_type, name')
    .eq('user_id', input.user_id)
    .maybeSingle();

  const fiscalRec = fiscal as Record<string, unknown> | null;
  const profileRec = profile as Record<string, unknown> | null;
  const clientName = (fiscalRec?.name as string) || (profileRec?.full_name as string) || 'Cliente MyFitLife';
  const clientDoc = (fiscalRec?.document as string) || null;
  const clientEmail = (profileRec?.email as string) || null;

  const config = getMyfitlifeConfig();
  const reference = `mfl-sub-${input.source_id.slice(0, 12)}-${Date.now()}`;
  const amount = input.amount_cents / 100;
  const taxAmount = Math.round(amount * config.tax_rate * 100) / 100;
  const netAmount = Math.round((amount - taxAmount) * 100) / 100;

  const insertData: Record<string, unknown> = {
    professional_id: null,
    client_id: input.user_id,
    client_name: clientName,
    client_document: clientDoc,
    client_email: clientEmail,
    service_description: input.description,
    service_amount: amount,
    tax_amount: taxAmount,
    net_amount: netAmount,
    reference,
    status: 'pending',
    source: 'subscription',
    subscription_id: input.subscription_id,
  };

  if (input.source_type === 'stripe') insertData.stripe_invoice_id = input.source_id;
  if (input.source_type === 'pagarme') insertData.pagarme_invoice_id = input.source_id;
  if (input.source_type === 'pix') insertData.pix_charge_id = input.source_id;

  const { data: invoice } = await supa
    .from('nfse_invoices')
    .insert(insertData as Record<string, unknown>)
    .select('id')
    .single();

  if (!invoice) return { ok: false, reason: 'insert_failed' };
  return { ok: true, invoiceId: invoice.id };
}

export async function processSubscriptionInvoice(invoiceId: string): Promise<void> {
  const supa = admin();

  const { data: invoice } = await supa
    .from('nfse_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('source', 'subscription')
    .maybeSingle();

  if (!invoice) return;
  if (invoice.status === 'issued') return;
  if ((invoice.retries || 0) >= MAX_RETRIES) {
    await supa
      .from('nfse_invoices')
      .update({ status: 'error', error_message: 'Max retries exceeded' } as Record<string, unknown>)
      .eq('id', invoiceId);
    return;
  }

  await supa
    .from('nfse_invoices')
    .update({ status: 'processing' } as Record<string, unknown>)
    .eq('id', invoiceId);

  const config = getMyfitlifeConfig();

  try {
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
      prestador: {
        cnpj: config.cnpj,
        codigo_municipio: config.city_code,
        inscricao_municipal: config.municipal_registration || undefined,
      } as any,
      tomador: tomador as any,
      servico: {
        aliquota: config.tax_rate,
        discriminacao: invoice.service_description,
        iss_retido: 'false' as const,
        item_lista_servico: config.service_code,
        codigo_cnae: config.cnae || undefined,
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
      await persistDocuments(invoice.reference, invoiceId, invoice.client_id);

      await supa
        .from('nfse_invoices')
        .update({
          status: 'issued',
          nfse_number: result.numero || null,
          verification_code: result.codigo_verificacao || null,
          issued_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', invoiceId);

      await sendNfseEmail(invoiceId);
    }
  } catch (err: any) {
    const newRetries = (invoice.retries || 0) + 1;
    await supa
      .from('nfse_invoices')
      .update({
        status: newRetries < MAX_RETRIES ? 'pending' : 'error',
        error_message: String(err.message || 'Unknown error').slice(0, 500),
        retries: newRetries,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', invoiceId);
  }
}

async function persistDocuments(reference: string, invoiceId: string, clientId: string | null) {
  const supa = admin();
  try {
    const [pdf, xml] = await Promise.all([
      downloadPdf(reference).catch(() => null),
      downloadXml(reference).catch(() => null),
    ]);

    const folder = `subscriptions/${clientId || 'none'}/${invoiceId}`;

    if (pdf) {
      const path = `${folder}/nfse.pdf`;
      await supa.storage.from('nfse-documents').upload(path, pdf, { contentType: 'application/pdf', upsert: true });
      const { data: url } = await supa.storage.from('nfse-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
      if (url) {
        await supa.from('nfse_invoices').update({ pdf_url: url.signedUrl } as Record<string, unknown>).eq('id', invoiceId);
      }
    }

    if (xml) {
      const path = `${folder}/nfse.xml`;
      await supa.storage.from('nfse-documents').upload(path, new Blob([xml]), { contentType: 'application/xml', upsert: true });
      const { data: url } = await supa.storage.from('nfse-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
      if (url) {
        await supa.from('nfse_invoices').update({ xml_url: url.signedUrl } as Record<string, unknown>).eq('id', invoiceId);
      }
    }
  } catch (err) {
    console.error('persistDocuments (subscription):', err);
  }
}

async function sendNfseEmail(invoiceId: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const supa = admin();
  const { data: invoice } = await supa
    .from('nfse_invoices')
    .select('client_email, client_name, nfse_number, pdf_url, service_amount, service_description')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice?.client_email) return;

  const amount = Number(invoice.service_amount).toFixed(2).replace('.', ',');
  const cnpj = process.env.MYFITLIFE_CNPJ || '';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'MyFitLife <fiscal@myfitlife.app>',
      to: invoice.client_email,
      subject: `Nota fiscal MyFitLife - NFSe ${invoice.nfse_number || ''}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111;">Olá, ${String(invoice.client_name).split(' ')[0]}!</h2>
          <p>Sua nota fiscal da assinatura MyFitLife foi emitida.</p>
          <ul>
            <li><strong>NFSe:</strong> ${invoice.nfse_number || '-'}</li>
            <li><strong>Serviço:</strong> ${invoice.service_description}</li>
            <li><strong>Valor:</strong> R$ ${amount}</li>
          </ul>
          ${invoice.pdf_url ? `<p><a href="${invoice.pdf_url}" style="background: #000; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Baixar PDF</a></p>` : ''}
          <p style="color: #666; font-size: 12px; margin-top: 32px;">MyFitLife Tecnologia LTDA — CNPJ ${cnpj}</p>
        </div>
      `,
    }),
  }).catch(() => null);
}

export async function processPendingSubscriptionQueue(): Promise<{ processed: number; errors: number }> {
  const supa = admin();

  const { data: pending } = await supa
    .from('nfse_invoices')
    .select('id')
    .eq('source', 'subscription')
    .eq('status', 'pending')
    .lt('retries', MAX_RETRIES)
    .order('created_at', { ascending: true })
    .limit(20);

  let processed = 0;
  let errors = 0;

  for (const inv of pending || []) {
    try {
      await processSubscriptionInvoice(inv.id);
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
