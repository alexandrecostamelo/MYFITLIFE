export type MuscleKey =
  | 'chest'
  | 'shoulders_front' | 'shoulders_side' | 'shoulders_rear'
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques'
  | 'traps' | 'lats' | 'lower_back'
  | 'glutes' | 'quads' | 'hamstrings' | 'calves'
  | 'adductors';

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  chest: 'Peitoral',
  shoulders_front: 'Deltoide anterior',
  shoulders_side: 'Deltoide lateral',
  shoulders_rear: 'Deltoide posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  abs: 'Abdômen',
  obliques: 'Oblíquos',
  traps: 'Trapézio',
  lats: 'Dorsal (latíssimo)',
  lower_back: 'Lombar',
  glutes: 'Glúteos',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de coxa',
  calves: 'Panturrilhas',
  adductors: 'Adutores',
};

type ExerciseMuscles = { primary: MuscleKey[]; secondary?: MuscleKey[] };

export const EXERCISE_MUSCLE_MAP: Record<string, ExerciseMuscles> = {
  supino_reto: { primary: ['chest'], secondary: ['triceps', 'shoulders_front'] },
  supino_inclinado: { primary: ['chest', 'shoulders_front'], secondary: ['triceps'] },
  crucifixo: { primary: ['chest'], secondary: ['shoulders_front'] },
  flexao: { primary: ['chest'], secondary: ['triceps', 'shoulders_front', 'abs'] },
  voador: { primary: ['chest'] },

  desenvolvimento: { primary: ['shoulders_front', 'shoulders_side'], secondary: ['triceps', 'traps'] },
  elevacao_lateral: { primary: ['shoulders_side'] },
  elevacao_frontal: { primary: ['shoulders_front'] },
  crucifixo_inverso: { primary: ['shoulders_rear'], secondary: ['traps'] },
  remada_alta: { primary: ['shoulders_side', 'traps'] },

  puxada: { primary: ['lats'], secondary: ['biceps', 'shoulders_rear'] },
  remada_curvada: { primary: ['lats', 'traps'], secondary: ['biceps', 'shoulders_rear'] },
  remada_sentada: { primary: ['lats', 'traps'], secondary: ['biceps'] },
  barra_fixa: { primary: ['lats'], secondary: ['biceps'] },
  levantamento_terra: { primary: ['lower_back', 'hamstrings', 'glutes'], secondary: ['traps', 'lats'] },

  rosca_direta: { primary: ['biceps'], secondary: ['forearms'] },
  rosca_martelo: { primary: ['biceps', 'forearms'] },
  rosca_alternada: { primary: ['biceps'], secondary: ['forearms'] },
  triceps_corda: { primary: ['triceps'] },
  triceps_frances: { primary: ['triceps'] },
  mergulho: { primary: ['triceps', 'chest'], secondary: ['shoulders_front'] },

  prancha: { primary: ['abs'], secondary: ['obliques', 'lower_back'] },
  abdominal: { primary: ['abs'] },
  abdominal_oblicuo: { primary: ['obliques'], secondary: ['abs'] },
  elevacao_pernas: { primary: ['abs'], secondary: ['obliques'] },

  agachamento: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'] },
  leg_press: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  avanco: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  cadeira_extensora: { primary: ['quads'] },
  cadeira_flexora: { primary: ['hamstrings'] },
  stiff: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'] },
  bulgaro: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  elevacao_pelvica: { primary: ['glutes'], secondary: ['hamstrings'] },
  cadeira_adutora: { primary: ['adductors'] },
  panturrilha: { primary: ['calves'] },

  corrida: { primary: ['quads', 'hamstrings', 'calves'], secondary: ['glutes', 'abs'] },
  bicicleta: { primary: ['quads'], secondary: ['hamstrings', 'calves', 'glutes'] },
  burpee: { primary: ['chest', 'quads'], secondary: ['abs', 'shoulders_front', 'triceps'] },
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function matchExerciseMuscles(exerciseName: string): ExerciseMuscles {
  const key = normalize(exerciseName);
  if (EXERCISE_MUSCLE_MAP[key]) return EXERCISE_MUSCLE_MAP[key];

  for (const [mapKey, value] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return value;
  }

  return matchByKeywords(key);
}

function matchByKeywords(key: string): ExerciseMuscles {
  const checks: Array<{ keywords: string[]; result: ExerciseMuscles }> = [
    { keywords: ['supino', 'peito', 'peitoral', 'chest'], result: { primary: ['chest'], secondary: ['triceps', 'shoulders_front'] } },
    { keywords: ['crucifixo'], result: { primary: ['chest'] } },
    { keywords: ['flexao', 'push'], result: { primary: ['chest'], secondary: ['triceps'] } },
    { keywords: ['desenvolvimento', 'militar', 'press_ombro'], result: { primary: ['shoulders_front', 'shoulders_side'], secondary: ['triceps'] } },
    { keywords: ['elevacao_lateral', 'deltoide_lateral'], result: { primary: ['shoulders_side'] } },
    { keywords: ['puxada', 'pulldown', 'dorsal'], result: { primary: ['lats'], secondary: ['biceps'] } },
    { keywords: ['remada'], result: { primary: ['lats', 'traps'], secondary: ['biceps'] } },
    { keywords: ['barra_fixa', 'pull_up', 'chin_up'], result: { primary: ['lats'], secondary: ['biceps'] } },
    { keywords: ['terra', 'deadlift'], result: { primary: ['lower_back', 'hamstrings', 'glutes'] } },
    { keywords: ['rosca', 'biceps', 'curl'], result: { primary: ['biceps'], secondary: ['forearms'] } },
    { keywords: ['triceps'], result: { primary: ['triceps'] } },
    { keywords: ['mergulho', 'dip'], result: { primary: ['triceps', 'chest'] } },
    { keywords: ['abdominal', 'crunch'], result: { primary: ['abs'] } },
    { keywords: ['prancha', 'plank'], result: { primary: ['abs'], secondary: ['obliques'] } },
    { keywords: ['oblique'], result: { primary: ['obliques'], secondary: ['abs'] } },
    { keywords: ['agachamento', 'squat'], result: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] } },
    { keywords: ['leg_press'], result: { primary: ['quads', 'glutes'] } },
    { keywords: ['avanco', 'lunge', 'afundo'], result: { primary: ['quads', 'glutes'] } },
    { keywords: ['extensora'], result: { primary: ['quads'] } },
    { keywords: ['flexora', 'stiff'], result: { primary: ['hamstrings'] } },
    { keywords: ['gluteo', 'elevacao_pelvica', 'hip_thrust'], result: { primary: ['glutes'] } },
    { keywords: ['panturrilha', 'calf'], result: { primary: ['calves'] } },
    { keywords: ['adutora', 'adductor'], result: { primary: ['adductors'] } },
    { keywords: ['corrida', 'running'], result: { primary: ['quads', 'hamstrings', 'calves'] } },
    { keywords: ['bicicleta', 'bike', 'cycling'], result: { primary: ['quads'], secondary: ['hamstrings', 'calves'] } },
    { keywords: ['burpee'], result: { primary: ['chest', 'quads'], secondary: ['abs'] } },
  ];

  for (const { keywords, result } of checks) {
    if (keywords.some((kw) => key.includes(kw))) return result;
  }

  return { primary: [] };
}

export type MuscleActivation = Partial<Record<MuscleKey, number>>;

export function computeActivation(exercises: Array<{ name: string; sets?: number; reps?: number }>): MuscleActivation {
  const activation: MuscleActivation = {};

  for (const ex of exercises) {
    const volume = (ex.sets || 1) * (ex.reps || 10);
    const muscles = matchExerciseMuscles(ex.name);

    for (const m of muscles.primary) {
      activation[m] = (activation[m] || 0) + volume;
    }
    for (const m of muscles.secondary || []) {
      activation[m] = (activation[m] || 0) + volume * 0.4;
    }
  }

  return activation;
}

export function normalizeActivation(activation: MuscleActivation): MuscleActivation {
  const values = Object.values(activation) as number[];
  if (values.length === 0) return {};
  const max = Math.max(...values);
  if (max === 0) return {};

  const normalized: MuscleActivation = {};
  for (const [key, value] of Object.entries(activation)) {
    normalized[key as MuscleKey] = (value as number) / max;
  }
  return normalized;
}
