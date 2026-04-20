'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

interface Props {
  biomarkers: Record<string, unknown>[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: 'Cr\u00edtico',
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/40',
    icon: XCircle,
  },
  attention: {
    label: 'Aten\u00e7\u00e3o',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/40',
    icon: AlertTriangle,
  },
  normal: {
    label: 'Normal',
    color: 'text-accent',
    bg: '',
    border: 'border-accent/20',
    icon: CheckCircle2,
  },
  unknown: {
    label: 'Sem ref.',
    color: 'text-muted-foreground',
    bg: '',
    border: 'border-white/5',
    icon: HelpCircle,
  },
};

type FilterType = 'all' | 'critical' | 'attention' | 'normal';

export function BiomarkersClient({ biomarkers }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Deduplicate: keep only latest per marker_name
  const latest = useMemo(() => {
    const seen = new Map<string, Record<string, unknown>>();
    for (const b of biomarkers) {
      const name = String(b.marker_name);
      if (!seen.has(name)) seen.set(name, b);
    }
    return Array.from(seen.values()).sort((a, b) => {
      const order: Record<string, number> = {
        critical: 0,
        attention: 1,
        normal: 2,
        unknown: 3,
      };
      return (
        (order[String(a.classification)] ?? 3) -
        (order[String(b.classification)] ?? 3)
      );
    });
  }, [biomarkers]);

  const counts = useMemo(() => {
    const c = { critical: 0, attention: 0, normal: 0, unknown: 0 };
    for (const b of latest) {
      const cls = String(b.classification) as keyof typeof c;
      if (cls in c) c[cls]++;
    }
    return c;
  }, [latest]);

  const filtered =
    filter === 'all'
      ? latest
      : latest.filter((b) => String(b.classification) === filter);

  // Get history for a marker
  const getHistory = (markerName: string) =>
    biomarkers
      .filter((b) => String(b.marker_name) === markerName)
      .slice(0, 5);

  const alertCount = counts.critical + counts.attention;

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28 space-y-5">
      <h1 className="display-title">Biomarcadores</h1>

      {/* Alert banner */}
      {alertCount > 0 && (
        <div className="glass-card border border-amber-500/40 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                {alertCount} biomarcador{alertCount !== 1 ? 'es' : ''} fora
                da faixa
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consulte seu m\u00e9dico pra avalia\u00e7\u00e3o detalhada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary chips */}
      <div className="flex gap-2">
        {(
          [
            { key: 'all', label: `Todos (${latest.length})` },
            { key: 'critical', label: `Cr\u00edticos (${counts.critical})` },
            { key: 'attention', label: `Aten\u00e7\u00e3o (${counts.attention})` },
            { key: 'normal', label: `Normais (${counts.normal})` },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-accent text-black'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Biomarker cards */}
      <div className="space-y-2">
        {filtered.map((b) => {
          const id = String(b.id);
          const name = String(b.marker_name);
          const value = Number(b.value);
          const unit = String(b.unit || '');
          const cls = String(b.classification || 'unknown');
          const measuredAt = String(b.measured_at || '');
          const refMin = b.reference_min != null ? Number(b.reference_min) : null;
          const refMax = b.reference_max != null ? Number(b.reference_max) : null;
          const config = STATUS_CONFIG[cls] || STATUS_CONFIG.unknown;
          const Icon = config.icon;

          const history = getHistory(name);

          return (
            <div
              key={id}
              className={`glass-card p-3 border ${config.border} ${config.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
                    <p className="text-sm font-medium truncate">{name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>
                      {measuredAt
                        ? new Date(measuredAt).toLocaleDateString('pt-BR')
                        : ''}
                    </span>
                    {refMin != null && refMax != null && (
                      <span>
                        Ref: {refMin}-{refMax} {unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-light">
                    {value.toFixed(1)}{' '}
                    <span className="text-xs text-muted-foreground">
                      {unit}
                    </span>
                  </p>
                  <p className={`text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </p>
                </div>
              </div>

              {/* Mini history */}
              {history.length > 1 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {history.map((h, i) => {
                      const hVal = Number(h.value);
                      const hDate = String(h.measured_at || '');
                      const hCls = String(h.classification || 'unknown');
                      const hConfig =
                        STATUS_CONFIG[hCls] || STATUS_CONFIG.unknown;
                      return (
                        <div
                          key={i}
                          className="flex-shrink-0 text-center"
                        >
                          <p
                            className={`font-mono text-xs ${hConfig.color}`}
                          >
                            {hVal.toFixed(1)}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {hDate
                              ? new Date(hDate).toLocaleDateString(
                                  'pt-BR',
                                  { month: 'short', year: '2-digit' },
                                )
                              : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {latest.length === 0 && (
        <section className="glass-card p-6 text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Importe um exame em PDF pra ver seus biomarcadores aqui.
          </p>
        </section>
      )}
    </main>
  );
}
