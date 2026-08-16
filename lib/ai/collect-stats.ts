import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserStatsForAI } from './types'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'

// ─────────────────────────────────────────────────────────────────
// Collect all stats needed for AI generation
// ─────────────────────────────────────────────────────────────────
export async function collectUserStats(
  supabase: SupabaseClient,
  userId:   string,
): Promise<UserStatsForAI> {
  const today     = new Date()
  const todayStr  = today.toISOString().split('T')[0]

  // Week boundaries (Mon–Sun)
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(weekStart.getDate() - 7)
  const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0]

  const last7 = new Date(today)
  last7.setDate(today.getDate() - 6)
  const last7Str = last7.toISOString().split('T')[0]

  const last14 = new Date(today)
  last14.setDate(today.getDate() - 13)
  const last14Str = last14.toISOString().split('T')[0]

  // ── Parallel queries ──────────────────────────────────────────
  const [
    xpRes,
    streakRes,
    todayFocusRes,
    weekFocusRes,
    prevWeekFocusRes,
    sessionsRes,
    prevWeekSessionsRes,
    todayTasksRes,
    weekTasksRes,
    totalTasksRes,
    pomodoroHoursRes,
    subjectRes,
    recentDaysRes,
  ] = await Promise.all([
    supabase.from('user_xp').select('total_xp, level').eq('user_id', userId).single(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),

    // Today focus
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', userId).eq('date', todayStr).maybeSingle(),

    // This week focus (aggregate)
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', userId).gte('date', weekStartStr).lte('date', todayStr),

    // Prev week focus
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', userId).gte('date', prevWeekStartStr).lt('date', weekStartStr),

    // This week sessions
    supabase.from('pomodoro_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'focus').eq('status', 'completed').gte('started_at', weekStartStr),

    // Prev week sessions
    supabase.from('pomodoro_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('type', 'focus').eq('status', 'completed').gte('started_at', prevWeekStartStr).lt('started_at', weekStartStr),

    // Today tasks completed
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('date', todayStr).eq('completed', true),

    // Week tasks completed
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('date', weekStartStr).eq('completed', true),

    // Total tasks completed
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),

    // Pomodoro sessions with hour data (last 14 days for peak hours)
    supabase.from('pomodoro_sessions').select('started_at').eq('user_id', userId).eq('type', 'focus').eq('status', 'completed').gte('started_at', last14Str).order('started_at'),

    // Subject stats from completed daily tasks + templates
    supabase.from('daily_tasks').select('xp_earned, task_templates(subject)').eq('user_id', userId).eq('completed', true).gte('date', last14Str),

    // Recent 7 days daily focus
    supabase.from('daily_focus_time').select('date, focus_minutes, sessions_completed').eq('user_id', userId).gte('date', last7Str).order('date'),
  ])

  // ── Aggregate ─────────────────────────────────────────────────
  const xp     = xpRes.data
  const streak = streakRes.data

  const todayXp = 0 // we don't query this separately to save a call

  const todayFocusMinutes  = todayFocusRes.data?.focus_minutes ?? 0
  const weekFocusMinutes   = (weekFocusRes.data ?? []).reduce((s: number, r: { focus_minutes: number }) => s + r.focus_minutes, 0)
  const prevWeekFocusMinutes = (prevWeekFocusRes.data ?? []).reduce((s: number, r: { focus_minutes: number }) => s + r.focus_minutes, 0)

  const weekSessions     = sessionsRes.count ?? 0
  const prevWeekSessions = prevWeekSessionsRes.count ?? 0

  const weekTasksDone    = weekTasksRes.count ?? 0
  const totalTasksDone   = totalTasksRes.count ?? 0

  // Task completion rate (week tasks / expected 3 per day * active days)
  const activeDaysThisWeek = (weekFocusRes.data ?? []).filter((r: { focus_minutes: number }) => r.focus_minutes > 0).length
  const expectedTasks = Math.max(1, activeDaysThisWeek) * 3
  const taskCompletionRate = Math.min(100, Math.round((weekTasksDone / expectedTasks) * 100))

  // Peak hours
  const hourCounts = new Array(24).fill(0)
  ;(pomodoroHoursRes.data ?? []).forEach((s: { started_at: string }) => {
    const h = new Date(s.started_at).getHours()
    hourCounts[h]++
  })
  const peakHours = hourCounts
    .map((count, h) => ({ h, count }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(x => x.h)
    .sort((a, b) => a - b)

  // Subject stats
  const subjectMap = new Map<string, { tasksCompleted: number; totalXp: number }>()
  ;(subjectRes.data ?? []).forEach((row: { xp_earned: number; task_templates: { subject: string }[] | { subject: string } | null }) => {
    const tmpl = Array.isArray(row.task_templates) ? row.task_templates[0] : row.task_templates
    const sub = tmpl?.subject ?? 'Diğer'
    const curr = subjectMap.get(sub) ?? { tasksCompleted: 0, totalXp: 0 }
    subjectMap.set(sub, { tasksCompleted: curr.tasksCompleted + 1, totalXp: curr.totalXp + row.xp_earned })
  })
  const subjectStats = Array.from(subjectMap.entries())
    .map(([subject, data]) => ({
      subject,
      tasksCompleted: data.tasksCompleted,
      avgXp: Math.round(data.totalXp / data.tasksCompleted),
    }))
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 5)

  // Recent days
  const recentDays = (recentDaysRes.data ?? []).map((r: { date: string; focus_minutes: number; sessions_completed: number }) => ({
    date:         r.date,
    focusMinutes: r.focus_minutes,
    sessions:     r.sessions_completed,
  })).slice(-3)

  // Average daily focus (over active days)
  const activeDays = (recentDaysRes.data ?? []).filter((r: { focus_minutes: number }) => r.focus_minutes > 0).length
  const avgDailyFocus = activeDays > 0
    ? Math.round(weekFocusMinutes / Math.max(activeDays, 1))
    : 0

  // Focus trend % (vs prev week)
  const focusTrend = prevWeekFocusMinutes > 0
    ? ((weekFocusMinutes - prevWeekFocusMinutes) / prevWeekFocusMinutes) * 100
    : 0

  return {
    totalXp:             xp?.total_xp ?? 0,
    level:               xp?.level ?? 1,
    todayXp,
    currentStreak:       streak?.current_streak ?? 0,
    longestStreak:       streak?.longest_streak ?? 0,
    weekFocusMinutes,
    todayFocusMinutes,
    avgDailyFocus,
    focusTrend,
    weekSessions,
    totalSessions:       weekSessions,
    weekTasksDone,
    taskCompletionRate,
    peakHours,
    subjectStats,
    recentDays,
    prevWeekFocusMinutes,
    prevWeekSessions,
  }
}

// ─────────────────────────────────────────────────────────────────
// Cached wrapper — collectUserStats() runs 13 parallel queries. It
// currently backs only the weekly-report generator, but each click of
// "Haftalık Rapor Oluştur" re-ran the full 13-query set even though
// nothing in the underlying data had changed since the last click.
// Cached for a day, busted by invalidateDashboardCaches().
// ─────────────────────────────────────────────────────────────────
export async function getCachedUserStats(
  supabase: SupabaseClient,
  userId:   string,
): Promise<UserStatsForAI> {
  const today = new Date().toISOString().split('T')[0]
  const key   = cacheKey.aiStats(today)

  const cached = await getCache<UserStatsForAI>(supabase, userId, key)
  if (cached) return cached

  const stats = await collectUserStats(supabase, userId)
  await setCache(supabase, userId, key, stats, TTL.AI_STATS)
  return stats
}
