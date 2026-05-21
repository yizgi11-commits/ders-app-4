// ─────────────────────────────────────────────────────────────────
// AI Study Coach — shared types
// ─────────────────────────────────────────────────────────────────

export type InsightType = 'positive' | 'warning' | 'tip' | 'neutral'

export interface Insight {
  type:    InsightType
  icon:    string        // emoji
  text:    string        // Turkish, personalized
  metric?: string        // e.g. "+22%", "3 gün"
}

export interface DailyCoachData {
  insights:     Insight[]   // 3–5 insights
  motivation:   string      // single motivational sentence
  greeting:     string      // personalized greeting line
  generated_at: string      // ISO string
}

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

export interface Recommendations {
  difficulty_adjustment: 'increase' | 'decrease' | 'maintain'
  difficulty_reason:     string
  optimal_session_mins:  number    // recommended Pomodoro duration
  break_tip:             string
  focus_tip:             string
  workload_tip:          string
  generated_at:          string
}

// ─── DB row ──────────────────────────────────────────────────────
export interface AIInsightRow {
  id:           string
  user_id:      string
  insight_type: 'daily' | 'weekly' | 'recommendations'
  cache_key:    string           // date "YYYY-MM-DD" or week "YYYY-Www"
  content:      DailyCoachData | WeeklyReport | Recommendations
  generated_at: string
}

// ─── Stats snapshot passed to AI ────────────────────────────────
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
