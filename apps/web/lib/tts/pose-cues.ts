export type PoseCueType =
  | 'depth_too_shallow'
  | 'depth_good'
  | 'back_rounding'
  | 'knees_caving'
  | 'knees_forward'
  | 'elbow_flare'
  | 'elbow_too_low'
  | 'core_loose'
  | 'head_forward'
  | 'tempo_too_fast'
  | 'tempo_too_slow'
  | 'rep_counted'
  | 'rep_milestone'
  | 'rest_start'
  | 'rest_end'
  | 'set_start'
  | 'set_complete'
  | 'form_excellent'
  | 'form_watch'
  | 'encouragement_mid'
  | 'encouragement_end';

interface CueConfig {
  phrases: string[];
  priority: number;
  throttleMs: number;
}

const CUES: Record<PoseCueType, CueConfig> = {
  depth_too_shallow: {
    phrases: ['Abaixe mais', 'Desce mais um pouco', 'Mais profundo'],
    priority: 5,
    throttleMs: 6000,
  },
  depth_good: {
    phrases: ['Profundidade boa', 'Isso! Boa profundidade'],
    priority: 2,
    throttleMs: 15000,
  },
  back_rounding: {
    phrases: ['Endireita as costas', 'Mantém as costas neutras', 'Peito aberto'],
    priority: 8,
    throttleMs: 4000,
  },
  knees_caving: {
    phrases: ['Joelhos pra fora', 'Abre os joelhos', 'Não deixa o joelho cair pra dentro'],
    priority: 8,
    throttleMs: 5000,
  },
  knees_forward: {
    phrases: ['Joelho muito à frente', 'Empurra o quadril pra trás', 'Senta mais pra trás'],
    priority: 6,
    throttleMs: 6000,
  },
  elbow_flare: {
    phrases: ['Aproxima os cotovelos do corpo', 'Não abre tanto o cotovelo'],
    priority: 6,
    throttleMs: 5000,
  },
  elbow_too_low: {
    phrases: ['Desce mais o peito', 'Completa a descida'],
    priority: 5,
    throttleMs: 5000,
  },
  core_loose: {
    phrases: ['Contrai o core', 'Abdômen firme', 'Mantém o core ativo'],
    priority: 6,
    throttleMs: 6000,
  },
  head_forward: {
    phrases: ['Queixo pra trás', 'Olha pra frente, não pra cima', 'Cabeça neutra'],
    priority: 4,
    throttleMs: 8000,
  },
  tempo_too_fast: {
    phrases: ['Mais devagar', 'Controla o movimento', 'Desce controlado'],
    priority: 4,
    throttleMs: 6000,
  },
  tempo_too_slow: {
    phrases: ['Pode acelerar um pouco', 'Mantém o ritmo'],
    priority: 2,
    throttleMs: 10000,
  },
  rep_counted: {
    phrases: [],
    priority: 3,
    throttleMs: 0,
  },
  rep_milestone: {
    phrases: ['Metade feita', 'Só mais algumas', 'Reta final', 'Vai forte'],
    priority: 3,
    throttleMs: 3000,
  },
  rest_start: {
    phrases: ['Descanso. Respira fundo.', 'Pausa. Relaxa.'],
    priority: 5,
    throttleMs: 3000,
  },
  rest_end: {
    phrases: ['Próxima série', 'Vamos pra próxima série', 'Posiciona aí'],
    priority: 7,
    throttleMs: 3000,
  },
  set_start: {
    phrases: ['Bora! Começa quando estiver pronta', 'Pode começar', 'Vai!'],
    priority: 6,
    throttleMs: 3000,
  },
  set_complete: {
    phrases: ['Série concluída', 'Isso! Série feita', 'Mandou bem'],
    priority: 5,
    throttleMs: 3000,
  },
  form_excellent: {
    phrases: ['Forma impecável', 'Perfeito!', 'Isso! Forma perfeita'],
    priority: 2,
    throttleMs: 20000,
  },
  form_watch: {
    phrases: ['Atenção na forma', 'Presta atenção na técnica'],
    priority: 4,
    throttleMs: 10000,
  },
  encouragement_mid: {
    phrases: ['Isso!', 'Vai forte', 'Continua', 'Mandou bem', 'Firme'],
    priority: 1,
    throttleMs: 12000,
  },
  encouragement_end: {
    phrases: ['Última! Vai!', 'Última rep, dá tudo', 'Mais uma!'],
    priority: 4,
    throttleMs: 4000,
  },
};

export function getCueText(type: PoseCueType, variant?: number): string {
  const config = CUES[type];
  if (!config || config.phrases.length === 0) return '';
  const idx =
    variant !== undefined
      ? variant % config.phrases.length
      : Math.floor(Math.random() * config.phrases.length);
  return config.phrases[idx];
}

export function getCueConfig(type: PoseCueType): { priority: number; throttleMs: number } {
  const c = CUES[type];
  return { priority: c?.priority || 0, throttleMs: c?.throttleMs ?? 5000 };
}

export function countRepText(n: number): string {
  return String(n);
}

/**
 * Maps a Portuguese cue string from analyzePose() to a PoseCueType for TTS.
 * Returns null if the cue doesn't match any known pattern.
 */
export function mapCueToType(cue: string): PoseCueType | null {
  const lower = cue.toLowerCase();

  if (lower.includes('desça mais') || lower.includes('quadril ainda acima')) return 'depth_too_shallow';
  if (lower.includes('peito mais aberto') || lower.includes('costas')) return 'back_rounding';
  if (lower.includes('joelhos muito flexionados') || lower.includes('cuidado')) return 'knees_caving';
  if (lower.includes('simetria')) return 'knees_caving';
  if (lower.includes('quadril muito alto') || lower.includes('quadril caindo') || lower.includes('core')) return 'core_loose';
  if (lower.includes('cotovelo') || lower.includes('cotovelos')) return 'elbow_too_low';
  if (lower.includes('tronco mais ereto')) return 'back_rounding';
  if (lower.includes('joelho da frente passou')) return 'knees_forward';
  if (lower.includes('joelho da frente ainda')) return 'depth_too_shallow';

  return null;
}
