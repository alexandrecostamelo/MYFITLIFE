'use client';

import { useTts } from '@/lib/tts/use-tts';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export function TtsSettings() {
  const { muted, toggleMute, supported, voice, speak } = useTts();

  if (!supported) {
    return (
      <div className="mb-4 rounded-lg border p-4 text-sm text-muted-foreground">
        Seu navegador não suporta áudio sintetizado. Use Chrome, Edge ou Safari recentes.
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Feedback de voz durante treino</p>
          <p className="text-xs text-muted-foreground">Dicas de forma e contagem de reps faladas</p>
        </div>
        <Button size="icon" variant={muted ? 'outline' : 'secondary'} onClick={toggleMute}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      {!muted && (
        <Button
          size="sm"
          variant="ghost"
          className="text-xs"
          onClick={() => speak('Teste de áudio. Bora treinar!', { key: 'test', throttleMs: 1000 })}
        >
          Testar voz
        </Button>
      )}
      {voice && (
        <p className="text-xs text-muted-foreground">
          Voz: {voice.name} ({voice.lang})
        </p>
      )}
    </div>
  );
}
