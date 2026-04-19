'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  requested: { label: 'Aguardando', color: 'bg-amber-100 text-amber-800', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600', icon: XCircle },
  completed: { label: 'Concluído', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  no_show: { label: 'Ausência', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function AppointmentsPage() {
  const [role, setRole] = useState<'client' | 'professional'>('client');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfessional, setIsProfessional] = useState(false);

  async function load() {
    setLoading(true);
    const [appRes, proRes] = await Promise.all([
      fetch(`/api/appointments?role=${role}`).then((r) => r.json()),
      fetch('/api/professionals/mine').then((r) => r.json()),
    ]);
    setAppointments(appRes.appointments || []);
    setIsProfessional(!!proRes.professional);
    setLoading(false);
  }

  useEffect(() => { load(); }, [role]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Agendamentos</h1>
      </header>

      {isProfessional && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button onClick={() => setRole('client')} className={`rounded-md border px-3 py-1.5 text-xs ${role === 'client' ? 'border-primary bg-primary/10' : 'border-input'}`}>
            Como cliente
          </button>
          <button onClick={() => setRole('professional')} className={`rounded-md border px-3 py-1.5 text-xs ${role === 'professional' ? 'border-primary bg-primary/10' : 'border-input'}`}>
            Como profissional
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : appointments.length === 0 ? (
        <Card className="p-6 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {role === 'client' ? 'Você ainda não agendou consultas.' : 'Nenhum agendamento com você ainda.'}
          </p>
          {role === 'client' && (
            <Button asChild variant="outline" className="mt-3">
              <Link href="/app/professionals">Buscar profissional</Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => {
            const status = STATUS_MAP[a.status] || STATUS_MAP.requested;
            const Icon = status.icon;
            const other = role === 'client' ? a.professional : a.client;
            return (
              <Link key={a.id} href={`/app/appointments/${a.id}`}>
                <Card className="p-3 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{other?.full_name || 'Usuário'}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs ${status.color}`}>
                          <Icon className="mr-0.5 inline h-3 w-3" /> {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{a.duration_min} min
                        {a.modality && ` · ${a.modality}`}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
