export const MODERATION_SYSTEM = `
Você é o moderador de conteúdo do MyFitLife, app fitness brasileiro.

Analise o post e retorne JSON com:
- verdict: "approve" | "review" | "reject"
- score: 0.00 (limpo) a 1.00 (proibido)
- categories: array com 0 ou mais: spam, harassment, hate_speech, nudity_text, violence, misinformation_health, self_harm, dangerous_advice, impersonation, off_topic_commercial, pro_ana, pro_overtraining, doping_promotion, body_shaming, eating_disorder
- reason: 1 frase curta em PT-BR

Regras:
- approve: post normal fitness, motivação, dúvida, celebração, receitas, rotinas
- reject (score >= 0.80): hate speech explícito, ameaça, doxing, pornografia, pro-suicídio, venda de anabolizantes sem receita, golpe, assédio direto
- review (score 0.40-0.79): linguagem agressiva ambígua, conselhos de saúde duvidosos, dieta radical (<1000 kcal), promoção de overtraining, possível pro-ana, links suspeitos, crítica dura a pessoa identificável, body shaming leve

Contexto fitness:
- "Vou quebrar tudo no treino hoje" -> APPROVE (gíria positiva)
- "Dieta de 600kcal funciona?" -> REVIEW (pro-ana risco)
- "Quem tem receita de oxandrolona?" -> REJECT (doping sem receita)
- "Você é uma vaca gorda" -> REJECT (assédio + body shaming)
- "Personal X é um picareta" -> REVIEW (crítica a pessoa identificável)
- "Compre meu curso!" com link -> REVIEW (off_topic_commercial)
- "Sou grato pelo progresso" -> APPROVE

Retorne APENAS o JSON, sem markdown, sem explicação.
`.trim();

export type ModerationVerdict = 'approve' | 'review' | 'reject';

export interface ModerationResult {
  verdict: ModerationVerdict;
  score: number;
  categories: string[];
  reason: string;
}

export function buildModerationContext(text: string, context?: string): string {
  return `Contexto: ${context || 'feed'}\n\nPost:\n"""${text.slice(0, 2000)}"""`;
}

/**
 * Parse raw AI response into structured ModerationResult
 */
export function parseModerationResponse(raw: string): ModerationResult {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);

    const verdict: ModerationVerdict =
      parsed.verdict === 'reject' || parsed.verdict === 'review' || parsed.verdict === 'approve'
        ? parsed.verdict
        : 'review';

    return {
      verdict,
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(1, parsed.score)) : 0.5,
      categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5) : [],
      reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 300) : 'sem motivo',
    };
  } catch {
    return {
      verdict: 'review',
      score: 0.5,
      categories: ['parse_error'],
      reason: 'IA não retornou JSON válido, enviado para revisão humana',
    };
  }
}
