const BASE_URL = process.env.FOCUSNFE_BASE_URL || 'https://homologacao.focusnfe.com.br';
const TOKEN = process.env.FOCUSNFE_TOKEN || '';

interface FocusRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

async function focusRequest<T = Record<string, unknown>>({ path, method = 'GET', body, query }: FocusRequest): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

  const auth = Buffer.from(`${TOKEN}:`).toString('base64');
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(String(data.mensagem || data.error || `Focus ${res.status}`));
    (err as any).code = data.codigo || data.status || res.status;
    (err as any).response = data;
    throw err;
  }
  return data as T;
}

export interface NfseIssuePayload {
  reference: string;
  prestador: {
    cnpj?: string;
    cpf?: string;
    inscricao_municipal?: string;
    codigo_municipio: string;
  };
  tomador: {
    cpf?: string;
    cnpj?: string;
    razao_social: string;
    email?: string;
  };
  servico: {
    aliquota: number;
    discriminacao: string;
    iss_retido: 'true' | 'false';
    item_lista_servico: string;
    codigo_cnae?: string;
    valor_servicos: number;
    valor_iss?: number;
    valor_liquido?: number;
  };
}

export async function issueNfse(payload: NfseIssuePayload): Promise<any> {
  return focusRequest({
    path: `/v2/nfse?ref=${encodeURIComponent(payload.reference)}`,
    method: 'POST',
    body: payload as unknown as Record<string, unknown>,
  });
}

export async function consultNfse(reference: string): Promise<any> {
  return focusRequest({
    path: `/v2/nfse/${encodeURIComponent(reference)}`,
    method: 'GET',
  });
}

export async function cancelNfse(reference: string, justification: string): Promise<any> {
  return focusRequest({
    path: `/v2/nfse/${encodeURIComponent(reference)}`,
    method: 'DELETE',
    body: { justificativa: justification },
  });
}

export async function downloadPdf(reference: string): Promise<ArrayBuffer> {
  const auth = Buffer.from(`${TOKEN}:`).toString('base64');
  const res = await fetch(`${BASE_URL}/v2/nfse/${encodeURIComponent(reference)}.pdf`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`PDF download failed: ${res.status}`);
  return res.arrayBuffer();
}

export async function downloadXml(reference: string): Promise<string> {
  const auth = Buffer.from(`${TOKEN}:`).toString('base64');
  const res = await fetch(`${BASE_URL}/v2/nfse/${encodeURIComponent(reference)}.xml`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`XML download failed: ${res.status}`);
  return res.text();
}
