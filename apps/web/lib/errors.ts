export class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export async function fetchWithRateLimit(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (res.status === 429) {
    const data = await res.json();
    throw new RateLimitError(
      data.message || 'Limite de requisições atingido.',
      data.retry_after_seconds || 60
    );
  }
  return res;
}
