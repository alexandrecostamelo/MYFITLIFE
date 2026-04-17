export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type Goal =
  | 'lose_fat'
  | 'gain_muscle'
  | 'maintain'
  | 'general_health'
  | 'performance';

export type Sex = 'male' | 'female';

export interface TargetsInput {
  age: number;
  weight_kg: number;
  height_cm: number;
  sex?: Sex;
  goal: Goal;
  activity_level?: ActivityLevel;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  water_ml: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_fat: -400,
  gain_muscle: 300,
  maintain: 0,
  general_health: 0,
  performance: 200,
};

export function calculateBMR(input: {
  age: number;
  weight_kg: number;
  height_cm: number;
  sex?: Sex;
}): number {
  const base = 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age;
  if (input.sex === 'female') return Math.round(base - 161);
  return Math.round(base + 5);
}

export function calculateTargets(input: TargetsInput): NutritionTargets {
  const bmr = calculateBMR(input);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activity_level ?? 'moderate'];
  const tdee = Math.round(bmr * multiplier);
  const calories = Math.max(1200, tdee + GOAL_ADJUSTMENTS[input.goal]);

  const proteinMultiplier =
    input.goal === 'gain_muscle' ? 2.0 : input.goal === 'lose_fat' ? 2.2 : 1.8;
  const protein_g = Math.round(input.weight_kg * proteinMultiplier);

  const fats_g = Math.round((calories * 0.25) / 9);

  const carbs_g = Math.max(
    50,
    Math.round((calories - protein_g * 4 - fats_g * 9) / 4)
  );

  const water_ml = Math.round(input.weight_kg * 35);

  return { bmr, tdee, calories, protein_g, carbs_g, fats_g, water_ml };
}

export function caloriesFromMacros(
  protein_g: number,
  carbs_g: number,
  fats_g: number
): number {
  return Math.round(protein_g * 4 + carbs_g * 4 + fats_g * 9);
}
