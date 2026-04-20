import type { MuscleKey } from '@myfitlife/core/muscles';

/**
 * Maps raw muscle name strings from the exercises table (English)
 * to MuscleKey used by the 3D body component.
 */
const DB_TO_MUSCLE_KEY: Record<string, MuscleKey> = {
  // Chest
  chest: 'chest',
  // Shoulders
  shoulders: 'shoulders_front',
  'front delts': 'shoulders_front',
  'lateral delts': 'shoulders_side',
  'rear delts': 'shoulders_rear',
  // Arms
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  // Back
  back: 'lats',
  lats: 'lats',
  rhomboids: 'traps',
  traps: 'traps',
  'upper traps': 'traps',
  'mid traps': 'traps',
  erectors: 'lower_back',
  'lower back': 'lower_back',
  // Core
  core: 'abs',
  abs: 'abs',
  obliques: 'obliques',
  // Lower
  gluteus: 'glutes',
  glutes: 'glutes',
  quadriceps: 'quads',
  quads: 'quads',
  hamstrings: 'hamstrings',
  adductors: 'adductors',
  calves: 'calves',
  // Full body maps to multiple
  'full body': 'quads',
};

export function dbMuscleToKey(raw: string): MuscleKey | null {
  const normalized = raw.toLowerCase().trim();
  return DB_TO_MUSCLE_KEY[normalized] || null;
}

export function resolveDbMuscles(groups: string[]): MuscleKey[] {
  const resolved = new Set<MuscleKey>();
  for (const g of groups || []) {
    const key = dbMuscleToKey(g);
    if (key) resolved.add(key);
  }
  return Array.from(resolved);
}
