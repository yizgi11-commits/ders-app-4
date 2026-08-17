import type { SupabaseClient } from '@supabase/supabase-js'
import { getCachedLearningScore } from '@/lib/dashboard/learning-score'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'

// ─────────────────────────────────────────────────────────────────
// Weekly Review — "how was your week", computed entirely from data.
// No AI call: totals are plain aggregates, and the "What went well" /
// "What needs attention" lines are template sentences gated on the
// Learning Score breakdown (lib/learningScore.ts) that already scores
// this same 7-day window. Reusing that breakdown keeps the two
// features telling the same story instead of two slightly different
// numbers for the same thing.
// ─────────────────────────────────────────────────────────────────

export interface WeeklyReviewTotals {
  focusMinutes:   number
  tasksCompleted: number
  reviewsDone:    number
  topicsStudied:  number
}

export interface WeeklyReviewSubject {
  name:           string
  focusMinutes:   number
  overdueReviews: number
}

export interface WeeklyReviewTopic {
  topicId:      string
  topicTitle:   string
  subjectName:  string
  overdueCount: number
}

export interface WeeklyReview {
  totals:           WeeklyReviewTotals
  learningScore:    { current: number; previous: number; change: number }
  strongestSubject: WeeklyReviewSubject | null
  weakestSubject:   WeeklyReviewSubject | null
  wentWell:         string[]
  needsAttention:   string[]
  nextWeekFocus:    WeeklyReviewTopic[]   // 0-3 most overdue topics
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateStr(d)
}

// ── What went well / What needs attention — rule-based, no AI ─────
function buildWentWell(
  breakdown: { focus: number; recall: number; completion: number; consistency: number },
  scoreChange: number,
): string[] {
  const lines: string[] = []
  if (breakdown.completion > 80) lines.push(`Görev tamamlama oranın bu hafta güçlüydü (%${breakdown.completion}).`)
  if (breakdown.recall > 75) lines.push(`Tekrar düzenin iyiydi (%${breakdown.recall}).`)
  if (breakdown.focus >= 90) lines.push(`Focus hedefine bu hafta ulaştın (%${breakdown.focus}).`)
  if (breakdown.consistency >= 85) lines.push('Bu hafta neredeyse her gün aktifdin.')
  if (scoreChange > 0) lines.push(`Learning Score geçen haftaya göre ${scoreChange} puan arttı.`)
  if (lines.length === 0) lines.push('Bu hafta ölçülebilir bir öne çıkan yoktu — dengeli ama sakin bir hafta geçirdin.')
  return lines
}

function buildNeedsAttention(
  breakdown: { focus: number; recall: number; completion: number; consistency: number },
  scoreChange: number,
  weakestSubject: WeeklyReviewSubject | null,
): string[] {
  const lines: string[] = []
  if (breakdown.focus < 60) lines.push(`Focus süresi hedefin altında kaldı (%${breakdown.focus}).`)
  if (breakdown.recall < 50) lines.push(`Tekrar tamamlama oranı düşük kaldı (%${breakdown.recall}).`)
  if (breakdown.completion < 50) lines.push(`Görev tamamlama oranı düşük kaldı (%${breakdown.completion}).`)
  if (breakdown.consistency < 50) lines.push('Bu hafta düzensiz çalıştın.')
  if (weakestSubject && weakestSubject.overdueReviews > 5) {
    lines.push(`${weakestSubject.name} dersinde ${weakestSubject.overdueReviews} kart gecikmiş durumda.`)
  }
  if (scoreChange < 0) lines.push(`Learning Score geçen haftaya göre ${Math.abs(scoreChange)} puan düştü.`)
  if (lines.length === 0) lines.push('Bu hafta dikkat çeken bir sorun yok — mevcut temponu koru.')
  return lines
}

async function fetchWeeklyReview(
  supabase: SupabaseClient,
  userId:   string,
): Promise<WeeklyReview> {
  const today      = dateStr(new Date())
  const weekStart  = daysAgo(6)
  const startIso   = `${weekStart}T00:00:00.000Z`

  const [
    focusRes, tasksRes, recallRes, sessionsRes,
    overdueCardsRes, subjectsRes, topicsRes, learningScore,
  ] = await Promise.all([
    supabase.from('daily_focus_time')
      .select('focus_minutes')
      .eq('user_id', userId).gte('date', weekStart).lte('date', today),
    supabase.from('daily_tasks')
      .select('completed')
      .eq('user_id', userId).gte('date', weekStart).lte('date', today),
    supabase.from('recall_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId).gte('reviewed_at', startIso),
    supabase.from('pomodoro_sessions')
      .select('subject_id, topic_id, elapsed_seconds, duration_seconds')
      .eq('user_id', userId).eq('status', 'completed').gte('started_at', startIso),
    // All cards currently overdue — not window-limited, "most overdue" is about current state.
    supabase.from('flashcards')
      .select('subject_id, topic_id')
      .eq('user_id', userId).lte('next_review_date', today),
    supabase.from('subjects').select('id, name').eq('user_id', userId),
    supabase.from('topics').select('id, title, subject_id').eq('user_id', userId),
    getCachedLearningScore(supabase, userId),
  ])

  const subjectNames = new Map((subjectsRes.data ?? []).map((s: { id: string; name: string }) => [s.id, s.name]))
  const topicsById    = new Map((topicsRes.data ?? []).map((t: { id: string; title: string; subject_id: string }) => [t.id, t]))

  // ── Totals ────────────────────────────────────────────────────
  const focusMinutes = ((focusRes.data ?? []) as { focus_minutes: number }[])
    .reduce((sum, r) => sum + r.focus_minutes, 0)

  const tasks = (tasksRes.data ?? []) as { completed: boolean }[]
  const tasksCompleted = tasks.filter(t => t.completed).length

  const reviewsDone = recallRes.count ?? 0

  const sessions = (sessionsRes.data ?? []) as {
    subject_id: string | null; topic_id: string | null
    elapsed_seconds: number; duration_seconds: number
  }[]
  const topicsStudied = new Set(sessions.filter(s => s.topic_id).map(s => s.topic_id)).size

  // ── Per-subject focus this week (for strongest subject) ────────
  const subjectFocusMap = new Map<string, number>()
  for (const s of sessions) {
    if (!s.subject_id) continue
    const minutes = Math.round((s.elapsed_seconds || s.duration_seconds || 0) / 60)
    subjectFocusMap.set(s.subject_id, (subjectFocusMap.get(s.subject_id) ?? 0) + minutes)
  }

  // ── Overdue cards, grouped by subject and by topic ──────────────
  const overdueCards = (overdueCardsRes.data ?? []) as { subject_id: string | null; topic_id: string | null }[]
  const subjectOverdueMap = new Map<string, number>()
  const topicOverdueMap   = new Map<string, number>()
  for (const c of overdueCards) {
    if (c.subject_id) subjectOverdueMap.set(c.subject_id, (subjectOverdueMap.get(c.subject_id) ?? 0) + 1)
    if (c.topic_id)   topicOverdueMap.set(c.topic_id, (topicOverdueMap.get(c.topic_id) ?? 0) + 1)
  }

  const toSubject = (id: string): WeeklyReviewSubject => ({
    name:           subjectNames.get(id) ?? 'Ders',
    focusMinutes:   subjectFocusMap.get(id) ?? 0,
    overdueReviews: subjectOverdueMap.get(id) ?? 0,
  })

  // Strongest — most focus minutes this week.
  const strongestId = Array.from(subjectFocusMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const strongestSubject = strongestId ? toSubject(strongestId) : null

  // Weakest — prefer whichever subject has the most piled-up overdue
  // reviews (the more urgent signal); fall back to least-focused
  // subject among the ones actually studied this week.
  let weakestSubject: WeeklyReviewSubject | null = null
  const mostOverdueId = Array.from(subjectOverdueMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  if (mostOverdueId) {
    weakestSubject = toSubject(mostOverdueId)
  } else if (subjectFocusMap.size > 1) {
    const leastFocusedId = Array.from(subjectFocusMap.entries()).sort((a, b) => a[1] - b[1])[0]?.[0] ?? null
    weakestSubject = leastFocusedId ? toSubject(leastFocusedId) : null
  }
  if (weakestSubject && strongestSubject && weakestSubject.name === strongestSubject.name && subjectFocusMap.size <= 1) {
    weakestSubject = null
  }

  // ── Next week focus: most-overdue topics ────────────────────────
  const nextWeekFocus: WeeklyReviewTopic[] = Array.from(topicOverdueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topicId, overdueCount]) => {
      const topic = topicsById.get(topicId) as { id: string; title: string; subject_id: string } | undefined
      return {
        topicId,
        topicTitle:  topic?.title ?? 'Konu',
        subjectName: topic ? (subjectNames.get(topic.subject_id) ?? 'Ders') : 'Ders',
        overdueCount,
      }
    })

  const scoreChange = learningScore.change

  return {
    totals: { focusMinutes, tasksCompleted, reviewsDone, topicsStudied },
    learningScore: {
      current:  learningScore.score,
      previous: learningScore.score - scoreChange,
      change:   scoreChange,
    },
    strongestSubject,
    weakestSubject,
    wentWell:       buildWentWell(learningScore.breakdown, scoreChange),
    needsAttention: buildNeedsAttention(learningScore.breakdown, scoreChange, weakestSubject),
    nextWeekFocus,
  }
}

export async function getCachedWeeklyReview(
  supabase: SupabaseClient,
  userId:   string,
): Promise<WeeklyReview> {
  const key = cacheKey.weeklyReview(dateStr(new Date()))

  const cached = await getCache<WeeklyReview>(supabase, userId, key)
  if (cached) return cached

  const data = await fetchWeeklyReview(supabase, userId)
  await setCache(supabase, userId, key, data, TTL.WEEKLY_REVIEW)
  return data
}
