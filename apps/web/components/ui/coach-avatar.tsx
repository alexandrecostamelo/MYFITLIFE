interface Props {
  persona: 'leo' | 'sofia' | 'rafa';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const PERSONAS: Record<string, { name: string; emoji: string; gradient: string }> = {
  leo: { name: 'Leo', emoji: '\uD83E\uDD81', gradient: 'from-amber-500 to-orange-600' },
  sofia: { name: 'Sofia', emoji: '\uD83E\uDDEC', gradient: 'from-violet-500 to-purple-600' },
  rafa: { name: 'Rafa', emoji: '\uD83D\uDE0E', gradient: 'from-cyan-500 to-blue-600' },
};

const SIZES = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-12 w-12 text-2xl',
  lg: 'h-16 w-16 text-3xl',
};

export function CoachAvatar({ persona, size = 'md', showName = false }: Props) {
  const p = PERSONAS[persona] || PERSONAS.leo;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${SIZES[size]} rounded-full bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg`}
      >
        {p.emoji}
      </div>
      {showName && <span className="text-sm font-semibold">{p.name}</span>}
    </div>
  );
}
