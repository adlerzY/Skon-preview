export interface GamificationStats {
  successfulOrdersCount: number;
  reviewsCount: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number | null;
  progressPercent: number;
}

const LEVEL_TITLES = ["تازه‌وارد", "بازیکن", "جنگجو", "قهرمان", "استاد", "افسانه"];
const LEVEL_XP_THRESHOLDS = [0, 20, 50, 100, 200, 400];

const XP_PER_ORDER = 10;
const XP_PER_REVIEW = 10;
const FIRST_ORDER_BONUS = 20;
const FIRST_REVIEW_BONUS = 20;

export function computeXp(stats: GamificationStats): number {
  let xp = stats.successfulOrdersCount * XP_PER_ORDER + stats.reviewsCount * XP_PER_REVIEW;
  if (stats.successfulOrdersCount > 0) xp += FIRST_ORDER_BONUS;
  if (stats.reviewsCount > 0) xp += FIRST_REVIEW_BONUS;
  return xp;
}

export function computeLevel(stats: GamificationStats): LevelInfo {
  const xp = computeXp(stats);

  let levelIndex = 0;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }

  const xpForCurrentLevel = LEVEL_XP_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_XP_THRESHOLDS[levelIndex + 1] ?? null;

  const progressPercent = nextThreshold
    ? Math.min(100, ((xp - xpForCurrentLevel) / (nextThreshold - xpForCurrentLevel)) * 100)
    : 100;

  return {
    level: levelIndex + 1,
    title: LEVEL_TITLES[levelIndex],
    currentXp: xp,
    xpForCurrentLevel,
    xpForNextLevel: nextThreshold,
    progressPercent,
  };
}