interface MuscleGroup {
  id: string;
  name: string;
  exerciseCount: number;
}

interface Props {
  groups: MuscleGroup[];
  onSelect: (id: string) => void;
  selected?: string;
}

const ICONS: Record<string, string> = {
  chest: '\uD83E\uDEC1',
  back: '\uD83D\uDD19',
  legs: '\uD83E\uDDB5',
  shoulders: '\uD83D\uDCAA',
  biceps: '\uD83D\uDCAA',
  triceps: '\uD83D\uDCAA',
  core: '\uD83C\uDFAF',
  cardio: '\u2764\uFE0F',
  glutes: '\uD83C\uDF51',
  calves: '\uD83E\uDDB6',
  forearms: '\u270A',
  fullbody: '\uD83C\uDFCB\uFE0F',
};

export function MuscleGroupGrid({ groups, onSelect, selected }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors ${
            selected === g.id
              ? 'bg-accent/20 border border-accent/40'
              : 'bg-white/5 border border-transparent hover:bg-white/10'
          }`}
        >
          <span className="text-2xl">{ICONS[g.id] || '\uD83D\uDCAA'}</span>
          <span className="text-[10px] font-medium text-center leading-tight">{g.name}</span>
          <span className="text-[9px] text-muted-foreground">{g.exerciseCount}</span>
        </button>
      ))}
    </div>
  );
}
