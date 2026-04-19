import { describe, it, expect } from 'vitest';
import { BIOMARKER_REFERENCES, findReferenceByKey, matchMarkerKey, classifyValue } from './references';

describe('BIOMARKER_REFERENCES', () => {
  it('has at least 20 entries', () => {
    expect(BIOMARKER_REFERENCES.length).toBeGreaterThanOrEqual(20);
  });

  it('each entry has required fields', () => {
    for (const ref of BIOMARKER_REFERENCES) {
      expect(ref.key).toBeTruthy();
      expect(ref.name).toBeTruthy();
      expect(ref.unit).toBeTruthy();
    }
  });
});

describe('findReferenceByKey', () => {
  it('finds glucose_fasting', () => {
    const ref = findReferenceByKey('glucose_fasting');
    expect(ref).not.toBeNull();
    expect(ref!.unit).toBe('mg/dL');
  });

  it('returns null for unknown key', () => {
    expect(findReferenceByKey('nonexistent_key')).toBeNull();
  });

  it('finds vitamin_d', () => {
    const ref = findReferenceByKey('vitamin_d');
    expect(ref).not.toBeNull();
    expect(ref!.min).toBe(30);
  });
});

describe('matchMarkerKey', () => {
  it('matches glucose by alias', () => {
    expect(matchMarkerKey('glicemia')).toBe('glucose_fasting');
  });

  it('matches colesterol total', () => {
    expect(matchMarkerKey('colesterol total')).toBe('total_cholesterol');
  });

  it('matches TSH case-insensitively', () => {
    expect(matchMarkerKey('TSH')).toBe('tsh');
  });

  it('matches with accented characters', () => {
    expect(matchMarkerKey('Vitamina D')).toBe('vitamin_d');
  });

  it('returns null for unrecognized name', () => {
    expect(matchMarkerKey('biomarcador_desconhecido_xyz')).toBeNull();
  });
});

describe('classifyValue', () => {
  const glucose = findReferenceByKey('glucose_fasting')!; // min:70 max:99 critical_min:50 critical_max:200

  it('classifies normal glucose', () => {
    expect(classifyValue(85, glucose)).toBe('normal');
  });

  it('classifies low glucose', () => {
    expect(classifyValue(65, glucose)).toBe('low');
  });

  it('classifies high glucose', () => {
    expect(classifyValue(110, glucose)).toBe('high');
  });

  it('classifies critical_low glucose', () => {
    expect(classifyValue(40, glucose)).toBe('critical_low');
  });

  it('classifies critical_high glucose', () => {
    expect(classifyValue(250, glucose)).toBe('critical_high');
  });

  it('classifies HDL (only min bound)', () => {
    const hdl = findReferenceByKey('hdl')!; // min:40
    expect(classifyValue(50, hdl)).toBe('normal');
    expect(classifyValue(30, hdl)).toBe('low');
  });
});
