import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function getAnthropicClient() {
  if (!cached) {
    cached = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return cached;
}

export const CLAUDE_MODEL = 'claude-opus-4-7';
export const CLAUDE_MODEL_FAST = 'claude-haiku-4-5-20251001';
