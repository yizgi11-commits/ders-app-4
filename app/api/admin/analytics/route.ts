import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/admin/analytics ───────────────────────────────────────
// Aggregates user_events into activation funnel, D1/D7/D30 retention,
// core-loop completion and top modules. Protected: only the app owner
// can access — the same "auth.email() = owner" RLS policy on
// user_events (supabase/migrations/noetic_analytics.sql) is what lets
// this route see every user's rows without a service-role key.
// Computed on demand from raw rows (no pre-aggregation) — fine at
// this data volume, no realtime dashboard needed.
export const runtime = 'nodejs'

const OWNER_EMAIL = 'yizgi11@gmail.com'

const ACTIVATION_STEPS = [
  'onboarding_completed', 'first_task_created', 'first_focus_completed', 'first_recall_completed',
]
const CORE_LOOP_EVENTS = ['task_completed', 'focus_completed', 'session_reflection_saved', 'recall_completed']
const MODULE_MAP: Record<string, string> = {
  focus_completed:           'Focus',
  session_reflection_saved:  'Focus',
  recall_completed:          'Recall',
  task_completed:            'Tasks',
  weekly_review_viewed:      'Insights',
  learning_score_viewed:     'Insights',
}

const CORE_LOOP_WINDOW_DAYS   = 30
const RETENTION_LOOKBACK_DAYS = 90

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(dateStringYmd: string, n: number): string {
  const d = new Date(dateStringYmd + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return dateStr(d)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== OWNER_EMAIL) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const now            = new Date()
  const windowStart     = new Date(now.getTime() - CORE_LOOP_WINDOW_DAYS * 86_400_000).toISOString()
  const retentionStart  = new Date(now.getTime() - RETENTION_LOOKBACK_DAYS * 86_400_000).toISOString()

  const [activationRes, windowRes, loginRes] = await Promise.all([
    // All-time — these are one-time lifetime milestones, not a rolling window.
    supabase.from('user_events').select('user_id, event_type').in('event_type', ACTIVATION_STEPS),
    // Last 30 days — core-loop completion + module usage are rolling snapshots.
    supabase.from('user_events').select('user_id, event_type, created_at').gte('created_at', windowStart),
    // Last 90 days of logins — enough runway to measure D30 retention.
    supabase.from('user_events').select('user_id, created_at').eq('event_type', 'daily_login').gte('created_at', retentionStart),
  ])

  // ── Activation funnel ──────────────────────────────────────────
  const activationSets: Record<string, Set<string>> = {}
  for (const step of ACTIVATION_STEPS) activationSets[step] = new Set()
  for (const row of (activationRes.data ?? []) as { user_id: string; event_type: string }[]) {
    activationSets[row.event_type]?.add(row.user_id)
  }

  const activationFunnel = ACTIVATION_STEPS.map(step => ({
    step,
    users: activationSets[step].size,
  }))

  const onboardedCount = activationSets.onboarding_completed.size
  const onboardingToFirstFocusPct = onboardedCount > 0
    ? Math.round((activationSets.first_focus_completed.size / onboardedCount) * 100)
    : 0

  // ── Core loop completion + top modules (last 30 days) ───────────
  const windowRows = (windowRes.data ?? []) as { user_id: string; event_type: string; created_at: string }[]
  const eventsByUser = new Map<string, Set<string>>()
  const moduleCounts: Record<string, number> = {}

  for (const row of windowRows) {
    let set = eventsByUser.get(row.user_id)
    if (!set) { set = new Set(); eventsByUser.set(row.user_id, set) }
    set.add(row.event_type)

    const moduleName = MODULE_MAP[row.event_type]
    if (moduleName) moduleCounts[moduleName] = (moduleCounts[moduleName] ?? 0) + 1
  }

  const activeUsers = eventsByUser.size
  let coreLoopUsers = 0
  for (const set of eventsByUser.values()) {
    if (CORE_LOOP_EVENTS.every(e => set.has(e))) coreLoopUsers++
  }
  const coreLoopPct = activeUsers > 0 ? Math.round((coreLoopUsers / activeUsers) * 100) : 0

  const topModules = Object.entries(moduleCounts)
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)

  // ── D1/D7/D30 retention, from daily_login ────────────────────────
  // Cohort day = the earliest daily_login seen for that user within the
  // 90-day lookback (not necessarily their true signup date — fine for
  // a freshly-launched analytics table where there's little history
  // before it anyway). Retention = % of users whose cohort day is far
  // enough in the past that day N is measurable, who logged in again
  // on exactly cohort_day + N.
  const loginRows = (loginRes.data ?? []) as { user_id: string; created_at: string }[]
  const loginDaysByUser = new Map<string, Set<string>>()
  for (const row of loginRows) {
    const day = row.created_at.split('T')[0]
    let set = loginDaysByUser.get(row.user_id)
    if (!set) { set = new Set(); loginDaysByUser.set(row.user_id, set) }
    set.add(day)
  }

  const todayStr = dateStr(now)

  function retentionFor(n: number): number {
    let eligible = 0
    let retained = 0
    for (const days of loginDaysByUser.values()) {
      const cohortDay = Array.from(days).sort()[0]
      const targetDay = addDays(cohortDay, n)
      if (targetDay >= todayStr) continue // day N hasn't happened yet for this cohort
      eligible++
      if (days.has(targetDay)) retained++
    }
    return eligible > 0 ? Math.round((retained / eligible) * 100) : 0
  }

  return NextResponse.json({
    activation: {
      funnel: activationFunnel,
      onboarding_to_first_focus_pct: onboardingToFirstFocusPct,
    },
    retention: {
      d1:  retentionFor(1),
      d7:  retentionFor(7),
      d30: retentionFor(30),
      lookback_days: RETENTION_LOOKBACK_DAYS,
    },
    core_loop: {
      window_days:         CORE_LOOP_WINDOW_DAYS,
      steps:                CORE_LOOP_EVENTS,
      active_users:         activeUsers,
      completed_full_loop:  coreLoopUsers,
      completion_pct:       coreLoopPct,
    },
    top_modules: topModules,
  })
}
