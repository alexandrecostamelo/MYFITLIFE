'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CreditCard, Smartphone, CheckCircle2, FileText } from 'lucide-react';

type Method = 'stripe' | 'pix' | 'card_br' | 'boleto';

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const cycle = (params.get('cycle') || 'monthly') as 'monthly' | 'yearly';

  const [method, setMethod] = useState<Method>('stripe');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url: string;
    amount_cents: number;
    expires_at: string;
    order_id: string;
  } | null>(null);

  // Card BR fields
  const [cardForm, setCardForm] = useState({
    name: '',
    card_number: '',
    card_holder: '',
    card_exp_month: '',
    card_exp_year: '',
    card_cvv: '',
    address_zip: '',
    address_street: '',
    address_number: '',
    address_city: '',
    address_state: '',
  });
  const upCard = (k: string, v: string) => setCardForm((f) => ({ ...f, [k]: v }));

  const PRICE_MONTHLY = 2990;
  const PRICE_YEARLY  = 24990;
  const price = cycle === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
  const fmt = (c: number) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;

  async function payWithStripe() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/billing/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || 'Erro ao redirecionar');
      setLoading(false);
    }
  }

  async function payWithPix() {
    if (!/^\d{11}$/.test(document)) {
      setError('CPF inválido — informe só os 11 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/billing/pagarme/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycle, document }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || 'Erro ao gerar Pix');
      setLoading(false);
      return;
    }
    setPixData(data);
    setLoading(false);
  }

  async function payWithPagarMeRecurring(payMethod: 'credit_card' | 'boleto') {
    const doc = document.replace(/\D/g, '');
    if (!doc) { setError('Informe o CPF/CNPJ'); return; }
    const name = payMethod === 'credit_card' ? cardForm.name : cardForm.name;
    if (!name) { setError('Informe seu nome completo'); return; }

    setLoading(true);
    setError('');

    try {
      let cardToken: string | undefined;
      if (payMethod === 'credit_card') {
        // Tokenize card via PagarMe API
        const pubKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
        if (!pubKey) { setError('Chave PagarMe não configurada'); setLoading(false); return; }

        const tokenRes = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${pubKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'card',
            card: {
              number: cardForm.card_number.replace(/\s/g, ''),
              holder_name: cardForm.card_holder || name,
              exp_month: parseInt(cardForm.card_exp_month),
              exp_year: parseInt(cardForm.card_exp_year),
              cvv: cardForm.card_cvv,
            },
          }),
        });
        if (!tokenRes.ok) {
          const err = await tokenRes.json().catch(() => ({}));
          setError(err.message || 'Erro ao validar cartão');
          setLoading(false);
          return;
        }
        const tokenData = await tokenRes.json();
        cardToken = tokenData.id;
      }

      const plan = cycle === 'yearly' ? 'pro_yearly' : 'pro_monthly';
      const res = await fetch('/api/billing/pagarme/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          method: payMethod,
          card_token: cardToken,
          customer: { name, document: doc, document_type: documentType },
          billing_address: cardForm.address_zip
            ? {
                line_1: `${cardForm.address_number}, ${cardForm.address_street}`,
                zip_code: cardForm.address_zip.replace(/\D/g, ''),
                city: cardForm.address_city,
                state: cardForm.address_state,
                country: 'BR',
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha ao criar assinatura');
        setLoading(false);
        return;
      }
      router.push('/app/billing?success=1');
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
      setLoading(false);
    }
  }

  if (pixData) {
    return (
      <main className="mx-auto max-w-md p-4">
        <header className="mb-4 flex items-center gap-2">
          <Link href="/app/plans" className="rounded p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Pagamento via Pix</h1>
        </header>

        <Card className="p-5 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <p className="mb-1 font-medium">Pix gerado com sucesso!</p>
          <p className="mb-4 text-sm text-muted-foreground">Valor: {fmt(pixData.amount_cents)}</p>

          {pixData.qr_code_url && (
            <img src={pixData.qr_code_url} alt="QR Code Pix" className="mx-auto mb-4 h-56 w-56 rounded" />
          )}

          <Label className="mb-1 block text-xs">Copia e cola:</Label>
          <textarea
            readOnly
            value={pixData.qr_code}
            className="mb-2 w-full rounded border bg-muted p-2 text-xs font-mono"
            rows={4}
          />
          <Button
            variant="outline"
            size="sm"
            className="mb-4 w-full"
            onClick={() => navigator.clipboard?.writeText(pixData.qr_code)}
          >
            Copiar código Pix
          </Button>

          <p className="mb-4 text-xs text-muted-foreground">
            Válido por 1 hora. Após o pagamento, sua assinatura é ativada automaticamente.
          </p>

          <Button asChild className="w-full">
            <Link href="/app/billing">Ver minha assinatura</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const sel   = 'border-primary bg-primary/10 text-primary';
  const unsel = 'border-input hover:bg-muted';

  const needsDocument = method === 'pix' || method === 'card_br' || method === 'boleto';
  const needsCardFields = method === 'card_br';
  const needsAddress = method === 'card_br' || method === 'boleto';

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/plans" className="rounded p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Finalizar assinatura</h1>
      </header>

      {/* Resumo do plano */}
      <Card className="mb-4 p-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium">MyFitLife Pro</span>
          <span>{cycle === 'monthly' ? 'Mensal' : 'Anual'}</span>
        </div>
        <div className="text-2xl font-bold">{fmt(price)}</div>
        {cycle === 'yearly' && (
          <p className="text-xs text-green-600">Equivale a {fmt(Math.round(price / 12))}/mês — economize 30%</p>
        )}
      </Card>

      {/* Método */}
      <Card className="mb-4 p-4">
        <h3 className="mb-3 text-sm font-medium">Método de pagamento</h3>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMethod('stripe')}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${method === 'stripe' ? sel : unsel}`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-medium">Cartão Int.</span>
            <span className="text-xs text-muted-foreground">Stripe · Apple Pay</span>
          </button>
          <button
            onClick={() => setMethod('card_br')}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${method === 'card_br' ? sel : unsel}`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs font-medium">Cartão BR</span>
            <span className="text-xs text-muted-foreground">Recorrente · PagarMe</span>
          </button>
          <button
            onClick={() => setMethod('pix')}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${method === 'pix' ? sel : unsel}`}
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-xs font-medium">Pix</span>
            <span className="text-xs text-muted-foreground">Avulso · instantâneo</span>
          </button>
          <button
            onClick={() => setMethod('boleto')}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${method === 'boleto' ? sel : unsel}`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Boleto</span>
            <span className="text-xs text-muted-foreground">Recorrente · mensal</span>
          </button>
        </div>

        {/* Document + Name for BR methods */}
        {needsDocument && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome completo</Label>
              <Input
                value={cardForm.name}
                onChange={(e) => upCard('name', e.target.value)}
                placeholder="Como consta no documento"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as 'CPF' | 'CNPJ')}
                className="rounded-md border px-2 text-sm bg-background"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
              <div className="flex-1 space-y-1">
                <Input
                  value={document}
                  onChange={(e) => setDocument(e.target.value.replace(/\D/g, ''))}
                  placeholder={documentType === 'CPF' ? '00000000000' : '00000000000000'}
                  maxLength={documentType === 'CPF' ? 11 : 14}
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>
        )}

        {/* Card fields for card_br */}
        {needsCardFields && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium">Dados do cartão</p>
            <div className="space-y-1">
              <Label className="text-xs">Número do cartão</Label>
              <Input
                value={cardForm.card_number}
                onChange={(e) => upCard('card_number', e.target.value)}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nome impresso no cartão</Label>
              <Input
                value={cardForm.card_holder}
                onChange={(e) => upCard('card_holder', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Mês</Label>
                <Input value={cardForm.card_exp_month} onChange={(e) => upCard('card_exp_month', e.target.value)} placeholder="12" inputMode="numeric" maxLength={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ano</Label>
                <Input value={cardForm.card_exp_year} onChange={(e) => upCard('card_exp_year', e.target.value)} placeholder="2030" inputMode="numeric" maxLength={4} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CVV</Label>
                <Input value={cardForm.card_cvv} onChange={(e) => upCard('card_cvv', e.target.value)} placeholder="000" inputMode="numeric" maxLength={4} />
              </div>
            </div>
          </div>
        )}

        {/* Address for card_br / boleto */}
        {needsAddress && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium">Endereço de cobrança</p>
            <div className="space-y-1">
              <Label className="text-xs">CEP</Label>
              <Input value={cardForm.address_zip} onChange={(e) => upCard('address_zip', e.target.value)} placeholder="00000-000" inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rua</Label>
              <Input value={cardForm.address_street} onChange={(e) => upCard('address_street', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Nº</Label>
                <Input value={cardForm.address_number} onChange={(e) => upCard('address_number', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Cidade</Label>
                <Input value={cardForm.address_city} onChange={(e) => upCard('address_city', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">UF</Label>
              <Input value={cardForm.address_state} onChange={(e) => upCard('address_state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
            </div>
          </div>
        )}

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {method === 'stripe' && (
          <Button onClick={payWithStripe} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar com cartão'}
          </Button>
        )}

        {method === 'pix' && (
          <Button
            onClick={payWithPix}
            disabled={loading || document.length < 11}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Gerar Pix · ${fmt(price)}`}
          </Button>
        )}

        {method === 'card_br' && (
          <Button
            onClick={() => payWithPagarMeRecurring('credit_card')}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Assinar com cartão · ${fmt(price)}`}
          </Button>
        )}

        {method === 'boleto' && (
          <Button
            onClick={() => payWithPagarMeRecurring('boleto')}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Assinar com boleto · ${fmt(price)}`}
          </Button>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento seguro · Cancele quando quiser
        {method === 'boleto' && ' · Primeiro boleto em até 5 dias'}
        {(method === 'card_br' || method === 'boleto') && ' · Cobrança recorrente automática'}
      </p>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
