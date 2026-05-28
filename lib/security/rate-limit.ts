import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
}

/**
 * DB-based rate limiting using the existing api_usage table.
 * Counts rows for (user_id, endpoint) within the last `windowHours` hours.
 */
export async function checkRateLimit(
  supabase:    SupabaseClient,
  userId:      string,
  endpoint:    string,
  maxCalls:    number,
  windowHours: number,
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', since)

  if (error) {
    // On DB error, fail open (allow) to avoid blocking legitimate traffic
    console.error('Rate limit check failed:', error.message)
    return { allowed: true, remaining: maxCalls }
  }

  const used      = count ?? 0
  const remaining = Math.max(0, maxCalls - used)
  return { allowed: used < maxCalls, remaining }
}
