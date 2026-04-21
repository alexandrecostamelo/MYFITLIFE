const COST_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15, output: 75 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
};

export function calculateCostUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates =
    COST_PER_1M_TOKENS[model] ||
    COST_PER_1M_TOKENS['claude-haiku-4-5-20251001'];
  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  );
}

export async function trackAICostServer(params: {
  model: string;
  input_tokens: number;
  output_tokens: number;
  feature: string;
  user_id: string;
}): Promise<void> {
  const costUSD = calculateCostUSD(
    params.model,
    params.input_tokens,
    params.output_tokens,
  );

  const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const POSTHOG_HOST =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!POSTHOG_KEY) return;

  await fetch(`${POSTHOG_HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: 'ai_api_call',
      distinct_id: params.user_id,
      properties: {
        model: params.model,
        input_tokens: params.input_tokens,
        output_tokens: params.output_tokens,
        cost_usd: Math.round(costUSD * 10000) / 10000,
        feature: params.feature,
      },
    }),
  }).catch(() => null);
}
