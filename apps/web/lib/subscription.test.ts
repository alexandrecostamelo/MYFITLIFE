import { describe, it, expect } from 'vitest';
import { requiresFeature, getFeatureLimit, getPlanLabel } from './subscription';
import type { AccessContext } from './subscription';

describe('requiresFeature', () => {
  it('free plan has ai_coach', () => {
    const ctx: AccessContext = { plan: 'free', userId: 'u1' };
    expect(requiresFeature(ctx, 'ai_coach')).toBe(true);
  });

  it('free plan does NOT have ai_coach_stream', () => {
    const ctx: AccessContext = { plan: 'free', userId: 'u1' };
    expect(requiresFeature(ctx, 'ai_coach_stream')).toBe(false);
  });

  it('pro plan has ai_coach_stream', () => {
    const ctx: AccessContext = { plan: 'pro', userId: 'u1' };
    expect(requiresFeature(ctx, 'ai_coach_stream')).toBe(true);
  });

  it('pro plan has lab_upload', () => {
    const ctx: AccessContext = { plan: 'pro', userId: 'u1' };
    expect(requiresFeature(ctx, 'lab_upload')).toBe(true);
  });

  it('free plan does NOT have lab_upload', () => {
    const ctx: AccessContext = { plan: 'free', userId: 'u1' };
    expect(requiresFeature(ctx, 'lab_upload')).toBe(false);
  });

  it('elite plan has all features', () => {
    const ctx: AccessContext = { plan: 'elite', userId: 'u1' };
    expect(requiresFeature(ctx, 'proactive_coach')).toBe(true);
    expect(requiresFeature(ctx, 'progress_photos')).toBe(true);
    expect(requiresFeature(ctx, 'advanced_gamification')).toBe(true);
  });
});

describe('getFeatureLimit', () => {
  it('free plan has 5 ai messages per day', () => {
    const ctx: AccessContext = { plan: 'free', userId: 'u1' };
    expect(getFeatureLimit(ctx, 'ai_messages_per_day')).toBe(5);
  });

  it('pro plan has 30 ai messages per day', () => {
    const ctx: AccessContext = { plan: 'pro', userId: 'u1' };
    expect(getFeatureLimit(ctx, 'ai_messages_per_day')).toBe(30);
  });

  it('elite plan has 100 ai messages per day', () => {
    const ctx: AccessContext = { plan: 'elite', userId: 'u1' };
    expect(getFeatureLimit(ctx, 'ai_messages_per_day')).toBe(100);
  });

  it('free plan has 0 lab uploads per day', () => {
    const ctx: AccessContext = { plan: 'free', userId: 'u1' };
    expect(getFeatureLimit(ctx, 'lab_uploads_per_day')).toBe(0);
  });

  it('returns 0 for unknown limit key', () => {
    const ctx: AccessContext = { plan: 'pro', userId: 'u1' };
    expect(getFeatureLimit(ctx, 'nonexistent_limit')).toBe(0);
  });
});

describe('getPlanLabel', () => {
  it('returns Portuguese labels', () => {
    expect(getPlanLabel('free')).toBe('Gratuito');
    expect(getPlanLabel('pro')).toBe('Pro');
    expect(getPlanLabel('elite')).toBe('Elite');
  });
});
