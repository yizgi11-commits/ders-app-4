import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/security'
import type { HardTopic, RecallGrade, ScheduleDay } from '@/lib/recall/types'

function addDays(base: Date, n: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// GET /api/recall/stats — analytics + the coming week's review load
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const now      = new Date()
  const today    = now.toISOString().split('T')[0]
  const weekEnd  = addDays(now, 6)
  const weekAgo  = new Date(now.getTime() - 7 * 86_400_000).toISOString()

  const gradeCount = (grade: RecallGrade) =>
    supabase.from('recall_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('grade', grade)

  const [
    againRes, hardRes, goodRes, easyRes,
    weeklyRes, overdueRes, hardTopicsRes, scheduleRes,
  ] = await Promise.all([
    gradeCount('again'),
    gradeCount('hard'),
    gradeCount('good'),
    gradeCount('easy'),
    supabase.from('recall_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('reviewed_at', weekAgo),
    supabase.from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lt('next_review_date', today),
    supabase.from('recall_reviews')
      .select('topic_id, grade, topics(title)')
      .eq('user_id', user.id)
      .order('reviewed_at', { ascending: false })
      .limit(1000),
    supabase.from('flashcards')
      .select('next_review_date')
      .eq('user_id', user.id)
      .lte('next_review_date', weekEnd),
  ])

  if (hardTopicsRes.error) return safeError(hardTopicsRes.error, 'Recall istatistikleri alınamadı')

  const gradeBreakdown: Record<RecallGrade, number> = {
    again: againRes.count ?? 0,
    hard:  hardRes.count  ?? 0,
    good:  goodRes.count  ?? 0,
    easy:  easyRes.count  ?? 0,
  }

  const totalReviews = gradeBreakdown.again + gradeBreakdown.hard + gradeBreakdown.good + gradeBreakdown.easy
  const successful   = gradeBreakdown.good + gradeBreakdown.easy
  const successRate  = totalReviews > 0 ? Math.round((successful / totalReviews) * 100) : 0

  // ── Hardest topics: most Again/Hard answers, from recent history ──
  type ReviewRow = { topic_id: string | null; grade: RecallGrade; topics: { title: string } | null }
  const reviews = (hardTopicsRes.data ?? []) as unknown as ReviewRow[]

  const topicTally = new Map<string, HardTopic>()
  for (const r of reviews) {
    const key = r.topic_id ?? '__none__'
    let entry = topicTally.get(key)
    if (!entry) {
      entry = {
        topicId:    r.topic_id,
        topicTitle: r.topics?.title ?? 'Konusuz kartlar',
        hardCount:  0,
        totalCount: 0,
      }
      topicTally.set(key, entry)
    }
    entry.totalCount++
    if (r.grade === 'again' || r.grade === 'hard') entry.hardCount++
  }

  const hardestTopics = Array.from(topicTally.values())
    .filter(t => t.hardCount > 0)
    .sort((a, b) => b.hardCount - a.hardCount || b.totalCount - a.totalCount)
    .slice(0, 5)

  // ── Weekly completion: how much of what came due got reviewed ────
  const weeklyReviewed = weeklyRes.count  ?? 0
  const weeklyOverdue  = overdueRes.count ?? 0
  const weeklyDenom    = weeklyReviewed + weeklyOverdue
  const weeklyCompletion = weeklyDenom > 0 ? Math.round((weeklyReviewed / weeklyDenom) * 100) : 100

  // ── 7-day schedule (overdue rolls into today) ────────────────────
  const dueDates = (scheduleRes.data ?? []) as { next_review_date: string }[]
  const schedule: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(now, i)
    const count = dueDates.filter(d =>
      i === 0 ? d.next_review_date <= date : d.next_review_date === date
    ).length
    return {
      date,
      label: i === 0
        ? 'Bugün'
        : new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
      count,
    }
  })

  return NextResponse.json({
    totalReviews,
    successRate,
    gradeBreakdown,
    hardestTopics,
    weeklyReviewed,
    weeklyOverdue,
    weeklyCompletion,
    schedule,
  })
}
