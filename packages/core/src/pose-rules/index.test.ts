import { describe, it, expect } from 'vitest';
import { analyzeSquat, analyzePushUp, analyzePlank, angle, countRep, LM } from './index';

function makeLandmarks(overrides: Record<number, [number, number, number]> = {}) {
  const base: any[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  for (const [idx, [x, y, z]] of Object.entries(overrides)) {
    base[Number(idx)] = { x, y, z, visibility: 1 };
  }
  return base;
}

describe('angle', () => {
  it('retorna 180 para pontos colineares', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 0, z: 0 };
    const c = { x: 2, y: 0, z: 0 };
    expect(angle(a, b, c)).toBeCloseTo(180, 0);
  });

  it('retorna 90 para perpendicular', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 0, z: 0 };
    const c = { x: 1, y: 1, z: 0 };
    expect(angle(a, b, c)).toBeCloseTo(90, 0);
  });

  it('retorna 180 quando magnitudes são zero', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 0, y: 0, z: 0 };
    expect(angle(a, b, c)).toBe(180);
  });
});

describe('analyzeSquat', () => {
  it('detecta fase up quando joelhos estendidos', () => {
    const lm = makeLandmarks({
      [LM.L_HIP]: [0.4, 0.3, 0], [LM.R_HIP]: [0.6, 0.3, 0],
      [LM.L_KNEE]: [0.4, 0.6, 0], [LM.R_KNEE]: [0.6, 0.6, 0],
      [LM.L_ANKLE]: [0.4, 0.9, 0], [LM.R_ANKLE]: [0.6, 0.9, 0],
      [LM.L_SHOULDER]: [0.4, 0.1, 0], [LM.R_SHOULDER]: [0.6, 0.1, 0],
    });
    const r = analyzeSquat(lm);
    expect(r.phase).toBe('up');
  });

  it('score é 100 na posição de pé', () => {
    const lm = makeLandmarks({
      [LM.L_HIP]: [0.4, 0.3, 0], [LM.R_HIP]: [0.6, 0.3, 0],
      [LM.L_KNEE]: [0.4, 0.6, 0], [LM.R_KNEE]: [0.6, 0.6, 0],
      [LM.L_ANKLE]: [0.4, 0.9, 0], [LM.R_ANKLE]: [0.6, 0.9, 0],
      [LM.L_SHOULDER]: [0.4, 0.1, 0], [LM.R_SHOULDER]: [0.6, 0.1, 0],
    });
    const r = analyzeSquat(lm);
    expect(r.score).toBe(100);
  });

  it('penaliza quando desce pouco (fase down, quadril acima do joelho)', () => {
    // Knee bent to ~83° (down phase) with hip above knee level → triggers "desça mais" cue
    const lm = makeLandmarks({
      [LM.L_HIP]: [0.4, 0.5, 0], [LM.R_HIP]: [0.6, 0.5, 0],
      [LM.L_KNEE]: [0.55, 0.6, 0], [LM.R_KNEE]: [0.65, 0.6, 0],
      [LM.L_ANKLE]: [0.4, 0.9, 0], [LM.R_ANKLE]: [0.6, 0.9, 0],
      [LM.L_SHOULDER]: [0.4, 0.2, 0], [LM.R_SHOULDER]: [0.6, 0.2, 0],
    });
    const r = analyzeSquat(lm);
    expect(r.score).toBeLessThan(100);
  });

  it('score nunca é negativo', () => {
    const lm = makeLandmarks({
      [LM.L_HIP]: [0.6, 0.45, 0], [LM.R_HIP]: [0.4, 0.45, 0],
      [LM.L_KNEE]: [0.6, 0.55, 0], [LM.R_KNEE]: [0.3, 0.6, 0],
      [LM.L_ANKLE]: [0.6, 0.9, 0], [LM.R_ANKLE]: [0.4, 0.9, 0],
      [LM.L_SHOULDER]: [0.6, 0.1, 0], [LM.R_SHOULDER]: [0.4, 0.1, 0],
    });
    const r = analyzeSquat(lm);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

describe('analyzePushUp', () => {
  it('retorna score e cues', () => {
    const lm = makeLandmarks();
    const r = analyzePushUp(lm);
    expect(typeof r.score).toBe('number');
    expect(Array.isArray(r.cues)).toBe(true);
  });
});

describe('analyzePlank', () => {
  it('retorna phase transition sempre', () => {
    const lm = makeLandmarks();
    const r = analyzePlank(lm);
    expect(r.phase).toBe('transition');
  });
});

describe('countRep', () => {
  it('conta repetição na transição down -> up', () => {
    expect(countRep('up', 'down')).toBe(true);
  });

  it('não conta se manteve up', () => {
    expect(countRep('up', 'up')).toBe(false);
  });

  it('não conta se desceu (up -> down)', () => {
    expect(countRep('down', 'up')).toBe(false);
  });

  it('não conta em transition', () => {
    expect(countRep('transition', 'down')).toBe(false);
  });
});
