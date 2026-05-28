import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'

interface DashboardStats {
  subjectCount:      number
  todayHours:        number
  currentStreak:     number
  longestStreak:     number
  achievementCount:  number
  totalAchievements: number
}

// GET /api/dashboard/stats
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today   = new Date().toISOString().split('T')[0]
  const statKey = cacheKey.dashboardStats(today)

  // ── 1. Cache hit → return immediately (0 extra DB queries) ────
  const cached = await getCache<DashboardStats>(supabase, user.id, statKey)
  if (cached) return NextResponse.json(cached)

  // ── 2. Cache miss → run queries in parallel ──────────────────
  const [subjectsRes, todayFocusRes, streakRes, achievementsRes] = await Promise.all([
    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const stats: DashboardStats = {
    subjectCount:      subjectsRes.count ?? 0,
    todayHours:        Math.round(((todayFocusRes.data?.focus_minutes ?? 0) / 60) * 10) / 10,
    currentStreak:     streakRes.data?.current_streak ?? 0,
    longestStreak:     streakRes.data?.longest_streak ?? 0,
    achievementCount:  achievementsRes.count ?? 0,
    totalAchievements: 23,
  }

  // ── 3. Store in cache (24 h, invalidated by pomodoro/task) ────
  await setCache(supabase, user.id, statKey, stats, TTL.DASHBOARD_STATS)

  return NextResponse.json(stats)
}
