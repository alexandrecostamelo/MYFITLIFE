'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface CheckResult {
  ok: boolean;
  latency_ms: number;
  error?: string;
}

interface HealthData {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: {
    env_vars: CheckResult;
    supabase_db: CheckResult;
    supabase_storage: CheckResult;
    anthropic_api: CheckResult;
  };
}

const CHECK_LABELS: Record<string, string> = {
  env_vars: 'Variáveis de Ambiente',
  supabase_db: 'Banco de Dados',
  supabase_storage: 'Storage',
  anthropic_api: 'Claude API',
};

function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle className="h-5 w-5 text-green-500" />
    : <XCircle className="h-5 w-5 text-red-500" />;
}

export default function AdminMonitoringPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = process.env.NEXT_PUBLIC_HEALTH_CHECK_TOKEN || '';
      const res = await fetch(`/api/health/deep?token=${token}`);
      if (res.status === 401) {
        setError('Token de health check não configurado (NEXT_PUBLIC_HEALTH_CHECK_TOKEN)');
        return;
      }
      setData(await res.json());
    } catch {
      setError('Falha ao buscar status de saúde');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center gap-2">
        <Link href="/app/gym-admin" className="rounded p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Monitoramento</h1>
        <Button variant="outline" size="sm" className="ml-auto" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      {error && (
        <Card className="mb-4 flex items-center gap-2 border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      )}

      {loading && !data && (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {data && (
        <>
          <Card className={`mb-6 p-4 ${data.status === 'ok' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon ok={data.status === 'ok'} />
                <span className="font-semibold text-lg">
                  {data.status === 'ok' ? 'Sistema Operacional' : 'Sistema Degradado'}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                {new Date(data.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>
          </Card>

          <div className="space-y-3">
            {Object.entries(data.checks).map(([key, check]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon ok={check.ok} />
                    <div>
                      <p className="font-medium">{CHECK_LABELS[key] ?? key}</p>
                      {check.error && (
                        <p className="text-xs text-red-600 mt-0.5">{check.error}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">{check.latency_ms} ms</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold text-slate-700">Jobs de Background</h2>
            <div className="space-y-2 text-sm text-slate-500">
              {[
                { label: 'Autopilot diário', cron: 'daily-autopilot', freq: 'Todo dia às 03:00' },
                { label: 'Notificações proativas', cron: 'proactive-check', freq: 'A cada 6 horas' },
                { label: 'Resumo semanal', cron: 'weekly-summary', freq: 'Toda segunda às 08:00' },
                { label: 'Limpeza diária', cron: 'cleanup', freq: 'Todo dia às 02:00' },
              ].map((job) => (
                <Card key={job.cron} className="flex items-center justify-between p-3">
                  <span className="font-medium text-slate-700">{job.label}</span>
                  <span>{job.freq}</span>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Heartbeats enviados para Better Stack a cada execução. Configure os monitores em
              betterstack.com e adicione as URLs em HEARTBEAT_*_URL nas variáveis de ambiente.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
