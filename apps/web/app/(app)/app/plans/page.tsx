'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, Star } from 'lucide-react';

const FREE_FEATURES = [
  'Diário alimentar (até 3 refeições/dia)',
  'Plano de treino básico',
  'Check-in semanal',
  '1 coach IA por dia',
];

const PRO_FEATURES = [
  'Tudo do plano gratuito',
  'Diário sem limites + fotos',
  'Autopilot (treino + cardápio IA)',
  'Consultas com profissionais',
  'Videochamada integrada',
  'Relatórios semanais e mensais',
  'Gamificação completa (XP, conquistas)',
  'Galeria de transformações',
  'Suporte prioritário',
];

export default function PlansPage() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/subscription').then((r) => r.json()).then((d) => {
      setSub(d.subscription);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isPro = sub?.plan === 'pro' && sub?.status === 'active';

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Planos</h1>
      </header>

      {isPro && (
        <Card className="mb-4 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <div>
              <p className="text-sm font-medium">Você já é Pro!</p>
              <p className="text-xs text-muted-foreground">
                Válido até {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/app/billing">Gerenciar assinatura</Link>
          </Button>
        </Card>
      )}

      {/* Free */}
      <Card className="mb-3 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Gratuito</h2>
          <span className="text-2xl font-bold">R$ 0</span>
        </div>
        <ul className="space-y-1.5 text-sm">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {f}
            </li>
          ))}
        </ul>
      </Card>

      {/* Pro */}
      <Card className="mb-4 border-primary p-4">
        <div className="mb-1 flex items-center gap-2">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <h2 className="font-bold text-primary">Pro</h2>
        </div>
        <ul className="mb-4 space-y-1.5 text-sm">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
            </li>
          ))}
        </ul>

        {!isPro ? (
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/app/checkout?cycle=monthly">
                Assinar mensal — R$ 29,90/mês
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/checkout?cycle=yearly">
                Assinar anual — R$ 249,90/ano <span className="ml-1 text-xs text-green-600">(economize 30%)</span>
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href="/app/billing">Gerenciar assinatura</Link>
          </Button>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Sem fidelidade. Cancele quando quiser.
      </p>
    </main>
  );
}
