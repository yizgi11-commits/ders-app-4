// ─────────────────────────────────────────────────────────────────
// Learning Score — Noetic's core feedback-loop number (0-100).
// Pure computation only: every input is a count the caller already
// fetched from Supabase for a 7-day window. No DB access, no AI —
// plain, explainable math.
//
// Each component is 0 when its denominator is 0 (nothing to measure
// yet), rather than being excluded from the average — a new user
// with no data sees an honest low score, not an inflated one.
// ─────────────────────────────────────────────────────────────────

export interface LearningScoreBreakdown {
  focus:       number   // 0-100 — actual focus minutes vs goal
  recall:      number   // 0-100 — reviews completed vs reviews that came due
  completion:  number   // 0-100 — tasks completed vs tasks created
  consistency: number   // 0-100 — active days / 7
}

export interface LearningScoreResult {
  score:     number   // 0-100 — weighted average of the breakdown
  breakdown: LearningScoreBreakdown
}

export interface LearningScoreInput {
  /** Actual focus minutes logged across the 7-day window. */
  focusMinutes:        number
  /** Goal for the window: daily goal (minutes) × 7. */
  plannedFocusMinutes: number
  /** recall_reviews completed within the window. */
  reviewsDone:         number
  /** Flashcards that became due within the window and are still unreviewed. */
  reviewsOverdue:      number
  /** daily_tasks rows created within the window. */
  tasksCreated:        number
  /** Of those, how many are completed. */
  tasksCompleted:      number
  /** Distinct days (0-7) in the window with focus or recall activity. */
  activeDays:          number
}

const WEIGHTS = { focus: 0.25, recall: 0.30, completion: 0.25, consistency: 0.20 } as const

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)))
}

export function computeLearningScore(input: LearningScoreInput): LearningScoreResult {
  const breakdown: LearningScoreBreakdown = {
    focus:       pct(input.focusMinutes, input.plannedFocusMinutes),
    recall:      pct(input.reviewsDone, input.reviewsDone + input.reviewsOverdue),
    completion:  pct(input.tasksCompleted, input.tasksCreated),
    consistency: pct(input.activeDays, 7),
  }

  const score = Math.round(
    breakdown.focus * WEIGHTS.focus +
    breakdown.recall * WEIGHTS.recall +
    breakdown.completion * WEIGHTS.completion +
    breakdown.consistency * WEIGHTS.consistency
  )

  return { score, breakdown }
}
