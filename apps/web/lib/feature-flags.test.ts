import { describe, it, expect, vi } from 'vitest';
import { isFlagEnabled, getAllFlagsForUser } from './feature-flags';

function makeMockClient(flagData: any | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: flagData });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as any;
}

function makeListMockClient(flagsArray: any[]) {
  const select = vi.fn().mockResolvedValue({ data: flagsArray });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as any;
}

describe('isFlagEnabled', () => {
  it('returns false when flag not found', async () => {
    const client = makeMockClient(null);
    expect(await isFlagEnabled(client, 'nonexistent')).toBe(false);
  });

  it('returns false when flag is disabled', async () => {
    const client = makeMockClient({ enabled: false, rollout_pct: 100, target_user_ids: [] });
    expect(await isFlagEnabled(client, 'my_flag')).toBe(false);
  });

  it('returns true when rollout is 100%', async () => {
    const client = makeMockClient({ enabled: true, rollout_pct: 100, target_user_ids: [] });
    expect(await isFlagEnabled(client, 'my_flag', 'user-123')).toBe(true);
  });

  it('returns false when rollout is 0%', async () => {
    const client = makeMockClient({ enabled: true, rollout_pct: 0, target_user_ids: [] });
    expect(await isFlagEnabled(client, 'my_flag', 'user-123')).toBe(false);
  });

  it('returns true for target_user_ids override even at 0% rollout', async () => {
    const client = makeMockClient({
      enabled: true,
      rollout_pct: 0,
      target_user_ids: ['special-user'],
    });
    expect(await isFlagEnabled(client, 'my_flag', 'special-user')).toBe(true);
  });

  it('rollout hash is stable for same user+flag', async () => {
    // Test that the same user gets consistent results
    // We test this by calling multiple times with a fixed rollout_pct
    const client = makeMockClient({ enabled: true, rollout_pct: 50, target_user_ids: [] });
    const r1 = await isFlagEnabled(client, 'beta_feature', 'user-abc');
    const r2 = await isFlagEnabled(client, 'beta_feature', 'user-abc');
    expect(r1).toBe(r2);
  });
});

describe('getAllFlagsForUser', () => {
  it('returns empty object when no flags', async () => {
    const client = makeListMockClient([]);
    const result = await getAllFlagsForUser(client, 'user-1');
    expect(result).toEqual({});
  });

  it('returns false for disabled flags', async () => {
    const client = makeListMockClient([
      { key: 'flag_a', enabled: false, rollout_pct: 100, target_user_ids: [] },
    ]);
    const result = await getAllFlagsForUser(client, 'user-1');
    expect(result.flag_a).toBe(false);
  });

  it('returns true for 100% rollout enabled flag', async () => {
    const client = makeListMockClient([
      { key: 'flag_b', enabled: true, rollout_pct: 100, target_user_ids: [] },
    ]);
    const result = await getAllFlagsForUser(client, 'user-1');
    expect(result.flag_b).toBe(true);
  });

  it('handles null data gracefully', async () => {
    const select = vi.fn().mockResolvedValue({ data: null });
    const from = vi.fn().mockReturnValue({ select });
    const client = { from } as any;
    const result = await getAllFlagsForUser(client, 'user-1');
    expect(result).toEqual({});
  });
});
