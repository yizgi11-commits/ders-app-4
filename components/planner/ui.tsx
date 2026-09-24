import type { TaskPriority } from '@/lib/planner/types'

// Shared visual primitives for the Planner tabs.

export const fieldClass =
  'h-9 w-full rounded-md bg-surface border border-border px-3 text-sm text-text placeholder:text-text-muted ' +
  'focus:outline-none focus:border-accent transition-colors duration-[160ms] disabled:opacity-50'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-accent hover:bg-accent-dark text-white ' +
  'text-sm font-medium transition-colors duration-[160ms] disabled:opacity-50 disabled:cursor-not-allowed'

export const textButtonClass =
  'inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]'

/** High = danger, Medium = warning, Low = neutral border. */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high:   'bg-danger',
  medium: 'bg-warning',
  low:    'bg-border-strong',
}

export { SectionLabel } from '@/components/ui/section-label'

export function daysFromToday(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0]
  return Math.round(
    (new Date(dateStr + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86_400_000,
  )
}

export function shortDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
