import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_MODEL = 'claude-opus-4-7';
export const CLAUDE_MODEL_FAST = 'claude-haiku-4-5-20251001';
export const CLAUDE_FALLBACK_MODEL = 'claude-haiku-4-5-20251001';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

type UsageInfo = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  feature: string;
  user_id: string;
};

type CallOptions = {
  model?: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: any }>;
  temperature?: number;
  feature?: string;
  userId?: string;
  onUsage?: (usage: UsageInfo) => void;
};

export type CallResult = {
  text: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  fallback_used: boolean;
};

export async function callWithRetry(opts: CallOptions): Promise<CallResult> {
  const client = getAnthropicClient();
  const started = Date.now();
  const primaryModel = opts.model || CLAUDE_MODEL;

  try {
    const response = await client.messages.create({
      model: primaryModel,
      max_tokens: opts.max_tokens,
      system: opts.system,
      messages: opts.messages,
      temperature: opts.temperature,
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))
      .join('\n');

    if (opts.onUsage) {
      opts.onUsage({
        model: primaryModel,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        feature: opts.feature || 'unknown',
        user_id: opts.userId || 'system',
      });
    }

    return {
      text,
      model_used: primaryModel,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      latency_ms: Date.now() - started,
      fallback_used: false,
    };
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const isRetriable = status === 429 || status === 500 || status === 502 || status === 503 || status === 529;

    if (!isRetriable) throw err;

    console.warn(`[callWithRetry] Primary model ${primaryModel} failed with ${status}, using fallback`);

    try {
      const response = await client.messages.create({
        model: CLAUDE_FALLBACK_MODEL,
        max_tokens: opts.max_tokens,
        system: opts.system,
        messages: opts.messages,
        temperature: opts.temperature,
      });

      const text = response.content
        .filter((c) => c.type === 'text')
        .map((c) => ('text' in c ? c.text : ''))
        .join('\n');

      if (opts.onUsage) {
        opts.onUsage({
          model: CLAUDE_FALLBACK_MODEL,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          feature: opts.feature || 'unknown',
          user_id: opts.userId || 'system',
        });
      }

      return {
        text,
        model_used: CLAUDE_FALLBACK_MODEL,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        latency_ms: Date.now() - started,
        fallback_used: true,
      };
    } catch (fallbackErr) {
      console.error('[callWithRetry] Fallback também falhou', fallbackErr);
      throw fallbackErr;
    }
  }
}

// Tabela de preços por 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'claude-opus-4-6': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] || PRICING[CLAUDE_MODEL];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}
