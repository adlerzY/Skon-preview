export interface LevelInfo {
  level: number;
  title: string;
  currentCount: number;
  countForCurrentLevel: number;
  countForNextLevel: number | null;
  progressPercent: number;
}

const LEVEL_TITLES = ["تازه‌وارد", "بازیکن", "جنگجو", "قهرمان", "استاد", "افسانه"];
const LEVEL_THRESHOLDS = [0, 1, 3, 7, 15, 30];

export function computeLevel(successfulOrdersCount: number): LevelInfo {
  let levelIndex = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (successfulOrdersCount >= LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }

  const countForCurrentLevel = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? null;

  const progressPercent = nextThreshold
    ? Math.min(100, ((successfulOrdersCount - countForCurrentLevel) / (nextThreshold - countForCurrentLevel)) * 100)
    : 100;

  return {
    level: levelIndex + 1,
    title: LEVEL_TITLES[levelIndex],
    currentCount: successfulOrdersCount,
    countForCurrentLevel,
    countForNextLevel: nextThreshold,
    progressPercent,
  };
}