import { describe, it, expect } from 'vitest';
import { matchExerciseMuscles, computeActivation, normalizeActivation, MUSCLE_LABELS } from './index';

describe('matchExerciseMuscles', () => {
  it('mapeia supino reto corretamente', () => {
    const r = matchExerciseMuscles('Supino reto');
    expect(r.primary).toContain('chest');
    expect(r.secondary).toContain('triceps');
  });

  it('mapeia agachamento corretamente', () => {
    const r = matchExerciseMuscles('Agachamento livre');
    expect(r.primary).toContain('quads');
    expect(r.primary).toContain('glutes');
  });

  it('mapeia por keywords quando nome exato não existe', () => {
    const r = matchExerciseMuscles('Rosca scott com barra W');
    expect(r.primary).toContain('biceps');
  });

  it('mapeia puxada por trás', () => {
    const r = matchExerciseMuscles('Puxada alta pegada aberta');
    expect(r.primary).toContain('lats');
  });

  it('retorna array vazio pra exercício desconhecido', () => {
    const r = matchExerciseMuscles('xpto abc 123 inexistente');
    expect(r.primary).toEqual([]);
  });

  it('é case insensitive e aceita acentos', () => {
    expect(matchExerciseMuscles('ABDOMINAL').primary).toContain('abs');
  });

  it('mapeia prancha', () => {
    const r = matchExerciseMuscles('Prancha abdominal');
    expect(r.primary).toContain('abs');
  });

  it('mapeia corrida', () => {
    const r = matchExerciseMuscles('Corrida na esteira');
    expect(r.primary).toContain('quads');
    expect(r.primary).toContain('hamstrings');
  });

  it('mapeia levantamento terra', () => {
    const r = matchExerciseMuscles('Levantamento terra convencional');
    expect(r.primary).toContain('hamstrings');
    expect(r.primary).toContain('lower_back');
  });
});

describe('computeActivation', () => {
  it('acumula volume corretamente', () => {
    const activation = computeActivation([
      { name: 'Supino reto', sets: 4, reps: 10 },
      { name: 'Flexão', sets: 3, reps: 12 },
    ]);
    expect(activation.chest).toBeGreaterThan(0);
    expect(activation.triceps).toBeGreaterThan(0);
  });

  it('secundários recebem 40% do volume', () => {
    const activation = computeActivation([{ name: 'Supino reto', sets: 4, reps: 10 }]);
    const chest = activation.chest ?? 0;
    const triceps = activation.triceps ?? 0;
    expect(chest).toBeGreaterThan(0);
    const ratio = triceps / chest;
    expect(ratio).toBeCloseTo(0.4, 1);
  });

  it('lista vazia retorna objeto vazio', () => {
    expect(computeActivation([])).toEqual({});
  });

  it('usa defaults de sets=1, reps=10 quando não fornecidos', () => {
    const a1 = computeActivation([{ name: 'Supino reto' }]);
    const a2 = computeActivation([{ name: 'Supino reto', sets: 1, reps: 10 }]);
    expect(a1.chest).toBe(a2.chest);
  });
});

describe('normalizeActivation', () => {
  it('normaliza entre 0 e 1 com o máximo em 1', () => {
    const r = normalizeActivation({ chest: 100, triceps: 50, biceps: 25 });
    expect(r.chest).toBe(1);
    expect(r.triceps).toBe(0.5);
    expect(r.biceps).toBe(0.25);
  });

  it('objeto vazio retorna vazio', () => {
    expect(normalizeActivation({})).toEqual({});
  });

  it('todos zero retorna vazio', () => {
    expect(normalizeActivation({ chest: 0, biceps: 0 })).toEqual({});
  });
});

describe('MUSCLE_LABELS', () => {
  it('todos os labels em português não estão vazios', () => {
    const labels = Object.values(MUSCLE_LABELS);
    labels.forEach((l) => expect(l.length).toBeGreaterThan(2));
  });

  it('tem 17 grupos musculares', () => {
    expect(Object.keys(MUSCLE_LABELS)).toHaveLength(17);
  });
});
