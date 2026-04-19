'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WEEKDAY_LABELS } from '@myfitlife/core/scheduling';
import { ArrowLeft, Loader2, Calendar, Shield } from 'lucide-react';

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pro, setPro] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modality, setModality] = useState<string>('online');
  const [notes, setNotes] = useState('');
  const [shareHistory, setShareHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/professionals/${id}`).then((r) => r.json()),
      fetch(`/api/professionals/${id}/slots`).then((r) => r.json()),
    ]).then(([detail, slots]) => {
      setPro(detail.professional);
      setDays(slots.days || []);
      if (detail.professional?.modalities?.length > 0) {
        setModality(detail.professional.modalities[0]);
      }
      setLoading(false);
    });
  }, [id]);

  async function book() {
    if (!selectedSlot) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professional_id: id,
        scheduled_at: selectedSlot,
        duration_min: 60,
        modality,
        client_notes: notes || undefined,
        share_history: shareHistory,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error === 'slot_taken' ? 'Este horário acabou de ser reservado. Escolha outro.' : data.error || 'Erro');
      return;
    }
    router.push(`/app/appointments/${data.id}`);
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!pro) return <div className="p-6">Profissional não encontrado</div>;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href={`/app/professionals/${id}`} className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Agendar com {pro.full_name}</h1>
      </header>

      <Card className="mb-4 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Calendar className="h-4 w-4" /> Escolha data e horário
        </h2>

        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este profissional não tem horários disponíveis nos próximos 14 dias.</p>
        ) : (
          <div className="space-y-3">
            {days.map((d) => {
              const date = new Date(d.date + 'T00:00');
              return (
                <div key={d.date}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    {WEEKDAY_LABELS[date.getDay()]} · {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.slots.map((s: any) => (
                      <button
                        key={s.iso}
                        onClick={() => setSelectedSlot(s.iso)}
                        className={`rounded border px-3 py-1 text-xs ${selectedSlot === s.iso ? 'border-primary bg-primary text-white' : 'border-input hover:border-primary'}`}
                      >
                        {s.start}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {selectedSlot && (
        <>
          {pro.modalities?.length > 0 && (
            <Card className="mb-4 p-4">
              <Label>Modalidade</Label>
              <div className="mt-2 flex gap-2">
                {pro.modalities.map((m: string) => (
                  <button
                    key={m}
                    onClick={() => setModality(m)}
                    className={`rounded border px-3 py-1 text-xs ${modality === m ? 'border-primary bg-primary/10' : 'border-input'}`}
                  >
                    {m === 'online' ? 'Online' : m === 'presencial' ? 'Presencial' : 'Domiciliar'}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="mb-4 p-4">
            <Label>Observações para o profissional (opcional)</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-transparent p-2 text-sm"
              rows={3}
              placeholder="Sua queixa, objetivo, histórico relevante..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          </Card>

          <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <Shield className="h-5 w-5 flex-shrink-0 text-amber-700" />
              <div className="flex-1">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={shareHistory}
                    onChange={(e) => setShareHistory(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-amber-900">Compartilhar meu histórico resumido</div>
                    <p className="text-xs text-amber-800">
                      Permite que este profissional veja um resumo dos seus treinos (30d), refeições (30d), peso, sono, energia e lesões recentes. Você pode revogar depois.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {pro.price_consultation && (
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor da consulta</span>
                <span className="font-bold">R$ {Number(pro.price_consultation).toFixed(2)}</span>
              </div>
            </Card>
          )}

          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          <Button onClick={book} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Solicitar agendamento'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pagamento e confirmação da presença são combinados com o profissional pelo chat.
          </p>
        </>
      )}
    </main>
  );
}
