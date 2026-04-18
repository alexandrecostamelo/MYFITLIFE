'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ClaimGymPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [existingClaim, setExistingClaim] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const [gymRes, claimsRes] = await Promise.all([
        fetch(`/api/gym-places/${id}`).then((r) => r.json()),
        fetch('/api/gym-claims').then((r) => r.json()),
      ]);
      setGym(gymRes.gym);
      const mine = (claimsRes.claims || []).find((c: any) => c.gym_place_id === id);
      setExistingClaim(mine || null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function submit() {
    setSubmitting(true);
    const res = await fetch('/api/gym-claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gym_place_id: id, message: message || undefined }),
    });
    setSubmitting(false);
    if (res.ok) setDone(true);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!gym) return <div className="p-6">Academia não encontrada</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href={`/app/explore/${id}`} className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">Reivindicar academia</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="mb-1 text-sm font-medium">{gym.name}</div>
        {gym.address && <div className="text-xs text-muted-foreground">{gym.address}</div>}
        {(gym.city || gym.state) && (
          <div className="text-xs text-muted-foreground">{[gym.city, gym.state].filter(Boolean).join(', ')}</div>
        )}
      </Card>

      {done ? (
        <Card className="p-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-500" />
          <h2 className="mb-1 font-medium">Solicitação enviada!</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Nossa equipe vai analisar e confirmar que você é o responsável por essa academia. Você receberá uma resposta em até 3 dias úteis.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/app/explore/${id}`}>Voltar para a academia</Link>
          </Button>
        </Card>
      ) : existingClaim ? (
        <Card className="p-4">
          <div className="mb-2 text-sm font-medium">Solicitação já enviada</div>
          <div className="mb-3 text-sm text-muted-foreground">
            Status:{' '}
            <span className={
              existingClaim.status === 'approved' ? 'text-green-600' :
              existingClaim.status === 'rejected' ? 'text-destructive' :
              'text-amber-600'
            }>
              {existingClaim.status === 'approved' ? 'Aprovada' :
               existingClaim.status === 'rejected' ? 'Rejeitada' :
               'Em análise'}
            </span>
          </div>
          {existingClaim.admin_notes && (
            <p className="text-sm text-muted-foreground">Observação: {existingClaim.admin_notes}</p>
          )}
          <Button asChild variant="outline" className="mt-3 w-full">
            <Link href={`/app/explore/${id}`}>Voltar</Link>
          </Button>
        </Card>
      ) : (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium">Solicitar propriedade</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Ao reivindicar, você terá acesso ao painel de administração com métricas e poderá gerenciar as informações da academia. Nossa equipe validará sua solicitação.
          </p>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Mensagem (opcional) — descreva como podemos verificar que você é o responsável
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder="Ex: Sou o proprietário da Smart Fit Centro há 5 anos. CNPJ: 00.000.000/0001-00"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar solicitação'}
          </Button>
        </Card>
      )}
    </main>
  );
}
