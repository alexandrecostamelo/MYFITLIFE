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
