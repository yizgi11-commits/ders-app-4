import { createClient } from '@/lib/supabase/server'
import type { StudyStatistics, DailyFocusTime } from '@/lib/pomodoro/types'
import StudyStatsClient from './StudyStatsClient'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function fmtMinutes(mins: number) {
  if (mins < 60) return `${mins}dk`
  return `${Math.floor(mins / 60)}s ${mins % 60}dk`
}

export default async function StudyStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const [{ data: stats }, { data: todayData }, { data: weekData }, { data: recentSessions }] =
    await Promise.all([
      supabase.from('study_statistics').select('*').eq('user_id', user.id).maybeSingle<StudyStatistics>(),
      supabase.from('daily_focus_time').select('*').eq('user_id', user.id).eq('date', today).maybeSingle<DailyFocusTime>(),
      supabase.from('daily_focus_time').select('focus_minutes, date').eq('user_id', user.id).gte('date', daysAgo(6)).order('date'),
      supabase.from('pomodoro_sessions').select('type, status, xp_earned, started_at').eq('user_id', user.id).eq('status', 'completed').order('started_at', { ascending: false }).limit(5),
    ])

  const weekMinutes = (weekData ?? []).reduce(
    (s: number, r: { focus_minutes: number }) => s + r.focus_minutes, 0
  )

  const topCards = [
    { label: 'Bugün',    value: fmtMinutes(todayData?.focus_minutes ?? 0), sub: `${todayData?.sessions_completed ?? 0} oturum`, color: 'indigo' },
    { label: 'Bu Hafta', value: fmtMinutes(weekMinutes),                   sub: 'son 7 gün',                                    color: 'violet' },
    { label: 'Toplam',   value: fmtMinutes(stats?.total_focus_minutes ?? 0), sub: `${stats?.total_sessions_completed ?? 0} oturum`, color: 'amber' },
    { label: 'Seri',     value: String(stats?.current_session_streak ?? 0), sub: `rekor: ${stats?.longest_streak_sessions ?? 0}`, color: 'orange' },
  ]

  const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const weekMap = new Map((weekData ?? []).map((r: { date: string; focus_minutes: number }) => [r.date, r.focus_minutes]))
  const bars = Array.from({ length: 7 }, (_, i) => {
    const dateStr = daysAgo(6 - i)
    const minutes = weekMap.get(dateStr) ?? 0
    const dayIdx = new Date(dateStr).getDay()
    return { label: DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1], minutes, isToday: dateStr === today }
  })

  const sessions = (recentSessions ?? []) as { type: string; status: string; xp_earned: number; started_at: string }[]

  return (
    <StudyStatsClient
      topCards={topCards}
      bars={bars}
      weekMinutes={weekMinutes}
      recentSessions={sessions}
    />
  )
}
