export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Folicular',
  ovulatory: 'Ovulatória',
  luteal: 'Lútea',
  unknown: 'Indefinida',
};

export const PHASE_DESCRIPTIONS: Record<CyclePhase, string> = {
  menstrual: 'Energia mais baixa. Treinos leves e descanso são bem-vindos.',
  follicular: 'Energia subindo. Ótima fase para treinos de força e progressão de carga.',
  ovulatory: 'Pico de força e resistência. Teste seus PRs.',
  luteal: 'Energia e recuperação caem. Prefira volume moderado e mais cuidado com sono/nutrição.',
  unknown: 'Sem dados suficientes para identificar a fase.',
};

export function phaseForDay(
  dayInCycle: number,
  periodLength: number,
  cycleLength: number
): CyclePhase {
  if (dayInCycle <= periodLength) return 'menstrual';
  const ovulationDay = cycleLength - 14;
  if (dayInCycle < ovulationDay - 1) return 'follicular';
  if (dayInCycle >= ovulationDay - 1 && dayInCycle <= ovulationDay + 1) return 'ovulatory';
  return 'luteal';
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeCurrentPhase(params: {
  lastPeriodStart: string | null;
  averageCycleLength: number;
  averagePeriodLength: number;
}): { phase: CyclePhase; dayInCycle: number | null; daysUntilNext: number | null } {
  if (!params.lastPeriodStart) {
    return { phase: 'unknown', dayInCycle: null, daysUntilNext: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = daysBetween(params.lastPeriodStart, today);
  if (diff < 0 || diff > params.averageCycleLength * 2) {
    return { phase: 'unknown', dayInCycle: null, daysUntilNext: null };
  }

  const dayInCycle = (diff % params.averageCycleLength) + 1;
  const daysUntilNext = params.averageCycleLength - dayInCycle + 1;
  const phase = phaseForDay(dayInCycle, params.averagePeriodLength, params.averageCycleLength);

  return { phase, dayInCycle, daysUntilNext };
}

export function cycleTrainingHints(phase: CyclePhase): string {
  const hints: Record<CyclePhase, string> = {
    menstrual: 'Priorize mobilidade, yoga, caminhada e cargas leves. Respeite sua energia.',
    follicular: 'Fase ideal para progressão de cargas, força máxima e treinos intensos.',
    ovulatory: 'Pico de força. Busque PRs em compostos (agachamento, levantamento, supino).',
    luteal: 'Reduza intensidade gradualmente. Priorize recuperação, sono e sódio adequado.',
    unknown: '',
  };
  return hints[phase];
}

export function cycleNutritionHints(phase: CyclePhase): string {
  const hints: Record<CyclePhase, string> = {
    menstrual: 'Ferro e magnésio ajudam: carnes vermelhas, folhas escuras, cacau, oleaginosas.',
    follicular: 'Sensibilidade à insulina alta — carbos rendem bem no treino.',
    ovulatory: 'Hidratação e proteína adequadas mantêm o pico de performance.',
    luteal: 'Corpo retém mais água; cuidado com sódio e açúcares. Magnésio ajuda com sintomas.',
    unknown: '',
  };
  return hints[phase];
}
