import type { SupabaseClient } from '@supabase/supabase-js'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from './achievements'
import type { UserStats } from './types'

// ─────────────────────────────────────────────────────────────────
// checkAndUnlockAchievements
// Call from API routes after any significant action.
// Returns the list of newly unlocked achievement IDs.
// ─────────────────────────────────────────────────────────────────
export async function checkAndUnlockAchievements(
  supabase:     SupabaseClient,
  userId:       string,
  pomodoroHour: number | null = null,
): Promise<string[]> {
  // 1 ── Collect user stats (parallel) ───────────────────────────
  const [
    xpRes,
    streakRes,
    statsRes,
    unlockedRes,
    taskCountRes,
  ] = await Promise.all([
    supabase.from('user_xp').select('total_xp, level').eq('user_id', userId).single(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
    supabase.from('study_statistics').select('total_focus_minutes, total_sessions_completed').eq('user_id', userId).maybeSingle(),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
  ])

  const xp        = xpRes.data
  const streak    = streakRes.data
  const pStats    = statsRes.data
  const unlocked  = new Set((unlockedRes.data ?? []).map((r: { achievement_id: string }) => r.achievement_id))
  const taskCount = taskCountRes.count ?? 0

  if (!xp || !streak) return []

  const userStats: UserStats = {
    totalXp:                xp.total_xp,
    level:                  xp.level,
    currentStreak:          streak.current_streak,
    longestStreak:          streak.longest_streak,
    totalFocusMinutes:      pStats?.total_focus_minutes ?? 0,
    totalSessionsCompleted: pStats?.total_sessions_completed ?? 0,
    totalTasksCompleted:    taskCount,
    pomodoroHour,
  }

  // 2 ── Find newly qualifying achievements ──────────────────────
  const toUnlock = ACHIEVEMENTS.filter(
    a => !unlocked.has(a.id) && a.condition(userStats)
  )

  if (toUnlock.length === 0) return []

  // 3 ── Insert them + award XP ──────────────────────────────────
  const now = new Date().toISOString()

  await supabase.from('user_achievements').insert(
    toUnlock.map(a => ({
      user_id:        userId,
      achievement_id: a.id,
      unlocked_at:    now,
      xp_rewarded:    a.xpReward,
    }))
  )

  // Award XP for each achievement
  const totalBonus = toUnlock.reduce((s, a) => s + a.xpReward, 0)
  if (totalBonus > 0) {
    await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: totalBonus })
      .then(({ error }) => {
        if (error) {
          // Fallback if RPC not available — direct update
          return supabase.rpc('increment_xp', { p_user_id: userId, p_amount: totalBonus })
        }
      })
  }

  return toUnlock.map(a => a.id)
}

// ── Re-export lookup for API routes ───────────────────────────
export { ACHIEVEMENT_MAP }
