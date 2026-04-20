const PAGARME_API = 'https://api.pagar.me/core/v5';

function authHeaders() {
  const key = process.env.PAGARME_API_KEY;
  if (!key) throw new Error('PAGARME_API_KEY not configured');
  const b64 = Buffer.from(`${key}:`).toString('base64');
  return {
    Authorization: `Basic ${b64}`,
    'Content-Type': 'application/json',
  };
}

export async function createPagarMeCustomer(data: {
  name: string;
  email: string;
  document?: string;
}) {
  const res = await fetch(`${PAGARME_API}/customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      document: data.document,
      document_type: data.document ? 'cpf' : undefined,
      type: 'individual',
    }),
  });
  if (!res.ok) throw new Error(`PagarMe customer failed: ${await res.text()}`);
  return res.json();
}

export async function createPagarMePixOrder(params: {
  customerId: string;
  amountCents: number;
  description: string;
  expiresInSeconds?: number;
}) {
  const res = await fetch(`${PAGARME_API}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      customer_id: params.customerId,
      items: [
        {
          amount: params.amountCents,
          description: params.description,
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: 'pix',
          pix: { expires_in: params.expiresInSeconds ?? 3600 },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PagarMe order failed: ${await res.text()}`);
  return res.json();
}

export async function getPagarMeOrder(orderId: string) {
  const res = await fetch(`${PAGARME_API}/orders/${orderId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`PagarMe get order failed: ${await res.text()}`);
  return res.json();
}

// ── Subscription / Recurring ──────────────────────────────────────

async function pmRequest<T = Record<string, unknown>>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${PAGARME_API}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err: any = new Error(data.message || `PagarMe ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data as T;
}

export async function createPagarMeCard(customerId: string, cardToken: string, billingAddress?: Record<string, unknown>) {
  return pmRequest(`/customers/${customerId}/cards`, 'POST', {
    token: cardToken,
    billing_address: billingAddress,
  });
}

export async function createCreditCardSubscription(params: {
  plan_id: string;
  customer_id: string;
  card_id: string;
  installments?: number;
  statement_descriptor?: string;
}) {
  return pmRequest('/subscriptions', 'POST', {
    plan_id: params.plan_id,
    customer_id: params.customer_id,
    payment_method: 'credit_card',
    card_id: params.card_id,
    installments: params.installments || 1,
    statement_descriptor: params.statement_descriptor || 'MYFITLIFE',
  });
}

export async function createBoletoSubscription(params: {
  plan_id: string;
  customer_id: string;
  billing_day?: number;
  boleto_due_days?: number;
}) {
  return pmRequest('/subscriptions', 'POST', {
    plan_id: params.plan_id,
    customer_id: params.customer_id,
    payment_method: 'boleto',
    billing_day: params.billing_day || new Date().getDate(),
    boleto: {
      due_days: params.boleto_due_days || 5,
      instructions: 'Pagamento da assinatura MyFitLife',
    },
  });
}

export async function getPagarMeSubscription(subId: string) {
  return pmRequest(`/subscriptions/${subId}`);
}

export async function cancelPagarMeSubscription(subId: string) {
  return pmRequest(`/subscriptions/${subId}`, 'DELETE');
}

// ── Pix Charges ───────────────────────────────────────────────────

export async function createPagarMePixCharge(params: {
  amountCents: number;
  customer: { name: string; email: string; document: string; document_type: 'CPF' | 'CNPJ' };
  expiresInSeconds?: number;
  description?: string;
  metadata?: Record<string, string>;
}) {
  const data = await pmRequest<Record<string, unknown>>('/orders', 'POST', {
    items: [
      {
        amount: params.amountCents,
        description: params.description || 'Assinatura MyFitLife Pro',
        quantity: 1,
      },
    ],
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      document: params.customer.document.replace(/\D/g, ''),
      document_type: params.customer.document_type,
      type: 'individual',
    },
    payments: [
      {
        payment_method: 'pix',
        pix: { expires_in: params.expiresInSeconds || 7 * 24 * 3600 },
      },
    ],
    metadata: params.metadata,
  });

  const charges = data.charges as Record<string, unknown>[] | undefined;
  const charge = charges?.[0];
  const txn = charge?.last_transaction as Record<string, unknown> | undefined;

  return {
    order_id: data.id as string,
    charge_id: charge?.id as string,
    qr_code: txn?.qr_code as string | undefined,
    qr_code_url: txn?.qr_code_url as string | undefined,
    expires_at: txn?.expires_at as string | undefined,
    amount: charge?.amount as number | undefined,
    status: charge?.status as string | undefined,
  };
}

export async function getPagarMeChargeStatus(chargeId: string) {
  const data = await pmRequest<Record<string, unknown>>(`/charges/${chargeId}`);
  return {
    id: data.id as string,
    status: data.status as string,
    paid_at: data.paid_at as string | undefined,
    amount: data.amount as number | undefined,
  };
}
