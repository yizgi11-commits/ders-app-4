import type { SupabaseClient } from '@supabase/supabase-js'

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

  if (!data || data.subscription_tier !== 'pro') return 'free'
  if (data.subscription_expires_at && new Date(data.subscription_expires_at) < new Date()) return 'free'
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

export async function checkLimit(
  supabase: SupabaseClient,
  userId:   string,
  feature:  LimitedFeature,
): Promise<LimitCheck> {
  const tier  = await getUserTier(supabase, userId)
  const limit = LIMITS[tier][feature]

  if (limit === Infinity) return { tier, allowed: true, limit, used: 0, remaining: Infinity }
  if (limit === 0)        return { tier, allowed: false, limit, used: 0, remaining: 0 }

  const used = await countUsage(supabase, userId, feature)
  return { tier, allowed: used < limit, limit, used, remaining: Math.max(0, limit - used) }
}
