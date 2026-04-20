'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  projection?: DataPoint[];
  targetValue?: number;
  targetDate?: string;
  unit?: string;
  height?: number;
}

export function ProgressChart({
  data,
  projection = [],
  targetValue,
  targetDate,
  unit = 'kg',
  height = 200,
}: Props) {
  const all = [...data, ...projection];
  if (all.length === 0) return null;

  const values = all.map((d) => d.value);
  const minVal = Math.min(...values, targetValue ?? Infinity) - 2;
  const maxVal = Math.max(...values, targetValue ?? -Infinity) + 2;
  const range = maxVal - minVal || 1;

  const w = 100;
  const h = 100;
  const pad = 5;

  const toX = (i: number) => pad + (i / (all.length - 1 || 1)) * (w - 2 * pad);
  const toY = (v: number) => h - pad - ((v - minVal) / range) * (h - 2 * pad);

  const realPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.value).toFixed(1)}`)
    .join(' ');

  const projStart = data.length - 1;
  const projPath =
    projection.length > 0
      ? [data[data.length - 1], ...projection]
          .map(
            (d, i) =>
              `${i === 0 ? 'M' : 'L'} ${toX(projStart + i).toFixed(1)} ${toY(d.value).toFixed(1)}`,
          )
          .join(' ')
      : '';

  const targetY = targetValue != null ? toY(targetValue) : null;

  return (
    <div className="glass-card p-4">
      {targetValue != null && targetDate && (
        <p className="text-xs text-muted-foreground mb-2">
          Meta: <span className="text-accent font-semibold">{targetValue}{unit}</span> até{' '}
          <span className="font-medium">
            {new Date(targetDate).toLocaleDateString('pt-BR')}
          </span>
        </p>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ height }}
        className="w-full"
        preserveAspectRatio="none"
      >
        {targetY !== null && (
          <line
            x1={pad}
            y1={targetY}
            x2={w - pad}
            y2={targetY}
            stroke="hsl(160,100%,43%)"
            strokeWidth="0.3"
            strokeDasharray="2 2"
          />
        )}
        {realPath && (
          <path
            d={realPath}
            fill="none"
            stroke="hsl(0,0%,98%)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {projPath && (
          <path
            d={projPath}
            fill="none"
            stroke="hsl(160,100%,43%)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            strokeLinecap="round"
          />
        )}
        {data.length > 0 && (
          <circle
            cx={toX(data.length - 1)}
            cy={toY(data[data.length - 1].value)}
            r="2.5"
            fill="hsl(0,0%,98%)"
          />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>
          {data[0]?.date
            ? new Date(data[0].date).toLocaleDateString('pt-BR', { month: 'short' })
            : ''}
        </span>
        <span>
          {all[all.length - 1]?.date
            ? new Date(all[all.length - 1].date).toLocaleDateString('pt-BR', { month: 'short' })
            : ''}
        </span>
      </div>
    </div>
  );
}
