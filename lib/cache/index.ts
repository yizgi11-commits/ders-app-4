import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────
// TTL constants (seconds)
// ─────────────────────────────────────────────────────────────────
export const TTL = {
  DASHBOARD_STATS:  60 * 60 * 24,      // 24 h — invalidated by pomodoro/task complete
  WEEKLY_PROGRESS:  60 * 60 * 24,      // 24 h — invalidated by pomodoro/task complete
  AI_INSIGHTS:      60 * 60 * 24,      // 24 h — one Claude call per user per day
  ACHIEVEMENTS:     60 * 60 * 24 * 7,  // 7 days — only grows, rarely changes
  GENERATING_LOCK:  30,                 // 30 s  — prevents duplicate AI calls
} as const

// ─────────────────────────────────────────────────────────────────
// Cache key builders
// ─────────────────────────────────────────────────────────────────
export const cacheKey = {
  dashboardStats:  (date: string)    => `dashboard:stats:${date}`,
  weeklyProgress:  (weekKey: string) => `dashboard:weekly:${weekKey}`,
  aiInsights:      (date: string)    => `ai:insights:${date}`,
  aiGenerating:    ()                => `ai:insights:generating`,
  achievements:    ()                => `achievements:unlocked`,
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
export async function getCache<T>(
  supabase:  SupabaseClient,
  userId:    string,
  key:       string,
): Promise<T | null> {
  const { data } = await supabase
    .from('app_cache')
    .select('data')
    .eq('user_id', userId)
    .eq('cache_key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  return (data?.data as T) ?? null
}

export async function setCache(
  supabase:   SupabaseClient,
  userId:     string,
  key:        string,
  data:       object,
  ttlSeconds: number,
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
  await supabase
    .from('app_cache')
    .upsert(
      { user_id: userId, cache_key: key, data, expires_at: expiresAt },
      { onConflict: 'user_id,cache_key' },
    )
}

export async function deleteCache(
  supabase: SupabaseClient,
  userId:   string,
  ...keys:  string[]
): Promise<void> {
  if (keys.length === 0) return
  await supabase
    .from('app_cache')
    .delete()
    .eq('user_id', userId)
    .in('cache_key', keys)
}

// Invalidate all dashboard-related caches (call after pomodoro/task complete)
export async function invalidateDashboardCaches(
  supabase: SupabaseClient,
  userId:   string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  // Get current week key
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7)
  const weekKey = `${d.getFullYear()}-W${String(week).padStart(2, '0')}`

  await deleteCache(
    supabase,
    userId,
    cacheKey.dashboardStats(today),
    cacheKey.weeklyProgress(weekKey),
  )
}
