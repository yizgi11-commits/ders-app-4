// ─────────────────────────────────────────────────────────────────
// Command Center — deterministic "what should I do right now" logic.
// No AI call: every decision here is a plain rule over data already
// fetched from /api/dashboard/command-center. Kept isolated from the
// component so the priority ladder is easy to read/audit on its own.
// ─────────────────────────────────────────────────────────────────

export type NextActionKind = 'review' | 'exam' | 'task' | 'focus' | 'plan'

export interface NextAction {
  kind: NextActionKind
  text: string
  href: string
}

export interface NextActionInput {
  reviewsDue:    number
  reviewHint:    { topicTitle: string | null; estimatedMinutes: number } | null
  nearestExam:   { name: string; daysAway: number } | null
  firstIncompleteTask: { id: string; subject: string; title: string } | null
  todayMinutes:  number
}

/**
 * Priority ladder, exactly as specified: a review due today outranks
 * everything (forgetting is the costliest failure mode), then an
 * imminent exam, then unfinished daily work, then "just start
 * something", then — if the day is genuinely done — look ahead.
 */
export function computeNextAction({
  reviewsDue, reviewHint, nearestExam, firstIncompleteTask, todayMinutes,
}: NextActionInput): NextAction {
  if (reviewsDue > 0) {
    const subject = reviewHint?.topicTitle ? `Review ${reviewHint.topicTitle}` : 'Review your cards'
    const minutes = reviewHint?.estimatedMinutes ?? 10
    return { kind: 'review', text: `${subject} — ~${minutes} min`, href: '/dashboard/recall' }
  }

  if (nearestExam && nearestExam.daysAway >= 0 && nearestExam.daysAway < 3) {
    return { kind: 'exam', text: `Prepare for ${nearestExam.name}`, href: '/dashboard/planner' }
  }

  if (firstIncompleteTask) {
    return {
      kind: 'task',
      text: `Continue ${firstIncompleteTask.subject} — ${firstIncompleteTask.title}`,
      href: `/dashboard/focus?task=${firstIncompleteTask.id}`,
    }
  }

  if (todayMinutes === 0) {
    return { kind: 'focus', text: 'Start Focus Session', href: '/dashboard/focus' }
  }

  return { kind: 'plan', text: 'Plan Tomorrow', href: '/dashboard/planner' }
}

/** Review > Focus — used by "Start Today's Session". */
export function startSessionHref(reviewsDue: number, firstIncompleteTaskId: string | null): string {
  if (reviewsDue > 0) return '/dashboard/recall'
  return firstIncompleteTaskId ? `/dashboard/focus?task=${firstIncompleteTaskId}` : '/dashboard/focus'
}
