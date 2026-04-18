'use client';

import { MUSCLE_LABELS, type MuscleRegion } from '@myfitlife/core/workout/muscles';

type SorenessEntry = { region: MuscleRegion; intensity: number };

type Props = {
  value: SorenessEntry[];
  onChange: (next: SorenessEntry[]) => void;
  readOnly?: boolean;
  heatmap?: Record<string, number>;
};

const INTENSITY_COLORS = ['transparent', '#fef3c7', '#fde68a', '#fb923c', '#f97316', '#dc2626'];
const HEATMAP_COLORS = ['#e5e7eb', '#dbeafe', '#93c5fd', '#60a5fa', '#2563eb', '#1e40af'];

function colorFor(intensity: number, isHeatmap: boolean): string {
  const idx = Math.max(0, Math.min(5, Math.round(intensity)));
  return isHeatmap ? HEATMAP_COLORS[idx] : INTENSITY_COLORS[idx];
}

export function BodyMap({ value, onChange, readOnly = false, heatmap }: Props) {
  const isHeatmap = !!heatmap;

  function intensityOf(region: MuscleRegion): number {
    if (isHeatmap) return heatmap![region] || 0;
    const found = value.find((v) => v.region === region);
    return found?.intensity || 0;
  }

  function cycleRegion(region: MuscleRegion) {
    if (readOnly) return;
    const current = value.find((v) => v.region === region);
    const currentIntensity = current?.intensity || 0;
    const nextIntensity = (currentIntensity + 1) % 6;

    if (nextIntensity === 0) {
      onChange(value.filter((v) => v.region !== region));
    } else if (current) {
      onChange(value.map((v) => v.region === region ? { ...v, intensity: nextIntensity } : v));
    } else {
      onChange([...value, { region, intensity: nextIntensity }]);
    }
  }

  const cursor = readOnly ? '' : 'cursor-pointer';

  function Region({ region, d, ...props }: { region: MuscleRegion; d?: string } & React.SVGProps<SVGElement>) {
    const fill = colorFor(intensityOf(region), isHeatmap);
    const common = { fill, stroke: '#94a3b8', strokeWidth: 0.8, onClick: () => cycleRegion(region), className: cursor };
    if (d) return <path d={d} {...common}><title>{MUSCLE_LABELS[region]}</title></path>;
    return <rect {...(props as any)} {...common}><title>{MUSCLE_LABELS[region]}</title></rect>;
  }

  return (
    <div>
      <div className="flex items-start justify-center gap-6">
        <div className="flex-1">
          <p className="mb-2 text-center text-xs text-muted-foreground">Frente</p>
          <svg viewBox="0 0 140 280" className="mx-auto w-full max-w-[160px]">
            <Region region="pescoco" d="M60 10 a10 10 0 1 1 20 0 a10 10 0 1 1 -20 0" />
            <Region region="trapezio" x={62} y={22} width={16} height={10} />
            <Region region="deltoide_anterior" d="M44 34 Q42 46 46 54 L58 50 L58 34 Z" />
            <Region region="deltoide_anterior" d="M96 34 Q98 46 94 54 L82 50 L82 34 Z" />
            <Region region="peitoral_superior" x={58} y={34} width={24} height={14} />
            <Region region="peitoral_inferior" x={58} y={48} width={24} height={12} />
            <Region region="biceps" d="M42 56 Q38 74 42 88 L50 88 L50 58 Z" />
            <Region region="biceps" d="M98 56 Q102 74 98 88 L90 88 L90 58 Z" />
            <Region region="antebraco" d="M42 88 L50 88 L48 112 L40 112 Z" />
            <Region region="antebraco" d="M90 88 L98 88 L100 112 L92 112 Z" />
            <Region region="abdomen_superior" x={58} y={62} width={24} height={18} />
            <Region region="abdomen_inferior" x={58} y={80} width={24} height={14} />
            <Region region="obliquos" d="M52 64 L58 62 L58 94 L52 92 Z" />
            <Region region="obliquos" d="M88 62 L82 62 L82 94 L88 92 Z" />
            <Region region="quadriceps" x={54} y={96} width={14} height={60} />
            <Region region="quadriceps" x={72} y={96} width={14} height={60} />
            <Region region="tibial_anterior" x={56} y={158} width={10} height={40} />
            <Region region="tibial_anterior" x={74} y={158} width={10} height={40} />
          </svg>
        </div>

        <div className="flex-1">
          <p className="mb-2 text-center text-xs text-muted-foreground">Costas</p>
          <svg viewBox="0 0 140 280" className="mx-auto w-full max-w-[160px]">
            <circle cx="70" cy="10" r="10" fill="#e5e7eb" stroke="#94a3b8" strokeWidth={0.8} />
            <Region region="trapezio" x={52} y={22} width={36} height={14} />
            <Region region="deltoide_posterior" d="M44 34 Q42 46 46 54 L56 50 L56 34 Z" />
            <Region region="deltoide_posterior" d="M96 34 Q98 46 94 54 L84 50 L84 34 Z" />
            <Region region="romboides" x={60} y={36} width={20} height={10} />
            <Region region="latissimo" d="M56 46 L58 74 L66 74 L66 46 Z" />
            <Region region="latissimo" d="M84 46 L82 74 L74 74 L74 46 Z" />
            <Region region="triceps" d="M42 56 Q38 74 42 88 L50 88 L50 58 Z" />
            <Region region="triceps" d="M98 56 Q102 74 98 88 L90 88 L90 58 Z" />
            <Region region="lombar" x={56} y={74} width={28} height={20} />
            <Region region="gluteos" d="M52 94 Q50 110 54 118 L72 118 L72 94 Z" />
            <Region region="gluteos" d="M88 94 Q90 110 86 118 L68 118 L68 94 Z" />
            <Region region="isquiotibiais" x={54} y={118} width={14} height={42} />
            <Region region="isquiotibiais" x={72} y={118} width={14} height={42} />
            <Region region="panturrilha" x={56} y={162} width={10} height={40} />
            <Region region="panturrilha" x={74} y={162} width={10} height={40} />
          </svg>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">Toque para marcar dor:</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border" style={{ backgroundColor: INTENSITY_COLORS[i] }} />
              <span className="text-muted-foreground">{i}</span>
            </div>
          ))}
        </div>
      )}

      {isHeatmap && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">Menos</span>
          {HEATMAP_COLORS.slice(1).map((color, i) => (
            <div key={i} className="h-3 w-6 rounded border" style={{ backgroundColor: color }} />
          ))}
          <span className="text-muted-foreground">Mais</span>
        </div>
      )}
    </div>
  );
}
