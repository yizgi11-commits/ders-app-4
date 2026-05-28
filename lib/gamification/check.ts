import type { SupabaseClient } from '@supabase/supabase-js'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from './achievements'
import type { UserStats } from './types'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'

// ─────────────────────────────────────────────────────────────────
// Trigger types — determines which achievement categories to check.
// Only relevant achievements are evaluated, never the full list.
// ─────────────────────────────────────────────────────────────────
export type AchievementTrigger = 'task' | 'pomodoro'

const TRIGGER_CATEGORIES: Record<AchievementTrigger, string[]> = {
  task:     ['task', 'xp', 'xp'],    // tasks + XP milestones + level-ups
  pomodoro: ['pomodoro', 'focus', 'streak', 'special', 'xp'], // everything focus-related
}

// ─────────────────────────────────────────────────────────────────
// checkAndUnlockAchievements
// ─────────────────────────────────────────────────────────────────
export async function checkAndUnlockAchievements(
  supabase:     SupabaseClient,
  userId:       string,
  trigger:      AchievementTrigger = 'task',
  pomodoroHour: number | null = null,
): Promise<string[]> {

  // ── 1. Load already-unlocked list (from cache first) ──────────
  const achKey   = cacheKey.achievements()
  const cachedIds = await getCache<string[]>(supabase, userId, achKey)

  let unlockedIds: Set<string>

  if (cachedIds) {
    unlockedIds = new Set(cachedIds)
  } else {
    const { data } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
    unlockedIds = new Set((data ?? []).map((r: { achievement_id: string }) => r.achievement_id))
    // Cache the unlocked list
    await setCache(supabase, userId, achKey, [...unlockedIds], TTL.ACHIEVEMENTS)
  }

  // ── 2. Filter to only relevant categories ─────────────────────
  const relevantCategories = new Set(TRIGGER_CATEGORIES[trigger])
  const candidates = ACHIEVEMENTS.filter(
    a => relevantCategories.has(a.category) && !unlockedIds.has(a.id)
  )

  if (candidates.length === 0) return []

  // ── 3. Collect only the stats needed ──────────────────────────
  const [xpRes, streakRes, statsRes, taskCountRes] = await Promise.all([
    supabase.from('user_xp').select('total_xp, level').eq('user_id', userId).single(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
    supabase.from('study_statistics').select('total_focus_minutes, total_sessions_completed').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
  ])

  const xp     = xpRes.data
  const streak = streakRes.data
  if (!xp || !streak) return []

  const userStats: UserStats = {
    totalXp:                xp.total_xp,
    level:                  xp.level,
    currentStreak:          streak.current_streak,
    longestStreak:          streak.longest_streak,
    totalFocusMinutes:      statsRes.data?.total_focus_minutes ?? 0,
    totalSessionsCompleted: statsRes.data?.total_sessions_completed ?? 0,
    totalTasksCompleted:    taskCountRes.count ?? 0,
    pomodoroHour,
  }

  // ── 4. Find newly qualifying ───────────────────────────────────
  const toUnlock = candidates.filter(a => a.condition(userStats))
  if (toUnlock.length === 0) return []

  // ── 5. Insert + award XP ──────────────────────────────────────
  const now = new Date().toISOString()
  await supabase.from('user_achievements').insert(
    toUnlock.map(a => ({
      user_id:        userId,
      achievement_id: a.id,
      unlocked_at:    now,
      xp_rewarded:    a.xpReward,
    }))
  )

  const totalBonus = toUnlock.reduce((s, a) => s + a.xpReward, 0)
  if (totalBonus > 0) {
    await supabase.rpc('increment_xp', { p_user_id: userId, p_amount: totalBonus })
  }

  // ── 6. Update achievements cache with new IDs ─────────────────
  const newIds = toUnlock.map(a => a.id)
  const allIds = [...unlockedIds, ...newIds]
  await setCache(supabase, userId, achKey, allIds, TTL.ACHIEVEMENTS)

  return newIds
}

export { ACHIEVEMENT_MAP }
