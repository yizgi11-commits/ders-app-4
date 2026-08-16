// ─────────────────────────────────────────────────────────────────
// AI Study Coach — shared types
// ─────────────────────────────────────────────────────────────────

export interface WeeklyReport {
  summary:              string      // 2–3 sentence summary
  productivity_trend:   'improving' | 'stable' | 'declining'
  highlights:           string[]    // 2–3 positive highlights
  concerns:             string[]    // 1–2 areas to improve
  strongest_subject:    string | null
  weakest_subject:      string | null
  streak_analysis:      string
  next_week_focus:      string      // one actionable focus
  recommendations:      string[]    // 2–3 specific recommendations
  generated_at:         string
}

// ─── Stats snapshot used by collect-stats.ts / smart-weekly.ts ────
export interface UserStatsForAI {
  // XP & Level
  totalXp:          number
  level:            number
  todayXp:          number

  // Streak
  currentStreak:    number
  longestStreak:    number

  // Focus (last 7 days)
  weekFocusMinutes: number
  todayFocusMinutes: number
  avgDailyFocus:    number       // minutes per active day
  focusTrend:       number       // % change vs prev week (positive = better)

  // Sessions
  weekSessions:     number
  totalSessions:    number

  // Tasks
  weekTasksDone:    number
  taskCompletionRate: number     // 0–100

  // Time patterns (0–23 hour buckets, top hours)
  peakHours:        number[]     // e.g. [19, 20, 21]

  // Subjects (from task_templates)
  subjectStats:     Array<{ subject: string; tasksCompleted: number; avgXp: number }>

  // Recent activity (last 3 days)
  recentDays:       Array<{ date: string; focusMinutes: number; sessions: number }>

  // Prev week comparison
  prevWeekFocusMinutes: number
  prevWeekSessions: number
}
