import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dashboard/stats
// Returns real user stats for the StatsGrid widget
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const [
    subjectsRes,
    todayFocusRes,
    streakRes,
    achievementsRes,
  ] = await Promise.all([
    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const todayMinutes = todayFocusRes.data?.focus_minutes ?? 0

  return NextResponse.json({
    subjectCount:    subjectsRes.count ?? 0,
    todayHours:      Math.round((todayMinutes / 60) * 10) / 10,
    currentStreak:   streakRes.data?.current_streak ?? 0,
    longestStreak:   streakRes.data?.longest_streak ?? 0,
    achievementCount: achievementsRes.count ?? 0,
    totalAchievements: 23,
  })
}
