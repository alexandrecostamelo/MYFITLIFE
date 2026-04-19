'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';

function CheckoutContent() {
  const params = useSearchParams();
  const cycle = (params.get('cycle') || 'monthly') as 'monthly' | 'yearly';

  const [method, setMethod] = useState<'stripe' | 'pix'>('stripe');
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url: string;
    amount_cents: number;
    expires_at: string;
    order_id: string;
  } | null>(null);

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

  return (
    <main className="mx-auto max-w-md p-4">
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
            <span className="text-xs font-medium">Cartão</span>
            <span className="text-xs text-muted-foreground">Stripe · Apple/Google Pay</span>
          </button>
          <button
            onClick={() => setMethod('pix')}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${method === 'pix' ? sel : unsel}`}
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-xs font-medium">Pix</span>
            <span className="text-xs text-muted-foreground">PagarMe · instantâneo</span>
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        {method === 'stripe' && (
          <Button onClick={payWithStripe} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar com cartão'}
          </Button>
        )}

        {method === 'pix' && (
          <div className="space-y-2">
            <Label className="text-xs">CPF <span className="text-muted-foreground">(somente números)</span></Label>
            <Input
              value={document}
              onChange={(e) => setDocument(e.target.value.replace(/\D/g, ''))}
              placeholder="00000000000"
              maxLength={11}
              inputMode="numeric"
            />
            <Button
              onClick={payWithPix}
              disabled={loading || document.length !== 11}
              className="w-full"
              size="lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Gerar Pix · ${fmt(price)}`}
            </Button>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Pagamento seguro · Cancele quando quiser
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
