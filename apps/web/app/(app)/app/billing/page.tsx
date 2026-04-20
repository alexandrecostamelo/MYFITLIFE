'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle2, Star, Receipt, FileText, Smartphone, ArrowRightLeft } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  free: 'Gratuito',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'text-green-600',
  trialing: 'text-blue-600',
  past_due: 'text-amber-600',
  canceled: 'text-muted-foreground',
  free: 'text-muted-foreground',
};

function BillingContent() {
  const params = useSearchParams();
  const stripeSuccess = params.get('stripe_success') === '1';
  const generalSuccess = params.get('success') === '1';

  const [sub, setSub] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingPix, setPendingPix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/me/subscription').then((r) => r.json()),
      fetch('/api/billing/transactions').then((r) => r.json()),
      fetch('/api/billing/pix-pending').then((r) => r.json()).catch(() => ({ charge: null })),
    ]).then(([subData, txData, pixData]) => {
      setSub(subData.subscription);
      setTransactions(txData.transactions || []);
      setPendingPix(pixData.charge || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function openStripePortal() {
    setPortalLoading(true);
    const res = await fetch('/api/billing/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortalLoading(false);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const isPro = (sub?.plan === 'pro' || sub?.plan === 'premium') && sub?.status === 'active';

  return (
    <main className="mx-auto max-w-xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Assinatura</h1>
      </header>

      {(stripeSuccess || generalSuccess) && (
        <Card className="mb-4 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Assinatura criada com sucesso! Seu plano Pro está ativo.
          </p>
        </Card>
      )}

      {/* Status da assinatura */}
      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center gap-3">
          {isPro ? (
            <Star className="h-8 w-8 fill-primary text-primary" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">—</div>
          )}
          <div>
            <p className="font-bold">{isPro ? `MyFitLife ${sub?.plan === 'premium' ? 'Premium' : 'Pro'}` : 'Plano Gratuito'}</p>
            <p className={`text-sm ${STATUS_COLOR[sub?.status || 'free'] || 'text-muted-foreground'}`}>
              {STATUS_LABEL[sub?.status || 'free'] || sub?.status}
              {sub?.billing_cycle && ` · ${sub.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}`}
            </p>
          </div>
        </div>

        {sub?.current_period_end && (
          <p className="mb-3 text-xs text-muted-foreground">
            {sub.cancel_at_period_end ? 'Cancela em' : 'Renova em'}{' '}
            {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
          </p>
        )}

        {isPro && sub?.provider === 'stripe' && (
          <Button onClick={openStripePortal} disabled={portalLoading} variant="outline" className="w-full">
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerenciar cartão (Stripe)'}
          </Button>
        )}

        {isPro && sub?.provider === 'pagarme' && (
          <div className="space-y-2">
            {sub.card_last4 && (
              <p className="text-xs text-muted-foreground">
                Cartão: •••• {sub.card_last4} {sub.card_brand && `(${sub.card_brand})`}
              </p>
            )}
            {sub.payment_method === 'boleto' && sub.last_invoice_url && (
              <a href={sub.last_invoice_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <FileText className="h-3 w-3" /> Ver último boleto
                </Button>
              </a>
            )}
          </div>
        )}

        {isPro && (
          <Button asChild variant="outline" className="w-full mt-2 text-destructive hover:text-destructive">
            <Link href="/app/billing/cancel">Cancelar assinatura</Link>
          </Button>
        )}

        {isPro && (
          <Button asChild variant="outline" className="w-full mt-2">
            <Link href="/app/billing/change-plan">
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Mudar plano ou ciclo
            </Link>
          </Button>
        )}

        {!isPro && (
          <Button asChild className="w-full">
            <Link href="/app/plans">Ver planos</Link>
          </Button>
        )}
      </Card>

      {/* Pix pendente de renovação */}
      {pendingPix && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-sm">Renovação pendente</h3>
              <p className="text-xs text-muted-foreground">
                R$ {(pendingPix.amount_cents / 100).toFixed(2).replace('.', ',')} via Pix
                {pendingPix.expires_at && ` · expira em ${new Date(pendingPix.expires_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
          </div>
          {pendingPix.qr_code_url && (
            <img src={pendingPix.qr_code_url} alt="QR Pix" className="w-48 h-48 mx-auto rounded" />
          )}
          {pendingPix.qr_code && (
            <>
              <div className="rounded bg-background p-2 text-xs font-mono break-all max-h-24 overflow-y-auto">
                {pendingPix.qr_code}
              </div>
              <Button
                onClick={() => navigator.clipboard?.writeText(pendingPix.qr_code)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Copiar código Pix
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Histórico de transações */}
      {transactions.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Receipt className="h-4 w-4" /> Histórico de pagamentos
          </h2>
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{t.description || 'MyFitLife Pro'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('pt-BR')} ·{' '}
                    {t.method === 'pix' ? 'Pix' : t.method === 'card' ? 'Cartão' : t.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {(t.amount_cents / 100).toFixed(2).replace('.', ',')}</p>
                  <p className={`text-xs ${
                    t.status === 'paid' ? 'text-green-600' :
                    t.status === 'pending' ? 'text-amber-600' :
                    'text-destructive'
                  }`}>
                    {t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status === 'failed' ? 'Falhou' : t.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
