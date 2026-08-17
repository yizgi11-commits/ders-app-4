import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodaysSystemTasks } from '@/lib/tasks/generator'
import { PROGRESS_WEIGHTS } from '@/lib/subjects/types'
import { formatLastStudied } from '@/lib/subjects/format'

// GET /api/dashboard/command-center
// Everything the Command Center's "5-second view of today" needs, in
// one round trip: today's tasks (+streak), today's/this-month's focus
// and review activity, and where the user last left off. All of it is
// plain data — the Next Action / Learning Score logic that reads this
// lives client-side (components/dashboard/CommandCenter.tsx), no AI call.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const now          = new Date()
  const today        = now.toISOString().split('T')[0]
  const todayStartIso = `${today}T00:00:00.000Z`
  const firstOfMonth = `${today.slice(0, 7)}-01`

  let systemTasks
  try {
    systemTasks = await getTodaysSystemTasks(supabase, user.id)
  } catch {
    return NextResponse.json({ error: 'Görevler alınamadı' }, { status: 500 })
  }

  const [
    dailyFocusRes, dueCardsRes, reviewsDoneRes,
    lastSessionRes, monthFocusRes, monthReviewsRes,
  ] = await Promise.all([
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('flashcards').select('id, topic_id, topics(title)').eq('user_id', user.id).lte('next_review_date', today),
    supabase.from('recall_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('reviewed_at', todayStartIso),
    supabase.from('pomodoro_sessions').select('topic_id, subject_id, started_at').eq('user_id', user.id).eq('status', 'completed').not('topic_id', 'is', null).order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).gte('date', firstOfMonth),
    supabase.from('recall_reviews').select('topic_id, reviewed_at').eq('user_id', user.id).gte('reviewed_at', `${firstOfMonth}T00:00:00.000Z`),
  ])

  const todayMinutes = dailyFocusRes.data?.focus_minutes ?? 0

  // ── Reviews due today, grouped by topic for the "Review X" hint ──
  type DueCard = { id: string; topic_id: string | null; topics: { title: string } | { title: string }[] | null }
  const dueCards = (dueCardsRes.data ?? []) as DueCard[]
  const reviewsDueToday = dueCards.length

  let reviewHint: { topicTitle: string | null; estimatedMinutes: number } | null = null
  if (reviewsDueToday > 0) {
    const byTopic = new Map<string, { title: string; count: number }>()
    let untitledCount = 0
    for (const card of dueCards) {
      if (!card.topic_id) { untitledCount++; continue }
      const t = Array.isArray(card.topics) ? card.topics[0] : card.topics
      const entry = byTopic.get(card.topic_id) ?? { title: t?.title ?? 'Konu', count: 0 }
      entry.count++
      byTopic.set(card.topic_id, entry)
    }
    const topGroup = Array.from(byTopic.values()).sort((a, b) => b.count - a.count)[0]
    const groupCount = topGroup?.count ?? untitledCount
    reviewHint = {
      topicTitle: topGroup?.title ?? null,
      estimatedMinutes: Math.max(3, Math.round(groupCount * 1.5)),
    }
  }

  const reviewsDoneToday = reviewsDoneRes.count ?? 0

  // ── Continue Learning: most recently completed Focus session's topic ──
  let continueLearning: {
    subjectId: string; subjectName: string; subjectIcon: string; subjectColor: string
    topicId: string; topicTitle: string
    progressPct: number
    lastStudiedLabel: string
  } | null = null

  const lastSession = lastSessionRes.data as { topic_id: string; subject_id: string | null; started_at: string } | null
  if (lastSession?.topic_id) {
    const [{ data: topic }, { data: recallHit }, { data: noteHit }] = await Promise.all([
      supabase.from('topics').select('title, subjects(id, name, icon, color)').eq('id', lastSession.topic_id).eq('user_id', user.id).maybeSingle(),
      supabase.from('flashcards').select('id').eq('user_id', user.id).eq('topic_id', lastSession.topic_id).gt('review_count', 0).limit(1).maybeSingle(),
      supabase.from('notes').select('id').eq('user_id', user.id).eq('topic_id', lastSession.topic_id).limit(1).maybeSingle(),
    ])

    if (topic) {
      const rawSubject = topic.subjects as
        | { id: string; name: string; icon: string; color: string }
        | { id: string; name: string; icon: string; color: string }[]
        | null
      const subject = Array.isArray(rawSubject) ? (rawSubject[0] ?? null) : rawSubject
      const progressPct =
        PROGRESS_WEIGHTS.focus +
        (recallHit ? PROGRESS_WEIGHTS.recall : 0) +
        (noteHit ? PROGRESS_WEIGHTS.note : 0)

      continueLearning = {
        subjectId: subject?.id ?? lastSession.subject_id ?? '',
        subjectName: subject?.name ?? 'Ders',
        subjectIcon: subject?.icon ?? '📚',
        subjectColor: subject?.color ?? '#6366f1',
        topicId: lastSession.topic_id,
        topicTitle: topic.title,
        progressPct,
        lastStudiedLabel: formatLastStudied(lastSession.started_at),
      }
    }
  }

  // ── This month: focus time, distinct topics reviewed, review consistency ──
  const monthFocusMinutes = ((monthFocusRes.data ?? []) as { focus_minutes: number }[])
    .reduce((sum, r) => sum + r.focus_minutes, 0)

  const monthReviews = (monthReviewsRes.data ?? []) as { topic_id: string | null; reviewed_at: string }[]
  const topicsReviewed = new Set(monthReviews.filter(r => r.topic_id).map(r => r.topic_id)).size
  const reviewDays = new Set(monthReviews.map(r => r.reviewed_at.split('T')[0])).size
  const daysElapsedThisMonth = now.getDate()
  const reviewConsistencyPct = Math.round((reviewDays / daysElapsedThisMonth) * 100)

  return NextResponse.json({
    tasks:       systemTasks.tasks,
    userStreak:  systemTasks.userStreak,
    todayMinutes,
    reviewsDueToday,
    reviewsDoneToday,
    reviewHint,
    continueLearning,
    monthly: {
      focusMinutes: monthFocusMinutes,
      topicsReviewed,
      reviewConsistencyPct,
    },
  })
}
