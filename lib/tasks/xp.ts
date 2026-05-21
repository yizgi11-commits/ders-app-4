import type { Difficulty } from "./types";

// ─────────────────────────────────────────
// XP thresholds per level
// Level N requires N * 500 cumulative XP
// ─────────────────────────────────────────
export function xpForLevel(level: number): number {
  return level * 500;
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  let threshold = xpForLevel(level);
  while (totalXp >= threshold) {
    level++;
    threshold += xpForLevel(level);
  }
  return level - 1 || 1;
}

// ─────────────────────────────────────────
// XP for the current level progress bar
// Returns { current, required }
// ─────────────────────────────────────────
export function xpProgress(totalXp: number): { current: number; required: number } {
  const level = levelFromTotalXp(totalXp);
  // XP consumed by previous levels
  let consumed = 0;
  for (let l = 1; l < level; l++) consumed += xpForLevel(l);
  return {
    current: totalXp - consumed,
    required: xpForLevel(level),
  };
}

// ─────────────────────────────────────────
// Bonus XP for completing all 3 daily tasks
// ─────────────────────────────────────────
export const ALL_TASKS_BONUS = 50;

// ─────────────────────────────────────────
// Streak bonus: +5 XP per streak day, max 50
// ─────────────────────────────────────────
export function streakBonus(currentStreak: number): number {
  return Math.min(currentStreak * 5, 50);
}
