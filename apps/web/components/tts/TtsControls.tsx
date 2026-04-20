'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  muted: boolean;
  onToggle: () => void;
  supported: boolean;
  onTest?: () => void;
  className?: string;
}

export function TtsControls({ muted, onToggle, supported, onTest, className = '' }: Props) {
  if (!supported) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`} title="TTS não suportado neste navegador">
        Áudio indisponível
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        size="icon"
        variant={muted ? 'outline' : 'secondary'}
        onClick={onToggle}
        aria-label={muted ? 'Ativar áudio' : 'Silenciar áudio'}
        title={muted ? 'Ativar áudio' : 'Silenciar áudio'}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      {onTest && !muted && (
        <Button size="sm" variant="ghost" onClick={onTest} className="h-9 text-xs">
          Testar
        </Button>
      )}
    </div>
  );
}
