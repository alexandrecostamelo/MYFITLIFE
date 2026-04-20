interface HeatmapEntry {
  workouts: number;
  meals: number;
  checkins: number;
}

interface Props {
  data: Record<string, number | HeatmapEntry>;
  month: number;
  year: number;
}

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function isMultiSource(
  v: number | HeatmapEntry,
): v is HeatmapEntry {
  return typeof v === 'object' && v !== null && 'workouts' in v;
}

export function CalendarHeatmap({ data, month, year }: Props) {
  const firstDayRaw = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = Array(
    firstDayRaw === 0 ? 6 : firstDayRaw - 1,
  ).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Check if any entry is multi-source
  const hasMulti = Object.values(data).some(isMultiSource);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {MONTH_NAMES[month]} {year}
        </p>
        {hasMulti && (
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-sm bg-accent" /> treino
            </span>
            <span className="flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-sm bg-amber-400" /> refei\u00e7\u00e3o
            </span>
            <span className="flex items-center gap-0.5">
              <span className="h-2 w-2 rounded-sm bg-violet-400" /> check-in
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <span
            key={i}
            className="text-[9px] text-center text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = data[key];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

          let bg = 'bg-white/5';

          if (entry) {
            if (isMultiSource(entry)) {
              const total =
                entry.workouts + entry.meals + entry.checkins;
              if (total >= 3) bg = 'bg-accent';
              else if (entry.workouts > 0 && entry.meals > 0)
                bg = 'bg-accent/60';
              else if (entry.workouts > 0) bg = 'bg-accent/40';
              else if (entry.meals > 0) bg = 'bg-amber-400/40';
              else if (entry.checkins > 0) bg = 'bg-violet-400/30';
            } else {
              const intensity = entry;
              if (intensity >= 3) bg = 'bg-accent';
              else if (intensity === 2) bg = 'bg-accent/60';
              else if (intensity === 1) bg = 'bg-accent/30';
            }
          }

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
