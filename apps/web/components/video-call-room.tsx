'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Video, AlertCircle, ArrowLeft } from 'lucide-react';

type Props = {
  appointmentId: string;
};

type State = 'idle' | 'loading' | 'joined' | 'error' | 'too_early' | 'expired';

export function VideoCallRoom({ appointmentId }: Props) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const [openInMin, setOpenInMin] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [callInstance, setCallInstance] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function join() {
    setState('loading');
    setError(null);

    const res = await fetch(`/api/appointments/${appointmentId}/video-room`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      if (data.error === 'too_early') {
        setOpenInMin(data.opens_in_minutes ?? null);
        setState('too_early');
        return;
      }
      if (data.error === 'expired') {
        setState('expired');
        return;
      }
      setError(data.message || data.error || 'Erro desconhecido');
      setState('error');
      return;
    }

    try {
      // Dynamic import to avoid SSR issues
      const DailyIframe = (await import('@daily-co/daily-js')).default;

      if (!containerRef.current) return;

      const call = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '0',
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('left-meeting', () => {
        setState('idle');
        call.destroy().catch(() => {});
        setCallInstance(null);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('error', (e: any) => {
        console.error('[daily error]', e);
        setError(e?.errorMsg || 'Erro na chamada');
      });

      await call.join({ url: data.room_url, token: data.token });

      setCallInstance(call);
      setState('joined');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao entrar na sala';
      setError(msg);
      setState('error');
    }
  }

  useEffect(() => {
    return () => {
      if (callInstance) callInstance.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callInstance]);

  if (state === 'joined') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <Link
        href={`/app/appointments/${appointmentId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao agendamento
      </Link>

      <Card className="p-6 text-center">
        <Video className="mx-auto mb-3 h-12 w-12 text-primary" />
        <h1 className="mb-2 text-xl font-bold">Videoconferência</h1>

        {state === 'idle' && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Pronto para entrar na sua consulta?
            </p>
            <Button onClick={join} size="lg" className="w-full">
              <Video className="mr-2 h-4 w-4" /> Entrar na chamada
            </Button>
          </>
        )}

        {state === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground">Preparando sala...</p>
          </>
        )}

        {state === 'too_early' && (
          <>
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
            <p className="mb-1 text-sm font-medium">Ainda é cedo</p>
            <p className="mb-4 text-sm text-muted-foreground">
              {openInMin !== null
                ? `A sala abre em ${openInMin} minutos.`
                : 'A sala abre 15 minutos antes do horário.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Atualizar
            </Button>
          </>
        )}

        {state === 'expired' && (
          <>
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="mb-1 text-sm font-medium">Sala expirada</p>
            <p className="text-sm text-muted-foreground">
              Esta consulta já encerrou. Se precisar, reagende com o profissional.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
            <p className="mb-1 text-sm font-medium">Erro</p>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button onClick={join}>Tentar novamente</Button>
          </>
        )}
      </Card>

      <Card className="mt-4 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Dicas para uma boa chamada:</p>
        <ul className="space-y-0.5">
          <li>• Teste câmera e microfone antes de entrar</li>
          <li>• Use fone de ouvido para evitar eco</li>
          <li>• Prefira Wi-Fi ou conexão estável</li>
          <li>• Boa iluminação melhora a qualidade de vídeo</li>
        </ul>
      </Card>
    </main>
  );
}
