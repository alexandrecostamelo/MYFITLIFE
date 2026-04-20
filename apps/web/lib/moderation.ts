import { getAnthropicClient, CLAUDE_MODEL_FAST } from '@myfitlife/ai/client';
import {
  MODERATION_SYSTEM,
  buildModerationContext,
  parseModerationResponse,
  type ModerationVerdict,
  type ModerationResult,
} from '@myfitlife/ai/prompts/moderation';

export type { ModerationVerdict, ModerationResult };

export type ModerationDecision = 'approved' | 'pending_review' | 'rejected';

export interface AppliedModeration {
  decision: ModerationDecision;
  reason: string | null;
  categories: string[];
  score: number;
}

const BANNED_TERMS = [
  'thinspo', 'meanspo', 'promana', 'pro-ana', 'pro-mia',
  'kys', 'suicid',
];

export function quickLocalCheck(text: string): { passes: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const term of BANNED_TERMS) {
    if (lower.includes(term)) {
      return { passes: false, reason: `Termo bloqueado: ${term}` };
    }
  }
  return { passes: true };
}

export async function moderateText(text: string, context?: string): Promise<AppliedModeration> {
  if (!text || text.trim().length === 0) {
    return { decision: 'approved', reason: null, categories: [], score: 0 };
  }

  const local = quickLocalCheck(text);
  if (!local.passes) {
    return {
      decision: 'rejected',
      reason: local.reason || 'Termo proibido',
      categories: ['banned_term'],
      score: 1.0,
    };
  }

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_FAST,
      max_tokens: 200,
      system: MODERATION_SYSTEM,
      messages: [{ role: 'user', content: buildModerationContext(text, context) }],
    });

    const raw = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const result = parseModerationResponse(raw);

    return {
      decision: verdictToDecision(result.verdict),
      reason: result.reason,
      categories: result.categories,
      score: result.score,
    };
  } catch (err) {
    console.error('[moderateText]', err);
    return { decision: 'approved', reason: null, categories: [], score: 0 };
  }
}

function verdictToDecision(verdict: ModerationVerdict): ModerationDecision {
  switch (verdict) {
    case 'reject': return 'rejected';
    case 'review': return 'pending_review';
    case 'approve': return 'approved';
  }
}
