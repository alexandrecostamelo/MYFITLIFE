import { describe, it, expect } from 'vitest';
import { phaseForDay, daysBetween, computeCurrentPhase, PHASE_LABELS, PHASE_DESCRIPTIONS } from './index';

describe('phaseForDay', () => {
  it('returns menstrual during period days', () => {
    expect(phaseForDay(1, 5, 28)).toBe('menstrual');
    expect(phaseForDay(5, 5, 28)).toBe('menstrual');
  });

  it('returns follicular after period and before ovulation window', () => {
    expect(phaseForDay(7, 5, 28)).toBe('follicular');
    expect(phaseForDay(10, 5, 28)).toBe('follicular');
  });

  it('returns ovulatory around day 14 of 28-day cycle', () => {
    // ovulationDay = 28 - 14 = 14, window = days 13-15
    expect(phaseForDay(13, 5, 28)).toBe('ovulatory');
    expect(phaseForDay(14, 5, 28)).toBe('ovulatory');
    expect(phaseForDay(15, 5, 28)).toBe('ovulatory');
  });

  it('returns luteal in second half after ovulation', () => {
    expect(phaseForDay(16, 5, 28)).toBe('luteal');
    expect(phaseForDay(25, 5, 28)).toBe('luteal');
  });
});

describe('daysBetween', () => {
  it('calculates positive difference', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
  });

  it('returns 0 for same date', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('accepts Date objects', () => {
    const a = new Date('2026-03-01');
    const b = new Date('2026-03-10');
    expect(daysBetween(a, b)).toBe(9);
  });
});

describe('computeCurrentPhase', () => {
  it('returns unknown when no lastPeriodStart', () => {
    const result = computeCurrentPhase({ lastPeriodStart: null, averageCycleLength: 28, averagePeriodLength: 5 });
    expect(result.phase).toBe('unknown');
    expect(result.dayInCycle).toBeNull();
    expect(result.daysUntilNext).toBeNull();
  });

  it('returns a valid phase for a recent period start', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    const result = computeCurrentPhase({
      lastPeriodStart: recent.toISOString().slice(0, 10),
      averageCycleLength: 28,
      averagePeriodLength: 5,
    });
    expect(['menstrual', 'follicular', 'ovulatory', 'luteal']).toContain(result.phase);
    expect(result.dayInCycle).toBeGreaterThanOrEqual(0);
  });

  it('returns daysUntilNext as a number', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    const result = computeCurrentPhase({
      lastPeriodStart: recent.toISOString().slice(0, 10),
      averageCycleLength: 28,
      averagePeriodLength: 5,
    });
    expect(typeof result.daysUntilNext).toBe('number');
  });
});

describe('PHASE_LABELS', () => {
  it('has all phases', () => {
    expect(PHASE_LABELS.menstrual).toBeTruthy();
    expect(PHASE_LABELS.follicular).toBeTruthy();
    expect(PHASE_LABELS.ovulatory).toBeTruthy();
    expect(PHASE_LABELS.luteal).toBeTruthy();
    expect(PHASE_LABELS.unknown).toBeTruthy();
  });
});

describe('PHASE_DESCRIPTIONS', () => {
  it('has descriptions in Portuguese', () => {
    expect(PHASE_DESCRIPTIONS.menstrual).toContain('Energia');
    expect(PHASE_DESCRIPTIONS.follicular).toContain('Energia');
  });
});
