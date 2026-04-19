import { getAnthropicClient, CLAUDE_MODEL } from '@myfitlife/ai/client';
import { MODERATION_SYSTEM, buildModerationContext } from '@myfitlife/ai/prompts/moderation';

type ModerationResult = {
  decision: 'approved' | 'flagged';
  reason: string | null;
  scores: Record<string, number>;
};

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

export async function moderateText(text: string): Promise<ModerationResult> {
  const local = quickLocalCheck(text);
  if (!local.passes) {
    return {
      decision: 'flagged',
      reason: local.reason || 'Termo proibido',
      scores: {},
    };
  }

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system: MODERATION_SYSTEM,
      messages: [{ role: 'user', content: buildModerationContext(text) }],
    });

    const txt = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { decision: 'approved', reason: null, scores: {} };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      decision: parsed.decision === 'flagged' ? 'flagged' : 'approved',
      reason: parsed.reason || null,
      scores: parsed.scores || {},
    };
  } catch (err) {
    console.error('[moderateText]', err);
    return { decision: 'approved', reason: null, scores: {} };
  }
}
