export type MuscleRegion =
  | 'pescoco'
  | 'trapezio'
  | 'deltoide_anterior'
  | 'deltoide_lateral'
  | 'deltoide_posterior'
  | 'peitoral_superior'
  | 'peitoral_inferior'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'latissimo'
  | 'romboides'
  | 'lombar'
  | 'abdomen_superior'
  | 'abdomen_inferior'
  | 'obliquos'
  | 'gluteos'
  | 'quadriceps'
  | 'isquiotibiais'
  | 'adutores'
  | 'abdutores'
  | 'panturrilha'
  | 'tibial_anterior';

export const MUSCLE_LABELS: Record<MuscleRegion, string> = {
  pescoco: 'Pescoço',
  trapezio: 'Trapézio',
  deltoide_anterior: 'Ombro frontal',
  deltoide_lateral: 'Ombro lateral',
  deltoide_posterior: 'Ombro posterior',
  peitoral_superior: 'Peito superior',
  peitoral_inferior: 'Peito inferior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  latissimo: 'Latíssimo (costas)',
  romboides: 'Romboides',
  lombar: 'Lombar',
  abdomen_superior: 'Abdômen superior',
  abdomen_inferior: 'Abdômen inferior',
  obliquos: 'Oblíquos',
  gluteos: 'Glúteos',
  quadriceps: 'Quadríceps',
  isquiotibiais: 'Posterior de coxa',
  adutores: 'Adutores',
  abdutores: 'Abdutores',
  panturrilha: 'Panturrilha',
  tibial_anterior: 'Tibial',
};

export const MUSCLE_KEYWORDS: Record<MuscleRegion, string[]> = {
  pescoco: ['pescoco', 'cervical'],
  trapezio: ['trapezio', 'trapezios'],
  deltoide_anterior: ['deltoide anterior', 'ombro anterior', 'ombro frontal'],
  deltoide_lateral: ['deltoide lateral', 'deltoide medio', 'ombro lateral', 'ombro medio'],
  deltoide_posterior: ['deltoide posterior', 'ombro posterior', 'ombro traseiro'],
  peitoral_superior: ['peitoral superior', 'peito superior', 'peitoral maior', 'peitoral maior (clavicular)'],
  peitoral_inferior: ['peitoral inferior', 'peito inferior'],
  biceps: ['biceps', 'bracial', 'biceps braquial', 'braquial'],
  triceps: ['triceps', 'triceps braquial'],
  antebraco: ['antebraco', 'braquiorradial', 'flexor de antebraco'],
  latissimo: ['latissimo', 'dorsal', 'grande dorsal', 'latissimo do dorso', 'costas'],
  romboides: ['romboides', 'meio das costas'],
  lombar: ['lombar', 'eretor da espinha', 'parte baixa das costas'],
  abdomen_superior: ['abdomen', 'reto abdominal', 'abdomen superior'],
  abdomen_inferior: ['abdomen inferior', 'transverso do abdomen', 'reto abdominal (inferior)'],
  obliquos: ['obliquos', 'obliquo interno', 'obliquo externo'],
  gluteos: ['gluteo', 'gluteos', 'gluteo maximo', 'bumbum'],
  quadriceps: ['quadriceps', 'coxa frontal', 'vasto lateral', 'vasto medial', 'reto femoral'],
  isquiotibiais: ['isquiotibiais', 'posterior de coxa', 'biceps femoral', 'semitendinoso'],
  adutores: ['adutores', 'adutor'],
  abdutores: ['abdutores', 'abdutor', 'gluteo medio', 'tensor da fascia lata'],
  panturrilha: ['panturrilha', 'gemeos', 'gastrocnemio', 'soleo'],
  tibial_anterior: ['tibial anterior', 'tibial'],
};

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function matchMuscleRegion(raw: string): MuscleRegion | null {
  const n = normalize(raw);
  for (const [region, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
    for (const kw of keywords) {
      if (n.includes(normalize(kw))) return region as MuscleRegion;
    }
  }
  return null;
}

export const MUSCLE_GROUPS = {
  superior: [
    'pescoco', 'trapezio',
    'deltoide_anterior', 'deltoide_lateral', 'deltoide_posterior',
    'peitoral_superior', 'peitoral_inferior',
    'biceps', 'triceps', 'antebraco',
    'latissimo', 'romboides', 'lombar',
  ],
  core: ['abdomen_superior', 'abdomen_inferior', 'obliquos'],
  inferior: ['gluteos', 'quadriceps', 'isquiotibiais', 'adutores', 'abdutores', 'panturrilha', 'tibial_anterior'],
} as const;
