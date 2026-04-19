'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, Clock, Loader2, MessageCircle, Video, X, Check, ExternalLink, Shield, Circle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  no_show: 'Não compareceu',
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [userId, setUserId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');

  async function loadUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function load() {
    const res = await fetch(`/api/appointments/${id}`);
    const d = await res.json();
    setData(d);
    if (d.appointment?.meeting_url) setMeetingUrl(d.appointment.meeting_url);
    if (d.appointment?.professional_notes) setNotes(d.appointment.professional_notes);
    setLoading(false);
  }

  useEffect(() => { loadUser(); load(); }, [id]);

  async function act(action: string, extra: any = {}) {
    setActing(true);
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    await load();
    setActing(false);
  }

  async function startThread() {
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id: data.appointment.professional_id }),
    });
    const thread = await res.json();
    window.location.href = `/app/threads/${thread.id}`;
  }

  if (loading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.appointment) return <div className="p-6">Agendamento não encontrado</div>;

  const appt = data.appointment;
  const isProfessional = data.professional?.user_id === userId;
  const isClient = appt.client_id === userId;

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-4 flex items-center gap-2">
        <Link href="/app/appointments" className="rounded p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Agendamento</h1>
      </header>

      <Card className="mb-4 p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
            {isClient && data.professional?.avatar_url ? (
              <img src={data.professional.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : isProfessional && data.client?.avatar_url ? (
              <img src={data.client.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg text-slate-500">
                {(isClient ? data.professional?.full_name : data.client?.full_name)?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">
              {isClient ? data.professional?.full_name : data.client?.full_name || 'Cliente'}
            </div>
            <div className="text-xs text-muted-foreground">{STATUS_LABELS[appt.status] || appt.status}</div>
          </div>
        </div>
      </Card>

      <Card className="mb-4 space-y-2 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(appt.scheduled_at).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {appt.duration_min} minutos {appt.modality && `· ${appt.modality}`}
        </div>
        {appt.price && (
          <div className="text-sm">Valor: <strong>R$ {Number(appt.price).toFixed(2)}</strong></div>
        )}
      </Card>

      {appt.client_notes && (
        <Card className="mb-4 p-4">
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">Observação do cliente</h3>
          <p className="text-sm">{appt.client_notes}</p>
        </Card>
      )}

      {appt.meeting_url && appt.status === 'confirmed' && !appt.video_room_url && (
        <Card className="mb-4 p-4">
          <h3 className="mb-2 text-sm font-medium">Link da sessão</h3>
          <a href={appt.meeting_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Video className="h-4 w-4" /> {appt.meeting_url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      )}

      {appt.status === 'confirmed' && (
        <VideoBlock
          appointment={appt}
          isProfessional={isProfessional}
          isClient={isClient}
          onUpdate={load}
        />
      )}

      {isProfessional && appt.status === 'confirmed' && appt.share_history && (
        <Card className="mb-4 border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-medium text-blue-900">Histórico compartilhado</h3>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/professionals/mine/clients/${appt.client_id}`}>Ver resumo do cliente</Link>
          </Button>
        </Card>
      )}

      {isProfessional && appt.status === 'requested' && (
        <Card className="mb-4 p-4">
          <h3 className="mb-3 text-sm font-medium">Confirmar agendamento</h3>
          <Input
            placeholder="Link da videoconferência (opcional)"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={() => act('confirm', { meeting_url: meetingUrl || undefined })} disabled={acting} className="flex-1">
              {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1 h-4 w-4" /> Confirmar</>}
            </Button>
            <Button variant="outline" onClick={() => act('cancel')} disabled={acting}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {isProfessional && appt.status === 'confirmed' && (
        <Card className="mb-4 p-4">
          <h3 className="mb-3 text-sm font-medium">Anotações da sessão (privadas)</h3>
          <textarea
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
            rows={4}
            placeholder="Notas sobre o atendimento..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-2 grid grid-cols-3 gap-1">
            <Button size="sm" variant="outline" onClick={() => act('update_notes', { professional_notes: notes })} disabled={acting}>Salvar notas</Button>
            <Button size="sm" onClick={() => act('complete')} disabled={acting}>Concluir</Button>
            <Button size="sm" variant="outline" onClick={() => act('no_show')} disabled={acting}>Faltou</Button>
          </div>
        </Card>
      )}

      {(appt.status !== 'cancelled' && appt.status !== 'completed' && appt.status !== 'no_show') && (
        <Card className="mb-4 p-4">
          <Button variant="outline" onClick={startThread} className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" /> Abrir conversa
          </Button>
        </Card>
      )}

      {(isClient || isProfessional) && (appt.status === 'requested' || appt.status === 'confirmed') && (
        <Button variant="outline" onClick={() => act('cancel')} disabled={acting} className="w-full">
          Cancelar agendamento
        </Button>
      )}
    </main>
  );
}

function VideoBlock({
  appointment,
  isProfessional,
  isClient,
  onUpdate,
}: {
  appointment: any;
  isProfessional: boolean;
  isClient: boolean;
  onUpdate: () => void;
}) {
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(appointment.recording_enabled ?? false);
  const [clientConsent, setClientConsent] = useState<boolean | null>(appointment.client_recording_consent ?? null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const scheduled = new Date(appointment.scheduled_at);
  const diffMin = (scheduled.getTime() - now.getTime()) / 60000;
  const canJoin = diffMin <= 15 && diffMin >= -60;
  const tooEarly = diffMin > 15;

  async function updateRecording(body: object) {
    setSaving(true);
    await fetch(`/api/appointments/${appointment.id}/recording-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <Card className="mb-4 space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Videoconferência</h3>
      </div>

      {canJoin ? (
        <Button asChild size="lg" className="w-full">
          <Link href={`/app/appointments/${appointment.id}/video`}>
            <Video className="mr-2 h-4 w-4" /> Entrar na sala
          </Link>
        </Button>
      ) : tooEarly ? (
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>
            Sala abre 15 min antes —{' '}
            {scheduled.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Consulta encerrada</span>
        </div>
      )}

      {isProfessional && (
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={recordingEnabled}
            disabled={saving}
            onChange={(e) => {
              setRecordingEnabled(e.target.checked);
              updateRecording({ recording_enabled: e.target.checked });
            }}
            className="h-4 w-4"
          />
          <span>
            Gravar sessão{' '}
            <span className="text-muted-foreground">(requer consentimento do cliente)</span>
          </span>
        </label>
      )}

      {isClient && recordingEnabled && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="mb-2 text-xs text-amber-900 dark:text-amber-200">
            <Circle className="mr-1 inline h-2 w-2 fill-red-500 text-red-500" />
            O profissional deseja gravar esta sessão.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={clientConsent === true ? 'default' : 'outline'}
              disabled={saving}
              onClick={() => { setClientConsent(true); updateRecording({ client_recording_consent: true }); }}
            >
              Permitir
            </Button>
            <Button
              size="sm"
              variant={clientConsent === false ? 'destructive' : 'outline'}
              disabled={saving}
              onClick={() => { setClientConsent(false); updateRecording({ client_recording_consent: false }); }}
            >
              Não permitir
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
