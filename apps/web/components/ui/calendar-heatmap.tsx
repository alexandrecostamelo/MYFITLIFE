interface Props {
  data: Record<string, number>;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function CalendarHeatmap({ data, month, year }: Props) {
  const firstDayRaw = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = Array(firstDayRaw === 0 ? 6 : firstDayRaw - 1).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        {MONTH_NAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <span key={i} className="text-[9px] text-center text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const intensity = data[key] || 0;
          const isToday =
            today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const bg =
            intensity >= 3
              ? 'bg-accent'
              : intensity === 2
                ? 'bg-accent/60'
                : intensity === 1
                  ? 'bg-accent/30'
                  : 'bg-white/5';
          return (
            <div
              key={i}
              className={`aspect-square rounded-sm flex items-center justify-center text-[10px] ${bg} ${isToday ? 'ring-1 ring-accent' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
