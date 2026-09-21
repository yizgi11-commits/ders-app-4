import type { SupabaseClient } from '@supabase/supabase-js'

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
}

/**
 * Atomic check-and-record via the consume_rate_limit() Postgres function
 * (supabase/migrations/noetic_rate_limits.sql): the count check and the
 * insert happen under a per-(user, key) advisory lock, so concurrent
 * requests can't all squeeze past the last slot.
 *
 * Returns null if the function isn't available (migration not applied
 * yet, or a transient DB error) — callers then fall back to the legacy
 * best-effort path below.
 */
export async function consumeRateLimit(
  supabase: SupabaseClient,
  key:      string,
  maxCalls: number,
  since:    Date,
): Promise<RateLimitResult | null> {
  const { data, error } = await supabase.rpc('consume_rate_limit', {
    p_endpoint: key,
    p_max:      maxCalls,
    p_since:    since.toISOString(),
  })

  if (error || !data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row.allowed !== 'boolean') return null
  return { allowed: row.allowed, remaining: Number(row.remaining) || 0 }
}

/**
 * Rolling-window rate limit for (user, endpoint). Uses the atomic
 * consume_rate_limit() when available.
 *
 * Legacy fallback (only until the migration is applied): counts
 * api_usage rows — which only AI routes ever write to, and only after
 * the Claude call returns, so it is neither race-safe nor effective for
 * non-AI endpoints. Fails open on DB error.
 */
export async function checkRateLimit(
  supabase:    SupabaseClient,
  userId:      string,
  endpoint:    string,
  maxCalls:    number,
  windowHours: number,
): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)

  const atomic = await consumeRateLimit(supabase, endpoint, maxCalls, since)
  if (atomic) return atomic

  const { count, error } = await supabase
    .from('api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', since.toISOString())

  if (error) {
    // On DB error, fail open (allow) to avoid blocking legitimate traffic
    console.error('Rate limit check failed:', error.message)
    return { allowed: true, remaining: maxCalls }
  }

  const used      = count ?? 0
  const remaining = Math.max(0, maxCalls - used)
  return { allowed: used < maxCalls, remaining }
}
