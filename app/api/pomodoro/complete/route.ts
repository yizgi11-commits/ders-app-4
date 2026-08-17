import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FOCUS_SESSION_XP } from '@/lib/pomodoro/types'
import { levelFromTotalXp } from '@/lib/tasks/xp'
import { updateStreak } from '@/lib/tasks/progression'
import type { UserXP, UserStreak } from '@/lib/tasks/types'
import type { StudyStatistics, DailyFocusTime } from '@/lib/pomodoro/types'
import { checkAndUnlockAchievements } from '@/lib/gamification/check'
import { invalidateDashboardCaches } from '@/lib/cache'

// POST /api/pomodoro/complete
// Body: { sessionId: string, elapsedSeconds: number }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { sessionId, elapsedSeconds } = body
  if (!sessionId) return NextResponse.json({ error: 'sessionId eksik' }, { status: 400 })

  const now = new Date().toISOString()
  const today = now.split('T')[0]

  // ── Fetch & validate session ──────────
  const { data: session, error: sErr } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
  if (session.status !== 'active') return NextResponse.json({ error: 'Oturum zaten kapandı' }, { status: 409 })

  const isFocus = session.type === 'focus'
  const xpEarned = isFocus ? FOCUS_SESSION_XP : 0
  const focusMinutes = isFocus ? Math.max(1, Math.floor(elapsedSeconds / 60)) : 0

  // ── Mark session complete ─────────────
  await supabase
    .from('pomodoro_sessions')
    .update({ status: 'completed', elapsed_seconds: elapsedSeconds, xp_earned: xpEarned, completed_at: now })
    .eq('id', sessionId)

  let newTotalXp = 0
  let newLevel = 1
  let levelUp = false

  if (isFocus) {
    // ── Award XP ───────────────────────
    const { data: userXp } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .single<UserXP>()

    if (userXp) {
      newTotalXp = userXp.total_xp + xpEarned
      newLevel = levelFromTotalXp(newTotalXp)
      levelUp = newLevel > userXp.level

      await supabase
        .from('user_xp')
        .update({ total_xp: newTotalXp, level: newLevel, updated_at: now })
        .eq('user_id', user.id)
    }

    // ── Update study_statistics ─────────
    const { data: stats } = await supabase
      .from('study_statistics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<StudyStatistics>()

    if (!stats) {
      await supabase.from('study_statistics').insert({
        user_id: user.id,
        total_focus_minutes: focusMinutes,
        total_sessions_completed: 1,
        current_session_streak: 1,
        longest_streak_sessions: 1,
      })
    } else {
      const newStreak = stats.current_session_streak + 1
      await supabase.from('study_statistics').update({
        total_focus_minutes: stats.total_focus_minutes + focusMinutes,
        total_sessions_completed: stats.total_sessions_completed + 1,
        current_session_streak: newStreak,
        longest_streak_sessions: Math.max(stats.longest_streak_sessions, newStreak),
        updated_at: now,
      }).eq('user_id', user.id)
    }

    // ── Update daily_focus_time ─────────
    const { data: daily } = await supabase
      .from('daily_focus_time')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle<DailyFocusTime>()

    if (!daily) {
      await supabase.from('daily_focus_time').insert({
        user_id: user.id,
        date: today,
        focus_minutes: focusMinutes,
        sessions_completed: 1,
      })
    } else {
      await supabase.from('daily_focus_time').update({
        focus_minutes: daily.focus_minutes + focusMinutes,
        sessions_completed: daily.sessions_completed + 1,
      }).eq('id', daily.id)
    }

    // ── Learning Streak: a completed Focus session keeps it alive ──
    const { data: streakRow } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<UserStreak>()

    if (streakRow) {
      const { currentStreak, longestStreak } = updateStreak({
        currentStreak: streakRow.current_streak,
        longestStreak: streakRow.longest_streak,
        lastStreakDate: streakRow.last_streak_date,
      })
      await supabase.from('user_streaks').update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_streak_date: today,
        updated_at: now,
      }).eq('user_id', user.id)
    }
  }

  // ── Return today's focus total ────────
  const { data: freshDaily } = await supabase
    .from('daily_focus_time')
    .select('focus_minutes')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  // ── Invalidate dashboard caches + check achievements ─────────
  const pomodoroHour = isFocus ? new Date().getHours() : null
  const [newAchievements] = await Promise.all([
    isFocus ? checkAndUnlockAchievements(supabase, user.id, 'pomodoro', pomodoroHour) : Promise.resolve([]),
    isFocus ? invalidateDashboardCaches(supabase, user.id) : Promise.resolve(),
  ])

  return NextResponse.json({
    xp_earned:           xpEarned,
    total_xp:            newTotalXp,
    level:               newLevel,
    level_up:            levelUp,
    focus_minutes_today: freshDaily?.focus_minutes ?? 0,
    new_achievements:    newAchievements,
  })
}
