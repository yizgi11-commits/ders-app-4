import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DailyFocusStat, DailyTaskStat, DailyXPStat,
  SubjectStat, PomodoroStat, AnalyticsData,
} from './types'
import { computeProductivityScore } from './productivity'
import { generateInsights }         from './insights'

// ── Date helpers ────────────────────────────────────────────────────
function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function dateRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => daysAgoStr(days - 1 - i))
}

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

// ── Main query ──────────────────────────────────────────────────────
export async function fetchAnalyticsData(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalyticsData> {
  const since30 = daysAgoStr(29)
  const since14 = daysAgoStr(13)

  // ── Parallel fetches ─────────────────────────────────────────────
  const [
    xpRes,
    streakRes,
    focusRes,
    tasksRes,
    pomodoroSessionsRes,
    statsRes,
  ] = await Promise.all([
    // 1. User XP
    supabase
      .from('user_xp')
      .select('total_xp, level')
      .eq('user_id', userId)
      .maybeSingle(),

    // 2. Streaks
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .maybeSingle(),

    // 3. Daily focus time — last 30 days
    supabase
      .from('daily_focus_time')
      .select('date, focus_minutes, sessions_completed')
      .eq('user_id', userId)
      .gte('date', since30)
      .order('date', { ascending: true }),

    // 4. Daily tasks with subject — last 30 days
    supabase
      .from('daily_tasks')
      .select('date, completed, xp_earned, task_templates(subject, difficulty)')
      .eq('user_id', userId)
      .gte('date', since30)
      .order('date', { ascending: true }),

    // 5. Pomodoro sessions — last 30 days
    supabase
      .from('pomodoro_sessions')
      .select('started_at, type, status, xp_earned, elapsed_seconds, duration_seconds')
      .eq('user_id', userId)
      .gte('started_at', since30 + 'T00:00:00')
      .order('started_at', { ascending: true }),

    // 6. Aggregate study statistics
    supabase
      .from('study_statistics')
      .select('total_focus_minutes, total_sessions_completed, total_sessions_interrupted, current_session_streak, longest_streak_sessions')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  // ── Extract raw data ─────────────────────────────────────────────
  const totalXP       = xpRes.data?.total_xp ?? 0
  const level         = xpRes.data?.level    ?? 1
  const currentStreak = streakRes.data?.current_streak  ?? 0
  const longestStreak = streakRes.data?.longest_streak  ?? 0

  const rawFocus: Array<{ date: string; focus_minutes: number; sessions_completed: number }> =
    focusRes.data ?? []

  const rawTasks: Array<{
    date: string
    completed: boolean
    xp_earned: number
    task_templates: { subject: string; difficulty: number } | null
  }> = (tasksRes.data as any[]) ?? []

  const rawSessions: Array<{
    started_at: string
    type: string
    status: string
    xp_earned: number
    elapsed_seconds: number
    duration_seconds: number
  }> = (pomodoroSessionsRes.data as any[]) ?? []

  const rawStats = statsRes.data

  // ── Build daily focus stats (fill zeros for missing days) ────────
  const focusMap = new Map(rawFocus.map(r => [r.date, r]))
  const dates30  = dateRange(30)

  const dailyFocus: DailyFocusStat[] = dates30.map(date => ({
    date,
    focus_minutes:      focusMap.get(date)?.focus_minutes      ?? 0,
    sessions_completed: focusMap.get(date)?.sessions_completed ?? 0,
  }))

  // ── Build daily task stats ────────────────────────────────────────
  const tasksByDate = new Map<string, { total: number; completed: number; xp: number }>()
  for (const t of rawTasks) {
    const entry = tasksByDate.get(t.date) ?? { total: 0, completed: 0, xp: 0 }
    entry.total += 1
    if (t.completed) { entry.completed += 1; entry.xp += t.xp_earned }
    tasksByDate.set(t.date, entry)
  }

  const dailyTasks: DailyTaskStat[] = dates30.map(date => {
    const e = tasksByDate.get(date)
    const total = e?.total ?? 0
    const completed = e?.completed ?? 0
    return {
      date,
      total,
      completed,
      xp_earned: e?.xp ?? 0,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  })

  // ── Build daily XP stats (tasks + pomodoro) ───────────────────────
  const pomodoroXpByDate = new Map<string, number>()
  for (const s of rawSessions) {
    if (s.status === 'completed' && s.type === 'focus') {
      const date = s.started_at.split('T')[0]
      pomodoroXpByDate.set(date, (pomodoroXpByDate.get(date) ?? 0) + s.xp_earned)
    }
  }

  const dailyXP: DailyXPStat[] = dates30.map(date => ({
    date,
    xp: (tasksByDate.get(date)?.xp ?? 0) + (pomodoroXpByDate.get(date) ?? 0),
  }))

  // ── Subject distribution ──────────────────────────────────────────
  const subjectMap = new Map<string, { total: number; completed: number; xp: number }>()
  for (const t of rawTasks) {
    const subj = t.task_templates?.subject ?? 'Diğer'
    const entry = subjectMap.get(subj) ?? { total: 0, completed: 0, xp: 0 }
    entry.total += 1
    if (t.completed) { entry.completed += 1; entry.xp += t.xp_earned }
    subjectMap.set(subj, entry)
  }

  const subjectStats: SubjectStat[] = Array.from(subjectMap.entries())
    .map(([subject, e]) => ({
      subject,
      total: e.total,
      completed: e.completed,
      completion_rate: e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0,
      xp_earned: e.xp,
    }))
    .sort((a, b) => b.total - a.total)

  // ── Pomodoro stats ────────────────────────────────────────────────
  const totalCompleted    = rawStats?.total_sessions_completed    ?? 0
  const totalInterrupted  = rawStats?.total_sessions_interrupted  ?? 0
  const totalFocusMinutes = rawStats?.total_focus_minutes         ?? 0
  const sessionTotal      = totalCompleted + totalInterrupted
  const completionRate    = sessionTotal > 0
    ? Math.round((totalCompleted / sessionTotal) * 100) : 0

  const pomodoroStats: PomodoroStat = {
    total_completed:   totalCompleted,
    total_interrupted: totalInterrupted,
    total_focus_minutes: totalFocusMinutes,
    completion_rate:   completionRate,
    current_streak:    rawStats?.current_session_streak  ?? 0,
    longest_streak:    rawStats?.longest_streak_sessions ?? 0,
  }

  // ── Weekly comparison (last 7 vs previous 7 days) ─────────────────
  const this7  = dates30.slice(-7)
  const last7  = dates30.slice(-14, -7)

  function sumFocus(days: string[]) {
    return days.reduce((s, d) => s + (focusMap.get(d)?.focus_minutes ?? 0), 0)
  }
  function sumTasksDone(days: string[]) {
    return days.reduce((s, d) => s + (tasksByDate.get(d)?.completed ?? 0), 0)
  }
  function sumXP(days: string[]) {
    return days.reduce((s, d) => {
      const taskXP = tasksByDate.get(d)?.xp ?? 0
      const pomXP  = pomodoroXpByDate.get(d) ?? 0
      return s + taskXP + pomXP
    }, 0)
  }
  function changePct(current: number, prev: number) {
    if (prev === 0) return current > 0 ? 100 : 0
    return Math.round(((current - prev) / prev) * 100)
  }

  const thisWeekMinutes = sumFocus(this7)
  const lastWeekMinutes = sumFocus(last7)
  const thisWeekTasks   = sumTasksDone(this7)
  const lastWeekTasks   = sumTasksDone(last7)
  const thisWeekXP      = sumXP(this7)
  const lastWeekXP      = sumXP(last7)

  const weeklyComparison = {
    this_week_minutes:  thisWeekMinutes,
    last_week_minutes:  lastWeekMinutes,
    minutes_change_pct: changePct(thisWeekMinutes, lastWeekMinutes),
    this_week_tasks:    thisWeekTasks,
    last_week_tasks:    lastWeekTasks,
    tasks_change_pct:   changePct(thisWeekTasks, lastWeekTasks),
    this_week_xp:       thisWeekXP,
    last_week_xp:       lastWeekXP,
    xp_change_pct:      changePct(thisWeekXP, lastWeekXP),
  }

  // ── Most productive day of week ───────────────────────────────────
  const dayTotals = Array(7).fill(0)
  const dayCounts = Array(7).fill(0)
  for (const stat of dailyFocus) {
    const dow = new Date(stat.date + 'T12:00:00').getDay()
    dayTotals[dow] += stat.focus_minutes
    dayCounts[dow] += 1
  }
  const dayAvg = dayTotals.map((t, i) => (dayCounts[i] > 0 ? t / dayCounts[i] : 0))
  const maxIdx = dayAvg.indexOf(Math.max(...dayAvg))
  const mostProductiveDay = dayAvg[maxIdx] > 0 ? TR_DAYS[maxIdx] : null

  // ── Productivity score ────────────────────────────────────────────
  const productivityScore = computeProductivityScore({
    currentStreak,
    dailyTasks: dailyTasks.slice(-7),
    dailyFocus: dailyFocus.slice(-7),
    thisWeekXP,
    level,
  })

  // ── Insights ──────────────────────────────────────────────────────
  const insights = generateInsights({
    weeklyComparison,
    currentStreak,
    longestStreak,
    mostProductiveDay,
    productivityScore,
    pomodoroStats,
    subjectStats,
    dailyTasks: dailyTasks.slice(-7),
  })

  return {
    totalXP, level, currentStreak, longestStreak,
    dailyFocus, dailyTasks, dailyXP,
    subjectStats, pomodoroStats,
    weeklyComparison, productivityScore, insights, mostProductiveDay,
    bestStreak: longestStreak,
  }
}
