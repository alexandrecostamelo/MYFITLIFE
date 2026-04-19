export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  strength: 'Força',
  calisthenics: 'Calistenia',
  cardio: 'Cardio',
  mobility: 'Mobilidade',
};

export const SKILL_CATEGORY_EMOJI: Record<string, string> = {
  strength: '🏋',
  calisthenics: '💪',
  cardio: '🏃',
  mobility: '🧘',
};

export const SKILL_STATUS_LABELS: Record<string, string> = {
  locked: 'Bloqueado',
  available: 'Disponível',
  in_progress: 'Em progresso',
  mastered: 'Dominado',
};

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    locked: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    available: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-200',
    in_progress: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
    mastered: 'bg-green-50 text-green-900 border-green-300 dark:bg-green-950 dark:text-green-200',
  };
  return colors[status] ?? colors.locked;
}

export function masteryProgressPct(criteria: any, progress: any): number {
  if (!criteria || Object.keys(criteria).length === 0) return 0;
  const firstKey = Object.keys(criteria)[0];
  const target = Number(criteria[firstKey]);
  const current = Number(progress?.[firstKey] ?? 0);
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

export function masteryLabel(criteria: any): string {
  const descriptions: Record<string, (val: number) => string> = {
    reps_in_a_set: (v) => `${v} reps em uma série`,
    seconds_held: (v) => (v >= 60 ? `${Math.floor(v / 60)}m` : `${v}s`) + ' sustentado',
    weight_pct_bodyweight: (v) => `${v}% do peso corporal`,
    distance_meters: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}km` : `${v}m`),
    sessions_practiced: (v) => `${v} sessões praticando`,
    days_count: (v) => `${v} dias atingidos`,
    pace_sub: () => 'pace abaixo do alvo',
  };

  if (!criteria) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(criteria)) {
    const fn = descriptions[k];
    if (fn) parts.push(fn(v as number));
  }
  return parts.join(' · ');
}

export function unlockLabel(criteria: any): string {
  if (!criteria || Object.keys(criteria).length === 0) return 'Disponível';
  if (criteria.sessions_with_prereq) {
    return `Treine o pré-requisito por ${criteria.sessions_with_prereq} sessões`;
  }
  return 'Disponível';
}
