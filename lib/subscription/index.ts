import type { SupabaseClient } from '@supabase/supabase-js'
import { consumeRateLimit } from '@/lib/security/rate-limit'

// ─────────────────────────────────────────────────────────────────
// Free/Pro subscription tier. No Stripe yet — tier is a plain column
// on user_profiles, set manually until billing exists (see
// supabase/migrations/noetic_subscriptions.sql). Everything here is
// designed so swapping in real billing later only touches
// getUserTier(), not any of the ~10 call sites that use checkLimit().
// ─────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro'

export type LimitedFeature =
  | 'recallCardsPerDay'    // Recall reviews recorded today
  | 'vaultNotes'           // total notes
  | 'vaultFlashcards'      // total flashcards
  | 'vaultPdfs'            // total PDF uploads (documents table)
  | 'assistRequestsPerDay' // real Claude calls through /api/assist today
  | 'vaultAssist'          // boolean gate — Vault Assist + PDF→flashcards generation
  | 'aiInsights'           // boolean gate — Noetic Insight weekly commentary

/** Pure data — safe to import from client components too. */
export const LIMITS: Record<SubscriptionTier, Record<LimitedFeature, number>> = {
  free: {
    recallCardsPerDay:    20,
    vaultNotes:           10,
    vaultFlashcards:      20,
    vaultPdfs:            1,
    assistRequestsPerDay: 5,
    vaultAssist:          0,
    aiInsights:           0,
  },
  pro: {
    recallCardsPerDay:    Infinity,
    vaultNotes:           Infinity,
    vaultFlashcards:      Infinity,
    vaultPdfs:            Infinity,
    assistRequestsPerDay: 30,
    vaultAssist:          Infinity,
    aiInsights:           Infinity,
  },
}

export async function getUserTier(
  supabase: SupabaseClient,
  userId:   string,
): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from('user_profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  return resolveTier(data)
}

/** Pure tier resolution from a user_profiles row (expired Pro counts as free). */
export function resolveTier(
  row: { subscription_tier?: string | null; subscription_expires_at?: string | null } | null | undefined,
): SubscriptionTier {
  if (!row || row.subscription_tier !== 'pro') return 'free'
  if (row.subscription_expires_at && new Date(row.subscription_expires_at) < new Date()) return 'free'
  return 'pro'
}

export interface LimitCheck {
  tier:      SubscriptionTier
  allowed:   boolean
  limit:     number   // Infinity for unlimited
  used:      number
  remaining: number   // Infinity for unlimited
}

async function countUsage(
  supabase: SupabaseClient,
  userId:   string,
  feature:  LimitedFeature,
): Promise<number> {
  switch (feature) {
    case 'recallCardsPerDay': {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const { count } = await supabase.from('recall_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('reviewed_at', todayStart.toISOString())
      return count ?? 0
    }
    case 'vaultNotes': {
      const { count } = await supabase.from('notes')
        .select('id', { count: 'exact', head: true }).eq('user_id', userId)
      return count ?? 0
    }
    case 'vaultFlashcards': {
      const { count } = await supabase.from('flashcards')
        .select('id', { count: 'exact', head: true }).eq('user_id', userId)
      return count ?? 0
    }
    case 'vaultPdfs': {
      const { count } = await supabase.from('documents')
        .select('id', { count: 'exact', head: true }).eq('user_id', userId)
      return count ?? 0
    }
    case 'assistRequestsPerDay': {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase.from('api_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('endpoint', '/api/assist').gte('created_at', since)
      return count ?? 0
    }
    // Boolean gates — the limit itself (0 or Infinity) is all that matters.
    case 'vaultAssist':
    case 'aiInsights':
      return 0
  }
}

/** Read-only check — never records anything. Use for display (remaining counts). */
export async function checkLimit(
  supabase: SupabaseClient,
  userId:   string,
  feature:  LimitedFeature,
): Promise<LimitCheck> {
  // Count usage concurrently with the tier lookup when the free plan has a
  // finite cap (the count is simply discarded for unlimited tiers).
  const freeLimit = LIMITS.free[feature]
  const [tier, usedEarly] = await Promise.all([
    getUserTier(supabase, userId),
    freeLimit !== Infinity && freeLimit !== 0 ? countUsage(supabase, userId, feature) : Promise.resolve(null),
  ])
  const limit = LIMITS[tier][feature]

  if (limit === Infinity) return { tier, allowed: true, limit, used: 0, remaining: Infinity }
  if (limit === 0)        return { tier, allowed: false, limit, used: 0, remaining: 0 }

  const used = usedEarly ?? await countUsage(supabase, userId, feature)
  return { tier, allowed: used < limit, limit, used, remaining: Math.max(0, limit - used) }
}

/**
 * Atomic check-and-consume for the windowed (per-day) features. Unlike
 * checkLimit, this records the hit in the same DB step as the check, so
 * concurrent requests can't all pass a limit of 1. Falls back to the
 * read-only (non-atomic) checkLimit if consume_rate_limit() isn't
 * deployed yet.
 */
export async function consumeLimit(
  supabase: SupabaseClient,
  userId:   string,
  feature:  'assistRequestsPerDay' | 'recallCardsPerDay',
): Promise<LimitCheck> {
  const tier  = await getUserTier(supabase, userId)
  const limit = LIMITS[tier][feature]

  if (limit === Infinity) return { tier, allowed: true, limit, used: 0, remaining: Infinity }
  if (limit === 0)        return { tier, allowed: false, limit, used: 0, remaining: 0 }

  const since = new Date()
  if (feature === 'recallCardsPerDay') since.setHours(0, 0, 0, 0)   // per calendar day
  else since.setTime(since.getTime() - 24 * 60 * 60 * 1000)          // rolling 24h

  const atomic = await consumeRateLimit(supabase, `feature:${feature}`, limit, since)
  if (atomic) {
    return { tier, allowed: atomic.allowed, limit, used: limit - atomic.remaining, remaining: atomic.remaining }
  }

  return checkLimit(supabase, userId, feature)
}

/**
 * Lifetime caps (notes / flashcards / PDFs) are count-then-insert, so
 * concurrent creates can all pass the pre-insert check. Call this right
 * AFTER a successful insert: if the user is now over their cap (i.e. a
 * concurrent request slipped past), the caller should roll its own row
 * back. Every racer that sees the overshoot rolls back, so the cap can
 * never end up exceeded (worst case, both racers are refused).
 */
export async function isOverCapAfterInsert(
  supabase: SupabaseClient,
  userId:   string,
  tier:     SubscriptionTier,
  feature:  'vaultNotes' | 'vaultFlashcards' | 'vaultPdfs',
): Promise<boolean> {
  const limit = LIMITS[tier][feature]
  if (limit === Infinity) return false
  return (await countUsage(supabase, userId, feature)) > limit
}
