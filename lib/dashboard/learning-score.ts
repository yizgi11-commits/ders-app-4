import type { SupabaseClient } from '@supabase/supabase-js'
import { computeLearningScore, type LearningScoreBreakdown } from '@/lib/learningScore'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'

// ─────────────────────────────────────────────────────────────────
// Learning Score — data layer. Fetches the raw 7-day counts
// computeLearningScore() needs, for "this week" and the preceding
// week (so we can report a week-over-week change), and caches the
// result in app_cache for 6h. Invalidated by invalidateDashboardCaches()
// on task/pomodoro/recall completion, same as the other dashboard caches.
// ─────────────────────────────────────────────────────────────────

export interface LearningScoreResponse {
  score:     number
  change:    number   // this week's score minus last week's
  breakdown: LearningScoreBreakdown
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateStr(d)
}

// Fetches raw counts for one 7-day window [start, end] (inclusive)
// and scores it.
async function scoreWindow(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
  dailyGoalMinutes: number,
) {
  const startIso = `${start}T00:00:00.000Z`
  const endIso   = `${end}T23:59:59.999Z`

  const [focusRes, tasksRes, recallRes, pomodoroRes, overdueRes] = await Promise.all([
    supabase.from('daily_focus_time')
      .select('focus_minutes')
      .eq('user_id', userId).gte('date', start).lte('date', end),
    supabase.from('daily_tasks')
      .select('completed')
      .eq('user_id', userId).gte('date', start).lte('date', end),
    supabase.from('recall_reviews')
      .select('reviewed_at')
      .eq('user_id', userId).gte('reviewed_at', startIso).lte('reviewed_at', endIso),
    supabase.from('pomodoro_sessions')
      .select('started_at')
      .eq('user_id', userId).eq('status', 'completed')
      .gte('started_at', startIso).lte('started_at', endIso),
    // Flashcards whose due date fell in this window and are still
    // unreviewed as of now (a review since then would have pushed
    // next_review_date into the future, out of this window).
    supabase.from('flashcards')
      .select('id')
      .eq('user_id', userId).gte('next_review_date', start).lte('next_review_date', end),
  ])

  const focusMinutes = ((focusRes.data ?? []) as { focus_minutes: number }[])
    .reduce((sum, r) => sum + r.focus_minutes, 0)

  const tasks = (tasksRes.data ?? []) as { completed: boolean }[]
  const tasksCreated   = tasks.length
  const tasksCompleted = tasks.filter(t => t.completed).length

  const recallRows = (recallRes.data ?? []) as { reviewed_at: string }[]
  const reviewsDone    = recallRows.length
  const reviewsOverdue = (overdueRes.data ?? []).length

  const activeDates = new Set<string>()
  for (const r of recallRows) activeDates.add(r.reviewed_at.split('T')[0])
  for (const r of (pomodoroRes.data ?? []) as { started_at: string }[]) {
    activeDates.add(r.started_at.split('T')[0])
  }

  return computeLearningScore({
    focusMinutes,
    plannedFocusMinutes: dailyGoalMinutes * 7,
    reviewsDone,
    reviewsOverdue,
    tasksCreated,
    tasksCompleted,
    activeDays: activeDates.size,
  })
}

async function fetchLearningScore(
  supabase: SupabaseClient,
  userId: string,
): Promise<LearningScoreResponse> {
  const prefsRes = await supabase
    .from('study_preferences')
    .select('daily_study_mins')
    .eq('user_id', userId)
    .maybeSingle()
  const dailyGoalMinutes = prefsRes.data?.daily_study_mins ?? 120

  const today         = dateStr(new Date())
  const thisWeekStart = daysAgo(6)
  const lastWeekEnd   = daysAgo(7)
  const lastWeekStart = daysAgo(13)

  const [thisWeek, lastWeek] = await Promise.all([
    scoreWindow(supabase, userId, thisWeekStart, today, dailyGoalMinutes),
    scoreWindow(supabase, userId, lastWeekStart, lastWeekEnd, dailyGoalMinutes),
  ])

  return {
    score:     thisWeek.score,
    change:    thisWeek.score - lastWeek.score,
    breakdown: thisWeek.breakdown,
  }
}

export async function getCachedLearningScore(
  supabase: SupabaseClient,
  userId:   string,
): Promise<LearningScoreResponse> {
  const key = cacheKey.learningScore(dateStr(new Date()))

  const cached = await getCache<LearningScoreResponse>(supabase, userId, key)
  if (cached) return cached

  const data = await fetchLearningScore(supabase, userId)
  await setCache(supabase, userId, key, data, TTL.LEARNING_SCORE)
  return data
}
