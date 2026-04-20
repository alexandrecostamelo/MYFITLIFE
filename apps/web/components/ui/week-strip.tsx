const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props {
  completed: boolean[];
  today?: number;
}

export function WeekStrip({ completed, today }: Props) {
  const todayIdx = today ?? new Date().getDay();
  const reordered = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="flex items-center justify-between gap-1">
      {reordered.map((dayIdx, i) => {
        const done = completed[dayIdx];
        const isToday = dayIdx === todayIdx;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={`text-[10px] font-medium ${isToday ? 'text-accent' : 'text-muted-foreground'}`}
            >
              {DAYS[dayIdx]}
            </span>
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done
                  ? 'bg-accent text-accent-foreground'
                  : isToday
                    ? 'border-2 border-accent text-accent'
                    : 'bg-white/5 text-muted-foreground'
              }`}
            >
              {done ? '\u2713' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}
