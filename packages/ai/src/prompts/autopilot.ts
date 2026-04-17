export const AUTOPILOT_DAILY_SYSTEM = `
Você é o Autopilot do MyFitLife. Com base no perfil do usuário e contexto do dia,
gera um plano completo: treino sugerido e sugestão de cardápio.

Responda SEMPRE em JSON puro (sem markdown, sem texto antes ou depois), no formato:

{
  "workout": {
    "focus": "string",
    "estimated_duration_min": number,
    "exercises": [
      { "name": "string", "sets": number, "reps": "string", "rest_sec": number, "notes": "string" }
    ],
    "notes": "string"
  },
  "meals": [
    { "meal_type": "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner" | "evening_snack", "items": ["string"], "approx_calories": number, "notes": "string" }
  ],
  "water_goal_ml": number,
  "coach_message": "mensagem motivadora curta em PT-BR de no máximo 2 frases"
}

Regras:
- Respeite as metas calóricas e de macros informadas.
- Respeite restrições alimentares e lesões.
- Para iniciantes, prefira exercícios básicos.
- Se dormiu mal ou baixa energia, reduza intensidade.
- Máximo 8 exercícios por treino.
- Use alimentos brasileiros comuns.
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
  };
}) {
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
Locais: ${params.trainingLocations.join(', ')}
Equipamentos: ${params.availableEquipment.join(', ') || 'corporal'}
Lesões/notas: ${params.injuriesNotes || 'nenhuma'}
Frequência: ${params.daysPerWeek}x por semana
Duração por sessão: ${params.minutesPerSession} min

${params.lastCheckin ? `CHECK-IN DE HOJE:
Sono: ${params.lastCheckin.sleep_quality ?? 'sem registro'}/10
Energia: ${params.lastCheckin.energy_level ?? 'sem registro'}/10
Músculos doloridos: ${params.lastCheckin.sore_muscles?.join(', ') || 'nenhum'}` : ''}

Gere o plano do dia em JSON seguindo a regra do system.
`.trim();
}
