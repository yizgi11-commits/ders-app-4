'use client'

import { cn } from '@/lib/utils'
import type { AnalyticsData } from '@/lib/analytics/types'
import { SectionLabel } from '@/components/ui/section-label'

function fmtFocus(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

// This week at a glance — one divided row, no tiles.
export default function WeekMetrics({ data }: { data: AnalyticsData }) {
  const w = data.weeklyComparison

  const stats: { label: string; value: string; delta?: number | null; hint?: string }[] = [
    { label: 'Focus',       value: fmtFocus(w.this_week_minutes), delta: w.minutes_change_pct },
    { label: 'Completion',  value: `%${data.productivityScore.task_completion}` },
    { label: 'Recall',      value: `%${data.recallWeek.successRate}`, hint: data.recallWeek.total > 0 ? `${data.recallWeek.total} tekrar` : 'tekrar yok' },
    { label: 'Consistency', value: `%${data.productivityScore.consistency}`, hint: `${data.currentStreak} gün seri` },
  ]

  return (
    <div>
      <SectionLabel className="mb-3">THIS WEEK</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 sm:divide-x sm:divide-border">
        {stats.map(s => (
          <div key={s.label} className="sm:px-5 sm:first:pl-0">
            <p className="flex items-baseline gap-2">
              <span className="tabular text-xl text-text">{s.value}</span>
              {s.delta != null && s.delta !== 0 && (
                <span className={cn('tabular text-xs', s.delta > 0 ? 'text-success' : 'text-danger')}>
                  {s.delta > 0 ? '+' : '−'}{Math.abs(s.delta)}%
                </span>
              )}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            {s.hint && <p className="text-[11px] text-text-muted mt-0.5">{s.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
