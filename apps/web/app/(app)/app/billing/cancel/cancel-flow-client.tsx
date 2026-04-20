'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Heart, Pause, Gift, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import {
  REASON_LABELS,
  type CancelReason,
  type Offer,
} from '@/lib/billing/retention-offers';

interface Props {
  currentTier: string;
  cycle: string;
  periodEnd: string | null;
}

type Step = 'reason' | 'offer' | 'confirm' | 'done';

function offerIcon(type: string) {
  if (type.startsWith('pause')) return <Pause className="h-5 w-5 text-primary flex-shrink-0" />;
  if (type.startsWith('discount')) return <Gift className="h-5 w-5 text-primary flex-shrink-0" />;
  return <ArrowDownCircle className="h-5 w-5 text-primary flex-shrink-0" />;
}

export function CancelFlowClient({ currentTier, cycle, periodEnd }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('reason');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [details, setDetails] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');

  useEffect(() => {
    fetch('/api/billing/cancel/start', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.attempt_id) setAttemptId(data.attempt_id);
      });
  }, []);

  const submitReason = async () => {
    if (!reason || !attemptId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/billing/cancel/reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, reason, details }),
      });
      const data = await res.json();
      if (data.offers?.length > 0) {
        setOffers(data.offers);
        setStep('offer');
      } else {
        setStep('confirm');
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptOffer = async (offerType: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/cancel/accept-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, offer_type: offerType }),
      });
      const data = await res.json();
      if (data.redirect) {
        router.push(data.redirect);
        return;
      }
      if (data.result === 'paused') {
        setFinalMessage(
          `Assinatura pausada até ${new Date(data.until).toLocaleDateString('pt-BR')}. Voltamos a cobrar depois dessa data.`,
        );
      } else if (data.result === 'discount_applied') {
        setFinalMessage('50% off aplicado pelos próximos 2 meses. Continue aproveitando!');
      }
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/cancel/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      const data = await res.json();
      setFinalMessage(data.message || 'Cancelamento confirmado.');
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  const abort = async () => {
    if (attemptId) {
      fetch('/api/billing/cancel/abort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      }).catch(() => null);
    }
    router.push('/app/billing');
  };

  if (step === 'done') {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center space-y-4">
        <Heart className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Tudo certo</h1>
        <p className="text-muted-foreground">{finalMessage}</p>
        <Button onClick={() => router.push('/app/billing')} className="w-full">
          Voltar
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-4">
      <button onClick={abort} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar (sem cancelar)
      </button>

      {step === 'reason' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Antes de ir embora...</h1>
            <p className="text-sm text-muted-foreground">Queremos entender o que aconteceu</p>
          </div>

          <div className="space-y-2">
            {(Object.entries(REASON_LABELS) as [CancelReason, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setReason(key)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-colors ${
                  reason === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {reason === 'other' && (
            <Textarea
              placeholder="Conta pra gente o que aconteceu (opcional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          )}

          <Button onClick={submitReason} disabled={!reason || loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Continuar
          </Button>
        </div>
      )}

      {step === 'offer' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Espera, temos uma ideia</h1>
            <p className="text-sm text-muted-foreground">Alternativa antes de cancelar:</p>
          </div>

          <div className="space-y-3">
            {offers.map((offer) => (
              <div
                key={offer.type}
                className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-2"
              >
                <div className="flex items-start gap-2">
                  {offerIcon(offer.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold">{offer.title}</h3>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => acceptOffer(offer.type)}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {offer.cta}
                </Button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('confirm')}
            className="w-full text-sm text-muted-foreground underline py-2"
          >
            Não, quero cancelar mesmo
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h1 className="text-2xl font-bold">Tem certeza?</h1>
          <div className="rounded-xl border bg-muted/50 p-4 text-sm space-y-2">
            <p>
              {'\u2022'} Você perde acesso ao{' '}
              {currentTier === 'premium'
                ? 'Premium (consultoria humana)'
                : 'Pro (autopilot, coach ilimitado)'}
            </p>
            <p>{'\u2022'} Seu histórico de treinos fica salvo</p>
            <p>
              {'\u2022'} Acesso continua até{' '}
              <strong>
                {periodEnd
                  ? new Date(periodEnd).toLocaleDateString('pt-BR')
                  : 'o fim do período pago'}
              </strong>
            </p>
            <p>{'\u2022'} Pode voltar a qualquer momento</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={confirmCancel}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sim, cancelar assinatura
            </Button>
            <Button onClick={abort} variant="outline" className="w-full">
              Não, voltar
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
