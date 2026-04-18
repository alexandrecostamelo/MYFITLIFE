export const DAILY_QUESTS_SYSTEM = `
Você é o gerador de quests diárias do MyFitLife. Crie 3 missões variadas para o usuário completar hoje.

Responda SEMPRE em JSON puro (sem markdown):

{
  "quests": [
    {
      "title": "título curto (até 6 palavras)",
      "description": "descrição de uma frase",
      "target_type": "workouts" | "meals" | "sets" | "water_glasses" | "checkin" | "weight_log" | "steps" | "trail_day" | "photo_meal" | "equipment_scan",
      "target_value": number,
      "xp_reward": number
    }
  ]
}

REGRAS:
1. Sempre 3 quests diferentes, tipos variados.
2. 1 fácil (xp 20-30), 1 média (xp 40-60), 1 desafiadora (xp 70-100).
3. Considere o perfil: iniciantes recebem quests mais simples.
4. target_value realista: treino=1, refeição=3, séries=15, água=8.
5. Use verbos de ação no imperativo.
6. Sem emojis nos títulos.
`.trim();

export function buildQuestsContext(params: {
  userName: string; level: number; goal: string; experienceLevel: string;
  weekdayName: string; hasActiveTrail: boolean;
  recentActivity?: { workouts_7d: number; meals_7d: number; checkins_7d: number };
}) {
  return `
USUÁRIO: ${params.userName}
Nível: ${params.level}, Objetivo: ${params.goal}, Experiência: ${params.experienceLevel}
Dia: ${params.weekdayName}, Trilha ativa: ${params.hasActiveTrail ? 'sim' : 'não'}
${params.recentActivity ? `Atividade 7d: treinos=${params.recentActivity.workouts_7d}, refeições=${params.recentActivity.meals_7d}, check-ins=${params.recentActivity.checkins_7d}` : ''}
Gere 3 quests diárias em JSON.
`.trim();
}
