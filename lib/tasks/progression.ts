import type { Difficulty } from "./types";

// ─────────────────────────────────────────
// How many days of inactivity resets to easy
// ─────────────────────────────────────────
const INACTIVITY_RESET_DAYS = 3;

// ─────────────────────────────────────────
// daysBetween — how many days from dateA to today
// ─────────────────────────────────────────
function daysBetween(dateStr: string): number {
  const past = new Date(dateStr);
  const now = new Date();
  past.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────
// nextDifficulty
//   Called when generating tomorrow's tasks.
//
//   Rules:
//   1. User inactive ≥ INACTIVITY_RESET_DAYS → reset to 1
//   2. Completed all 3 tasks yesterday      → go up (max 3)
//   3. Completed 1–2 tasks                  → stay same
//   4. Completed 0 tasks                    → go down (min 1)
// ─────────────────────────────────────────
export function nextDifficulty({
  current,
  completedCount,   // how many tasks user finished today
  totalCount,       // should always be 3
  lastActiveDate,
}: {
  current: Difficulty;
  completedCount: number;
  totalCount: number;
  lastActiveDate: string | null;
}): Difficulty {
  // Rule 1 — inactivity reset
  if (lastActiveDate && daysBetween(lastActiveDate) >= INACTIVITY_RESET_DAYS) {
    return 1;
  }

  // Rule 2 — all done → harder
  if (completedCount === totalCount) {
    return Math.min(current + 1, 3) as Difficulty;
  }

  // Rule 4 — nothing done → easier
  if (completedCount === 0) {
    return Math.max(current - 1, 1) as Difficulty;
  }

  // Rule 3 — partial → same
  return current;
}

// ─────────────────────────────────────────
// updateStreak
//   Call after a task is completed.
//   Returns the new streak values.
// ─────────────────────────────────────────
export function updateStreak({
  currentStreak,
  longestStreak,
  lastStreakDate,
}: {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
}): { currentStreak: number; longestStreak: number } {
  const today = new Date().toISOString().split("T")[0];

  // Already counted today
  if (lastStreakDate === today) {
    return { currentStreak, longestStreak };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak =
    lastStreakDate === yesterdayStr
      ? currentStreak + 1  // continued streak
      : 1;                  // new streak or broken

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
  };
}
