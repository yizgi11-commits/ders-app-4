import type { SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────
// Lightweight, first-party product analytics — one row per event in
// user_events (supabase/migrations/noetic_analytics.sql). No
// third-party service, no realtime dashboard: call sites fire this
// and move on, app/api/admin/analytics/route.ts reads it back later.
// ─────────────────────────────────────────────────────────────────

export type EventType =
  // Activation — each fires at most once per user (call sites check first)
  | 'onboarding_completed'
  | 'first_task_created'
  | 'first_focus_completed'
  | 'first_recall_completed'
  // Daily loop
  | 'focus_completed'
  | 'recall_completed'
  | 'task_completed'
  | 'session_reflection_saved'
  // Retention signals
  | 'daily_login'
  | 'weekly_review_viewed'
  | 'learning_score_viewed'

/**
 * Fire-and-forget by design: never throws, so a broken analytics
 * write can't fail the user-facing action it's attached to. Call
 * sites should generally not `await` this (`void trackEvent(...)`),
 * except where they need the write to land before responding.
 */
export async function trackEvent(
  supabase:  SupabaseClient,
  userId:    string,
  eventType: EventType,
  metadata:  Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from('user_events').insert({
      user_id:    userId,
      event_type: eventType,
      metadata,
    })
  } catch {
    // Swallow — analytics is never allowed to break the real action.
  }
}

/**
 * daily_login, deduped to once per calendar day per user. Called from
 * the dashboard layout, so it runs on every navigation — cheap: one
 * indexed SELECT, and the INSERT only happens the first time each day.
 */
export async function trackDailyLogin(
  supabase: SupabaseClient,
  userId:   string,
): Promise<void> {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: existing } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'daily_login')
      .gte('created_at', todayStart.toISOString())
      .limit(1)
      .maybeSingle()

    if (!existing) {
      await supabase.from('user_events').insert({
        user_id: userId, event_type: 'daily_login', metadata: {},
      })
    }
  } catch {
    // Swallow — analytics is never allowed to break the real action.
  }
}
