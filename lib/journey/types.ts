// ─────────────────────────────────────────────────────────────────
// Journey — day-by-day learning history
// ─────────────────────────────────────────────────────────────────

/** How many days of history the timeline + contribution graph cover. */
export const JOURNEY_DAYS = 84   // 12 weeks

export interface JourneyDay {
  date:           string   // YYYY-MM-DD
  focusMinutes:   number
  topicsStudied:  number
  recallCards:    number
  tasksCompleted: number
}

export interface JourneyResponse {
  days: JourneyDay[]
  xp: {
    level:    number
    totalXp:  number
    current:  number
    required: number
    pct:      number
  }
  streak: {
    current: number
    longest: number
  }
  unlocked: { achievement_id: string; unlocked_at: string }[]
}

/** Contribution-graph intensity buckets, keyed off focus minutes. */
export type IntensityLevel = 0 | 1 | 2 | 3

/** Focus-minute buckets shared by the Journey calendar and the Insights heatmap. */
export function intensityForMinutes(m: number): IntensityLevel {
  if (m <= 0) return 0
  if (m < 30) return 1
  if (m < 90) return 2
  return 3
}

export function intensityFor(day: JourneyDay | undefined): IntensityLevel {
  if (!day) return 0
  const m = day.focusMinutes
  // A day with activity but no logged focus time still counts as light,
  // otherwise recall-only or task-only days would look empty.
  if (m === 0) {
    return day.recallCards > 0 || day.tasksCompleted > 0 || day.topicsStudied > 0 ? 1 : 0
  }
  return intensityForMinutes(m)
}

/** Empty #F0F0EC · light #C7D4FF · medium #7B93FF · dark #315CFF */
export const INTENSITY_CLASS: Record<IntensityLevel, string> = {
  0: 'bg-surface-subtle',
  1: 'bg-accent-muted',
  2: 'bg-dark-accent',
  3: 'bg-accent',
}

export const INTENSITY_LABEL: Record<IntensityLevel, string> = {
  0: 'Çalışılmadı',
  1: '0–30 dk',
  2: '30–90 dk',
  3: '90+ dk',
}

export function hasActivity(day: JourneyDay): boolean {
  return day.focusMinutes > 0 || day.recallCards > 0 || day.tasksCompleted > 0 || day.topicsStudied > 0
}

export function formatFocus(minutes: number): string {
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDayHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    .toUpperCase()
}
