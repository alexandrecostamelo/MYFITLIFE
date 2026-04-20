import { Dumbbell } from 'lucide-react';

interface Props {
  name: string;
  sets?: number;
  reps?: number;
  thumbnail_url?: string;
}

export function NextExercisePreview({ name, sets, reps, thumbnail_url }: Props) {
  return (
    <div className="glass-card p-3 flex items-center gap-3 w-full max-w-sm mx-auto">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
        Próximo
      </div>
      {thumbnail_url ? (
        <img
          src={thumbnail_url}
          alt=""
          className="h-10 w-10 rounded-lg object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {sets != null && reps != null && (
          <p className="text-[10px] text-muted-foreground">
            {sets} \u00D7 {reps}
          </p>
        )}
      </div>
    </div>
  );
}
