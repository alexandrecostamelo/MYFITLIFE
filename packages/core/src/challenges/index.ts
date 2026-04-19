export type ChallengeType = 'daily_reps' | 'total_reps' | 'daily_streak' | 'accumulated_minutes' | 'photo_habit';

export type ProgressInfo = {
  percent: number;
  label: string;
  completed: boolean;
};

export function computeProgress(
  challenge: {
    challenge_type: ChallengeType;
    target_value: number;
    target_unit: string;
    duration_days: number;
  },
  participant: {
    current_progress: number;
    check_in_count: number;
    current_streak: number;
  },
): ProgressInfo {
  switch (challenge.challenge_type) {
    case 'daily_streak':
    case 'photo_habit': {
      const percent = Math.min(100, (participant.check_in_count / challenge.duration_days) * 100);
      return {
        percent,
        label: `${participant.check_in_count}/${challenge.duration_days} ${challenge.target_unit}`,
        completed: participant.check_in_count >= challenge.duration_days,
      };
    }
    case 'daily_reps': {
      const percent = Math.min(100, (participant.check_in_count / challenge.duration_days) * 100);
      return {
        percent,
        label: `${participant.check_in_count}/${challenge.duration_days} dias cumpridos`,
        completed: participant.check_in_count >= challenge.duration_days,
      };
    }
    case 'total_reps':
    case 'accumulated_minutes': {
      const percent = Math.min(100, (participant.current_progress / challenge.target_value) * 100);
      return {
        percent,
        label: `${participant.current_progress}/${challenge.target_value} ${challenge.target_unit}`,
        completed: participant.current_progress >= challenge.target_value,
      };
    }
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Força',
  cardio: 'Cardio',
  consistency: 'Consistência',
  nutrition: 'Nutrição',
  flexibility: 'Flexibilidade',
  mindset: 'Mente',
};

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    enrollment: 'Inscrições abertas',
    active: 'Em andamento',
    completed: 'Encerrado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

export function daysUntil(date: string): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}
