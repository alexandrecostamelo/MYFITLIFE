import { describe, it, expect, vi } from 'vitest';
import { LIMITS, checkAndIncrementLimit } from './rate-limit-v2';

describe('LIMITS', () => {
  it('has coach_stream bucket', () => {
    expect(LIMITS.coach_stream).toBeDefined();
    expect(LIMITS.coach_stream.max).toBeGreaterThan(0);
  });

  it('has lab_extraction with limit of 5', () => {
    expect(LIMITS.lab_extraction.max).toBe(5);
  });

  it('all buckets have positive max and window_minutes', () => {
    for (const [, config] of Object.entries(LIMITS)) {
      expect(config.max).toBeGreaterThan(0);
      expect(config.window_minutes).toBeGreaterThan(0);
    }
  });
});

describe('checkAndIncrementLimit', () => {
  function makeMockClient(existingRecord: any | null, insertFn = vi.fn()) {
    const maybeSingle = vi.fn().mockResolvedValue({ data: existingRecord });
    const limit = vi.fn().mockReturnValue({ maybeSingle });
    const order = vi.fn().mockReturnValue({ limit });
    const gte = vi.fn().mockReturnValue({ order });
    const eqBucket = vi.fn().mockReturnValue({ gte });
    const eqUser = vi.fn().mockReturnValue({ eq: eqBucket });
    const select = vi.fn().mockReturnValue({ eq: eqUser });

    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null }) });
    const insert = insertFn.mockResolvedValue({ data: null });

    const from = vi.fn().mockReturnValue({ select, update, insert });
    return { from } as any;
  }

  it('allows when no existing record', async () => {
    const client = makeMockClient(null);
    const result = await checkAndIncrementLimit(client, 'user-1', 'coach_stream');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('allows when under the limit', async () => {
    const client = makeMockClient({ id: 'row-1', count: 5, window_start: new Date().toISOString() });
    const result = await checkAndIncrementLimit(client, 'user-1', 'coach_stream');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(LIMITS.coach_stream.max - 6);
  });

  it('blocks when at the limit', async () => {
    const max = LIMITS.coach_stream.max;
    const client = makeMockClient({ id: 'row-1', count: max, window_start: new Date().toISOString() });
    const result = await checkAndIncrementLimit(client, 'user-1', 'coach_stream');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('allows unknown bucket (bypass)', async () => {
    const client = makeMockClient(null);
    const result = await checkAndIncrementLimit(client, 'user-1', 'unknown_bucket');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99999);
  });
});
