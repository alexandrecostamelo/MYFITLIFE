export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutSplit =
  | 'full_body'
  | 'upper_lower'
  | 'push_pull_legs'
  | 'abc'
  | 'abcd'
  | 'abcde';

export function suggestSplit(params: {
  daysPerWeek: number;
  level: ExperienceLevel;
}): WorkoutSplit {
  const { daysPerWeek, level } = params;

  if (daysPerWeek <= 2) return 'full_body';
  if (daysPerWeek === 3) return level === 'beginner' ? 'full_body' : 'push_pull_legs';
  if (daysPerWeek === 4) return 'upper_lower';
  if (daysPerWeek === 5) return level === 'advanced' ? 'push_pull_legs' : 'abcde';
  return 'push_pull_legs';
}

export function repsRangeForGoal(goal: string): string {
  switch (goal) {
    case 'gain_muscle':
      return '8-12';
    case 'lose_fat':
      return '10-15';
    case 'performance':
      return '3-6';
    default:
      return '8-12';
  }
}

export function restSecForGoal(goal: string): number {
  switch (goal) {
    case 'gain_muscle':
      return 90;
    case 'lose_fat':
      return 60;
    case 'performance':
      return 180;
    default:
      return 75;
  }
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}
