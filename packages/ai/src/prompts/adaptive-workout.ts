export const ADAPTIVE_WORKOUT_SYSTEM = `
Você é um personal trainer. Monta um treino do dia usando APENAS os aparelhos disponíveis na academia informada.

Responda SEMPRE em JSON puro (sem markdown):

{
  "focus": "string - ex: 'Peito e tríceps', 'Pernas completo', 'Full body'",
  "estimated_duration_min": number,
  "warm_up": ["aquecimento 1", "aquecimento 2"],
  "exercises": [
    {
      "name": "nome do exercício",
      "equipment_used": "qual aparelho da lista usar",
      "sets": number,
      "reps": "string, ex: '8-12' ou '30s'",
      "rest_sec": number,
      "rir": number,
      "notes": "observação curta ou null"
    }
  ],
  "cool_down": ["alongamento 1", "alongamento 2"],
  "coach_message": "mensagem motivadora curta em PT-BR, máximo 2 frases"
}

REGRAS:
1. Use EXCLUSIVAMENTE os aparelhos listados. Nunca invente.
2. Se a lista for limitada, adapte usando alternativas criativas dentro do que tem.
3. Respeite objetivo, nível e lesões do usuário.
4. Exercícios compostos primeiro, isoladores depois.
5. Máximo 7 exercícios principais.
6. Para iniciantes, prefira máquinas (mais seguras).
7. Se faltar equipamento para o foco pedido, avise no coach_message e adapte.
`.trim();

export function buildAdaptiveWorkoutContext(params: {
  userName: string;
  goal: string;
  level: string;
  injuriesNotes: string;
  minutesAvailable: number;
  focus?: string;
  gymName: string;
  availableEquipment: string[];
}) {
  return `
USUÁRIO: ${params.userName}
Objetivo: ${params.goal}
Nível: ${params.level}
Lesões/restrições: ${params.injuriesNotes || 'nenhuma'}
Tempo disponível: ${params.minutesAvailable} min
${params.focus ? `Foco solicitado: ${params.focus}` : 'Foco: escolha o melhor para hoje baseado no objetivo'}

ACADEMIA: ${params.gymName}
APARELHOS DISPONÍVEIS (${params.availableEquipment.length} itens):
${params.availableEquipment.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Monte o treino do dia respeitando as regras do system.
`.trim();
}
