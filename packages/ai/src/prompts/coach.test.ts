import { describe, it, expect } from 'vitest';
import { COACH_SYSTEM, buildCoachContext } from './coach';

describe('COACH_SYSTEM', () => {
  it('is a non-empty string', () => {
    expect(typeof COACH_SYSTEM).toBe('string');
    expect(COACH_SYSTEM.length).toBeGreaterThan(50);
  });

  it('is in Brazilian Portuguese', () => {
    expect(COACH_SYSTEM).toContain('português');
  });

  it('contains safety rules', () => {
    expect(COACH_SYSTEM).toMatch(/diagnóstico|profissional/i);
  });

  it('mentions mental health handling', () => {
    expect(COACH_SYSTEM).toMatch(/depressão|suicídio|transtorno/i);
  });
});

describe('buildCoachContext', () => {
  const base = {
    userName: 'João',
    goal: 'Hipertrofia',
    level: 'intermediário',
    streak: 7,
    userLevel: 3,
    recentCheckin: null,
  };

  it('includes user name', () => {
    const ctx = buildCoachContext(base);
    expect(ctx).toContain('João');
  });

  it('includes goal', () => {
    const ctx = buildCoachContext(base);
    expect(ctx).toContain('Hipertrofia');
  });

  it('includes streak', () => {
    const ctx = buildCoachContext(base);
    expect(ctx).toContain('7');
  });

  it('shows no checkin when null', () => {
    const ctx = buildCoachContext(base);
    expect(ctx).toContain('Sem check-in');
  });

  it('includes checkin data when provided', () => {
    const ctx = buildCoachContext({
      ...base,
      recentCheckin: { sleep_quality: 8, energy_level: 7, mood: 'animado' },
    });
    expect(ctx).toContain('sono 8/10');
    expect(ctx).toContain('energia 7/10');
    expect(ctx).toContain('animado');
  });

  it('appends extraContext when provided', () => {
    const ctx = buildCoachContext({ ...base, extraContext: '\nGinásio: BioFit' });
    expect(ctx).toContain('BioFit');
  });
});
