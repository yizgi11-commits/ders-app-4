// ─────────────────────────────────────────────────────────────────
// Command Center — deterministic "what should I do right now" logic.
// No AI call: every decision here is a plain rule over data already
// fetched from /api/dashboard/command-center. Kept isolated from the
// component so the priority ladder is easy to read/audit on its own.
// ─────────────────────────────────────────────────────────────────

import type { Difficulty, DailyTaskWithTemplate } from '@/lib/tasks/types'
import type { PlannerTask, TaskPriority } from '@/lib/planner/types'

export const ESTIMATED_MINUTES: Record<Difficulty, number> = { 1: 25, 2: 45, 3: 60 }

// ── Today's Tasks — system (gamification) + Planner tasks, merged ──
// System tasks carry no explicit priority, so they're treated as
// 'medium' for sorting: a High-priority Planner task surfaces above
// them, a Low-priority one sinks below them.
const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }

export interface TodayTask {
  id:        string
  title:     string
  subject:   string
  completed: boolean
  source:    'system' | 'planner'
  priority:  TaskPriority
  minutes:   number
}

export function mergeTodayTasks(
  systemTasks:  DailyTaskWithTemplate[],
  plannerTasks: PlannerTask[],
): TodayTask[] {
  const fromSystem: TodayTask[] = systemTasks.map(t => ({
    id:        t.id,
    title:     t.task_templates.title,
    subject:   t.task_templates.subject,
    completed: t.completed,
    source:    'system',
    priority:  'medium',
    minutes:   ESTIMATED_MINUTES[t.task_templates.difficulty],
  }))

  const fromPlanner: TodayTask[] = plannerTasks.map(t => ({
    id:        t.id,
    title:     t.topics?.title ?? t.topic_text ?? t.subjects?.name ?? 'Planned task',
    subject:   t.subjects?.name ?? 'Görev',
    completed: t.completed,
    source:    'planner',
    priority:  t.priority ?? 'medium',
    minutes:   t.duration_minutes ?? 30,
  }))

  return [...fromSystem, ...fromPlanner].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  )
}

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
