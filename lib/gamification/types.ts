// ─────────────────────────────────────────
// Gamification types
// ─────────────────────────────────────────

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type AchievementCategory =
  | 'focus' | 'streak' | 'task' | 'xp' | 'recall' | 'planner' | 'special'

export interface Achievement {
  id:          string
  title:       string
  desc:        string
  icon:        string          // emoji
  xpReward:    number
  rarity:      AchievementRarity
  category:    AchievementCategory
  /** Check if the condition is met given current stats */
  condition:   (stats: UserStats) => boolean
}

/** Snapshot of a user's progress — used for achievement checking */
export interface UserStats {
  totalXp:               number
  level:                 number
  currentStreak:         number
  longestStreak:         number
  totalFocusMinutes:     number
  totalSessionsCompleted: number
  totalTasksCompleted:   number
  pomodoroHour:          number | null  // hour of last session (for early bird / night owl)
  totalRecalls:          number         // graded reviews in recall_reviews
  plannerDaysUsed:       number         // distinct days with a Planner-created task
  longestSessionMinutes: number         // longest single completed focus session
}

/** DB row shape */
export interface UserAchievement {
  id:           string
  user_id:      string
  achievement_id: string
  unlocked_at:  string
  xp_rewarded:  number
}

/** Event emitted to the GamificationProvider */
export type GamEvent =
  | { type: 'achievement'; achievement: Achievement }
  | { type: 'level_up';   level: number }

/** What the API routes return about gamification */
export interface GamificationResult {
  unlockedAchievements: Array<{ id: string; xpRewarded: number }>
}
