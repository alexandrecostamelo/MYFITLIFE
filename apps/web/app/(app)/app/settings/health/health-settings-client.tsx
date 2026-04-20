'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHealthSync } from '@/hooks/use-health-sync';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Heart,
  Footprints,
  Moon,
  Scale,
  Activity,
  Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  userId: string;
  enabled: boolean;
  source: string | null;
  lastSync: string | null;
  recentSamples: Record<string, unknown>[];
}

const METRIC_META: Record<string, { label: string; icon: LucideIcon }> = {
  steps: { label: 'Passos', icon: Footprints },
  heart_rate: { label: 'FC Média', icon: Heart },
  resting_heart_rate: { label: 'FC Repouso', icon: Heart },
  hrv: { label: 'VFC (HRV)', icon: Activity },
  active_calories: { label: 'Calorias Ativas', icon: Activity },
  sleep_duration: { label: 'Sono', icon: Moon },
  weight: { label: 'Peso', icon: Scale },
  body_fat_pct: { label: 'Gordura', icon: Scale },
};

export function HealthSettingsClient({
  userId,
  enabled,
  lastSync,
  recentSamples,
}: Props) {
  const router = useRouter();
  const {
    isNative,
    syncing,
    lastResult,
    checkAvailable,
    requestPermissions,
    sync,
  } = useHealthSync(userId);
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      const available = await checkAvailable();
      if (!available) {
        alert(
          'Saúde não disponível neste dispositivo. Instale o app nativo.'
        );
        return;
      }
      const granted = await requestPermissions();
      if (!granted) {
        alert(
          'Permissões negadas. Vá em Ajustes > Saúde > MyFitLife e ative.'
        );
        return;
      }
      await fetch('/api/profile/health-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      });
      await sync();
      router.refresh();
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await fetch('/api/profile/health-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    router.refresh();
  };

  // Group by metric, keep latest
  const grouped: Record<string, Record<string, unknown>> = {};
  for (const s of recentSamples) {
    const metric = String(s.metric);
    if (
      !grouped[metric] ||
      new Date(String(s.sampled_at)) >
        new Date(String(grouped[metric].sampled_at))
    ) {
      grouped[metric] = s;
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-5">
      <div>
        <h1 className="display-title">Saúde</h1>
        <p className="text-sm text-muted-foreground">
          Apple Health / Google Fit
        </p>
      </div>

      {!enabled ? (
        <section className="glass-card p-6 text-center space-y-4">
          <Smartphone className="h-12 w-12 mx-auto text-accent" />
          <div>
            <h2 className="text-lg font-semibold">Conectar dados de saúde</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sincronize passos, frequência cardíaca, sono e mais do seu
              dispositivo.
            </p>
          </div>
          {isNative ? (
            <Button
              onClick={connect}
              disabled={connecting}
              className="w-full"
              size="lg"
            >
              {connecting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Conectar
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Disponível apenas no app nativo (iOS/Android).
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Conectado</p>
                <p className="text-xs text-muted-foreground">
                  Último sync:{' '}
                  {lastSync
                    ? new Date(lastSync).toLocaleString('pt-BR')
                    : 'nunca'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={sync} disabled={syncing}>
                  {syncing && (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  )}
                  Sincronizar
                </Button>
                <Button size="sm" variant="outline" onClick={disconnect}>
                  Desconectar
                </Button>
              </div>
            </div>
            {lastResult && (
              <p className="text-xs text-muted-foreground">
                {lastResult.synced} amostras sincronizadas
                {lastResult.errors > 0 && `, ${lastResult.errors} erros`}
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="section-title">Dados mais recentes</h2>
            {Object.entries(grouped).map(([metric, sample]) => {
              const meta = METRIC_META[metric];
              if (!meta) return null;
              const Icon = meta.icon;
              const val = Number(sample.value);
              return (
                <div
                  key={metric}
                  className="glass-card p-3 flex items-center gap-3"
                >
                  <Icon className="h-4 w-4 text-accent" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(String(sample.sampled_at)).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-light">
                      {val.toLocaleString('pt-BR', {
                        maximumFractionDigits: 1,
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {String(sample.unit)}
                    </p>
                  </div>
                </div>
              );
            })}
            {Object.keys(grouped).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado ainda. Toque em Sincronizar.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
