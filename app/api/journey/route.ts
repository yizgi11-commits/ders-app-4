import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/security'
import { xpProgress } from '@/lib/tasks/xp'
import { JOURNEY_DAYS, type JourneyDay } from '@/lib/journey/types'

/** Local-date key for a timestamp, so a 23:00 session lands on that day. */
function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// GET /api/journey — daily activity history, XP/streak, unlocked milestones
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const now   = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - (JOURNEY_DAYS - 1))
  const startDate = start.toISOString().split('T')[0]
  const startIso  = new Date(startDate + 'T00:00:00').toISOString()

  const [focusRes, sessionsRes, recallRes, tasksRes, xpRes, streakRes, achRes] =
    await Promise.all([
      supabase.from('daily_focus_time')
        .select('date, focus_minutes')
        .eq('user_id', user.id)
        .gte('date', startDate),
      supabase.from('pomodoro_sessions')
        .select('started_at, topic_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', startIso),
      supabase.from('recall_reviews')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .gte('reviewed_at', startIso),
      supabase.from('daily_tasks')
        .select('date')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('date', startDate),
      supabase.from('user_xp').select('total_xp, level').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false }),
    ])

  if (focusRes.error) return safeError(focusRes.error, 'Journey verisi alınamadı')

  // ── Fold each source into a per-day bucket ─────────────────────
  const buckets = new Map<string, JourneyDay>()
  const ensure = (date: string): JourneyDay => {
    let d = buckets.get(date)
    if (!d) {
      d = { date, focusMinutes: 0, topicsStudied: 0, recallCards: 0, tasksCompleted: 0 }
      buckets.set(date, d)
    }
    return d
  }

  for (const row of (focusRes.data ?? []) as { date: string; focus_minutes: number }[]) {
    ensure(row.date).focusMinutes += row.focus_minutes
  }

  // Topics studied = distinct topic_id among that day's completed sessions.
  const topicsByDay = new Map<string, Set<string>>()
  for (const row of (sessionsRes.data ?? []) as { started_at: string; topic_id: string | null }[]) {
    const key = dayKey(row.started_at)
    ensure(key)
    if (!row.topic_id) continue
    let set = topicsByDay.get(key)
    if (!set) { set = new Set(); topicsByDay.set(key, set) }
    set.add(row.topic_id)
  }
  for (const [date, set] of topicsByDay) ensure(date).topicsStudied = set.size

  for (const row of (recallRes.data ?? []) as { reviewed_at: string }[]) {
    ensure(dayKey(row.reviewed_at)).recallCards += 1
  }

  for (const row of (tasksRes.data ?? []) as { date: string }[]) {
    ensure(row.date).tasksCompleted += 1
  }

  const days = Array.from(buckets.values()).sort((a, b) => b.date.localeCompare(a.date))

  const totalXp = xpRes.data?.total_xp ?? 0
  const { current, required } = xpProgress(totalXp)

  return NextResponse.json({
    days,
    xp: {
      level:    xpRes.data?.level ?? 1,
      totalXp,
      current,
      required,
      pct: required > 0 ? Math.round((current / required) * 100) : 0,
    },
    streak: {
      current: streakRes.data?.current_streak ?? 0,
      longest: streakRes.data?.longest_streak ?? 0,
    },
    unlocked: achRes.data ?? [],
  })
}
