// ── Core per-day stats ──────────────────────────────────────────────

export interface DailyFocusStat {
  date: string              // "YYYY-MM-DD"
  focus_minutes: number
  sessions_completed: number
}

export interface DailyTaskStat {
  date: string
  total: number
  completed: number
  xp_earned: number
  completion_rate: number   // 0-100
}

export interface DailyXPStat {
  date: string
  xp: number                // total XP earned that day (tasks + pomodoro)
}

// ── Aggregated stats ───────────────────────────────────────────────

export interface SubjectStat {
  subject: string
  total: number
  completed: number
  completion_rate: number   // 0-100
  xp_earned: number
}

export interface PomodoroStat {
  total_completed: number
  total_interrupted: number
  total_focus_minutes: number
  completion_rate: number   // 0-100
  current_streak: number
  longest_streak: number
}

export interface WeeklyComparison {
  this_week_minutes: number
  last_week_minutes: number
  minutes_change_pct: number
  this_week_tasks: number
  last_week_tasks: number
  tasks_change_pct: number
  this_week_xp: number
  last_week_xp: number
  xp_change_pct: number
}

// ── Productivity score ─────────────────────────────────────────────

export interface ProductivityScore {
  total: number             // 0-100
  consistency: number       // 0-100 — streak / 7 days
  task_completion: number   // 0-100 — avg completion rate last 7 days
  focus_time: number        // 0-100 — avg focus mins / 120 min target
  xp_growth: number         // 0-100 — xp in last 7 days vs weekly xp target
}

// ── Insights ───────────────────────────────────────────────────────

export type InsightType = 'positive' | 'warning' | 'neutral' | 'achievement'

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  emoji: string
}

// ── Master analytics payload ───────────────────────────────────────

export interface AnalyticsData {
  // User state
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number

  // Time series (last 30 days)
  dailyFocus: DailyFocusStat[]
  dailyTasks: DailyTaskStat[]
  dailyXP:    DailyXPStat[]

  // Aggregated
  subjectStats:  SubjectStat[]
  pomodoroStats: PomodoroStat

  // Derived
  weeklyComparison:  WeeklyComparison
  productivityScore: ProductivityScore
  insights:          Insight[]
  mostProductiveDay: string | null   // "Salı", "Çarşamba" etc.
  bestStreak:        number
}
