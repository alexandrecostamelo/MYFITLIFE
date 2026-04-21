export type Dimension = 'strength' | 'endurance' | 'flexibility' | 'consistency' | 'nutrition';

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
    if (level > 999) break;
  }
  return level;
}

export function xpToNextLevel(totalXp: number): { current: number; needed: number; progress: number } {
  const level = levelFromTotalXp(totalXp);
  const currentLevelBase = xpForLevel(level);
  const nextLevelBase = xpForLevel(level + 1);
  const current = totalXp - currentLevelBase;
  const needed = nextLevelBase - currentLevelBase;
  const progress = needed > 0 ? Math.min(100, Math.round((current / needed) * 100)) : 0;
  return { current, needed, progress };
}

export const XP_REWARDS = {
  WORKOUT_COMPLETED: { xp: 50, dimension: 'strength' as Dimension },
  SET_LOGGED: { xp: 5, dimension: 'strength' as Dimension },
  MEAL_LOGGED: { xp: 10, dimension: 'nutrition' as Dimension },
  MEAL_PHOTO: { xp: 15, dimension: 'nutrition' as Dimension },
  CHECKIN_DAILY: { xp: 20, dimension: 'consistency' as Dimension },
  WEIGHT_LOGGED: { xp: 10, dimension: 'consistency' as Dimension },
  STREAK_DAY: { xp: 10, dimension: 'consistency' as Dimension },
  TRAIL_DAY: { xp: 25, dimension: 'consistency' as Dimension },
  TRAIL_COMPLETED: { xp: 500, dimension: 'consistency' as Dimension },
  QUEST_COMPLETED: { xp: 30, dimension: 'consistency' as Dimension },
  ACHIEVEMENT_UNLOCKED: { xp: 0, dimension: null },
  EQUIPMENT_SCAN: { xp: 15, dimension: 'strength' as Dimension },
  GYM_CREATED: { xp: 25, dimension: 'consistency' as Dimension },
  PROGRESS_PHOTO: { xp: 20, dimension: 'consistency' as Dimension },
  CLASS_ATTENDED: { xp: 30, dimension: 'consistency' as Dimension },
} as const;

export type XpEvent = keyof typeof XP_REWARDS;

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = typeof a === 'string' ? new Date(a) : a;
  const db = typeof b === 'string' ? new Date(b) : b;
  const diff = Math.abs(db.getTime() - da.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeStreak(params: {
  currentStreak: number;
  lastActiveDate: string | null;
  todayDate: string;
  freezesUsedThisMonth: number;
  freezesResetMonth: string | null;
}): {
  newStreak: number;
  shouldResetFreezes: boolean;
  freezesUsedAfter: number;
  usedFreeze: boolean;
  streakBroken: boolean;
} {
  const currentMonth = params.todayDate.slice(0, 7);
  const shouldResetFreezes = params.freezesResetMonth !== currentMonth;
  let freezesUsedAfter = shouldResetFreezes ? 0 : params.freezesUsedThisMonth;

  if (!params.lastActiveDate) {
    return { newStreak: 1, shouldResetFreezes, freezesUsedAfter, usedFreeze: false, streakBroken: false };
  }

  const daysSince = daysBetween(params.lastActiveDate, params.todayDate);

  if (daysSince === 0) {
    return { newStreak: params.currentStreak, shouldResetFreezes, freezesUsedAfter, usedFreeze: false, streakBroken: false };
  }

  if (daysSince === 1) {
    return { newStreak: params.currentStreak + 1, shouldResetFreezes, freezesUsedAfter, usedFreeze: false, streakBroken: false };
  }

  const MAX_FREEZES = 2;
  const missedDays = daysSince - 1;

  if (missedDays <= MAX_FREEZES - freezesUsedAfter) {
    return { newStreak: params.currentStreak + 1, shouldResetFreezes, freezesUsedAfter: freezesUsedAfter + missedDays, usedFreeze: true, streakBroken: false };
  }

  return { newStreak: 1, shouldResetFreezes, freezesUsedAfter, usedFreeze: false, streakBroken: true };
}
