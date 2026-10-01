'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { DailyFocusStat } from '@/lib/analytics/types'
import { INTENSITY_CLASS, intensityForMinutes } from '@/lib/journey/types'
import { SectionLabel } from '@/components/ui/section-label'
import { HEAT_CELL, HeatLegend, WeekdayGutter, weekColumns, dateKey } from '@/components/ui/heat-grid'

interface Props { data: DailyFocusStat[] }  // last 30 days

// Same grid as the Journey calendar: Monday-start week columns, 12px cells.
export default function FocusHeatmap({ data }: Props) {
  const byDate = useMemo(() => new Map(data.map(d => [d.date, d.focus_minutes])), [data])

  const weeks = useMemo(() => {
    if (data.length === 0) return []
    return weekColumns(
      new Date(data[0].date + 'T00:00:00'),
      new Date(data[data.length - 1].date + 'T00:00:00'),
    )
  }, [data])

  const activeDays = data.filter(d => d.focus_minutes > 0).length
  const totalHours = Math.round(data.reduce((s, d) => s + d.focus_minutes, 0) / 60 * 10) / 10

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>ÇALIŞMA HARİTASI</SectionLabel>
        <HeatLegend />
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex gap-[2px] min-w-max">
          <WeekdayGutter />
          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[2px]">
              {col.map((date, ri) => {
                if (!date) return <span key={ri} className={HEAT_CELL} />
                const key = dateKey(date)
                const mins = byDate.get(key) ?? 0
                return (
                  <span
                    key={ri}
                    title={`${key}: ${mins} dk`}
                    className={cn(HEAT_CELL, INTENSITY_CLASS[intensityForMinutes(mins)])}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 pt-3 border-t border-border text-xs text-text-muted">
        Aktif günler <span className="tabular text-text">{activeDays}/{data.length}</span>
        {' · '}Toplam <span className="tabular text-text">{totalHours}</span> saat
      </p>
    </div>
  )
}
