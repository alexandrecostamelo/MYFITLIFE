interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
}

export function MetricHero({ label, value, delta, deltaType = 'neutral' }: Props) {
  const deltaColor =
    deltaType === 'positive'
      ? 'text-emerald-400'
      : deltaType === 'negative'
        ? 'text-red-400'
        : 'text-muted-foreground';

  return (
    <div className="text-center">
      <p className="metric-number">{value}</p>
      <p className="metric-label mt-1">{label}</p>
      {delta && <p className={`text-xs mt-0.5 ${deltaColor}`}>{delta}</p>}
    </div>
  );
}
