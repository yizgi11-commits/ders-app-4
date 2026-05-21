// ─────────────────────────────────────────
// Gamification types
// ─────────────────────────────────────────

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Achievement {
  id:          string
  title:       string
  desc:        string
  icon:        string          // emoji
  xpReward:    number
  rarity:      AchievementRarity
  category:    'pomodoro' | 'streak' | 'task' | 'xp' | 'focus' | 'special'
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
  pomodoroHour:          number | null  // hour of last pomodoro (for early bird / night owl)
}

/** DB row shape */
export interface UserAchievement {
  id:           string
  user_id:      string
  achievement_id: string
  unlocked_at:  string
  xp_rewarded:  number
}

/** DB row shape */
export interface DailyGoal {
  id:                   string
  user_id:              string
  date:                 string
  focus_minutes_goal:   number
  pomodoro_goal:        number
  tasks_goal:           number
  created_at:           string
}

/** Event emitted to the GamificationProvider */
export type GamEvent =
  | { type: 'achievement'; achievement: Achievement }
  | { type: 'level_up';   level: number }

/** What the API routes return about gamification */
export interface GamificationResult {
  unlockedAchievements: Array<{ id: string; xpRewarded: number }>
}
