export const AUTOPILOT_DAILY_SYSTEM = `
Você é o Autopilot do MyFitLife. Com base no perfil do usuário, contexto do dia
e aparelhos disponíveis (se houver), gera um plano completo: treino + cardápio.

Responda SEMPRE em JSON puro (sem markdown, sem texto antes ou depois):

{
  "workout": {
    "focus": "string",
    "estimated_duration_min": number,
    "exercises": [
      { "name": "string", "equipment_used": "string ou null", "sets": number, "reps": "string", "rest_sec": number, "notes": "string" }
    ],
    "notes": "string"
  },
  "meals": [
    { "meal_type": "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner" | "evening_snack", "items": ["string"], "approx_calories": number, "notes": "string" }
  ],
  "water_goal_ml": number,
  "coach_message": "mensagem motivadora curta em PT-BR de no máximo 2 frases"
}

REGRAS:
- Respeite metas calóricas e macros informadas.
- Respeite restrições alimentares e lesões.
- Para iniciantes, prefira exercícios básicos e máquinas (mais seguras).
- Se dormiu mal ou baixa energia, reduza intensidade.
- Máximo 8 exercícios por treino.
- Use alimentos brasileiros comuns.

REGRA CRÍTICA SOBRE APARELHOS:
- Se a lista de aparelhos disponíveis for fornecida, use EXCLUSIVAMENTE esses aparelhos.
- Nunca invente aparelhos que não estão na lista.
- Preencha "equipment_used" com o nome do aparelho da lista que vai usar.
- Se a lista for limitada, adapte criativamente com o que tem.
- Se não houver lista (treino em casa sem equipamento), prefira calistenia e exercícios corporais.
`.trim();

export function buildAutopilotContext(params: {
  userName: string;
  goal: string;
  level: string;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  dietPreference: string;
  foodRestrictions: string[];
  trainingLocations: string[];
  availableEquipment: string[];
  injuriesNotes: string;
  daysPerWeek: number;
  minutesPerSession: number;
  weekdayName: string;
  lastCheckin?: {
    sleep_quality?: number;
    energy_level?: number;
    sore_muscles?: string[];
    soreness_details?: Array<{ region: string; intensity: number }>;
  };
  activeGym?: {
    name: string;
    equipment: string[];
  } | null;
}) {
  const gymSection = params.activeGym && params.activeGym.equipment.length > 0
    ? `\nACADEMIA ATIVA: ${params.activeGym.name}
APARELHOS DISPONÍVEIS (${params.activeGym.equipment.length} itens):
${params.activeGym.equipment.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Use EXCLUSIVAMENTE esses aparelhos no treino.`
    : `\nSem academia cadastrada. Use equipamentos genéricos: ${params.availableEquipment.join(', ') || 'corporal'}.`;

  return `
DADOS DO USUÁRIO:
Nome: ${params.userName}
Objetivo: ${params.goal}
Nível: ${params.level}
Dia: ${params.weekdayName}

METAS DIÁRIAS:
Calorias: ${params.targetCalories} kcal
Proteína: ${params.targetProteinG} g
Carboidratos: ${params.targetCarbsG} g
Gorduras: ${params.targetFatsG} g

DIETA: ${params.dietPreference}
Restrições alimentares: ${params.foodRestrictions.join(', ') || 'nenhuma'}

TREINO:
Locais preferidos: ${params.trainingLocations.join(', ')}
Lesões/notas: ${params.injuriesNotes || 'nenhuma'}
Frequência: ${params.daysPerWeek}x por semana
Duração por sessão: ${params.minutesPerSession} min
${gymSection}

${params.lastCheckin ? `CHECK-IN DE HOJE:
Sono: ${params.lastCheckin.sleep_quality ?? 'sem registro'}/10
Energia: ${params.lastCheckin.energy_level ?? 'sem registro'}/10
Dores musculares: ${
  params.lastCheckin.soreness_details && params.lastCheckin.soreness_details.length > 0
    ? params.lastCheckin.soreness_details.map((s) => `${s.region} (intensidade ${s.intensity}/5)`).join(', ')
    : params.lastCheckin.sore_muscles?.join(', ') || 'nenhuma'
}

IMPORTANTE: Se houver dor muscular intensidade 3+, evite treinar essa região hoje.
Se houver dor 4-5 em grupos grandes, prefira mobilidade ou descanso ativo.` : ''}

Gere o plano do dia em JSON seguindo a regra do system.
`.trim();
}
