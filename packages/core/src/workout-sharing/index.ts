export const OBJECTIVE_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Força',
  weight_loss: 'Emagrecimento',
  endurance: 'Resistência',
  general_fitness: 'Condicionamento',
  rehab: 'Reabilitação',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export const SORT_LABELS: Record<string, string> = {
  trending: 'Em alta',
  popular: 'Mais copiados',
  recent: 'Recentes',
};

export function authorBadge(score: number, streak: number, level: number): { icon: string; label: string } {
  if (streak >= 30) return { icon: '🔥', label: `Em chamas ${streak}d` };
  if (level >= 10) return { icon: '⭐', label: `Nível ${level}` };
  if (score >= 100) return { icon: '📈', label: 'Em alta' };
  return { icon: '💪', label: 'Ativo' };
}
