import { cn } from '@/lib/utils'
import { INTENSITY_CLASS, INTENSITY_LABEL, type IntensityLevel } from '@/lib/journey/types'

// Shared contribution-grid primitives — Journey calendar + Insights study heatmap.
// 12px cells, 2px gap, 2px radius, no borders or shadows.

export const HEAT_CELL = 'size-3 rounded-[2px]'

const WEEKDAY_GUTTER = ['Pzt', '', 'Çar', '', 'Cum', '', '']

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Monday-start week columns covering [from, to] (local dates). Slots
 * before `from` / after `to` are null so the grid stays rectangular.
 */
export function weekColumns(from: Date, to: Date): (Date | null)[][] {
  const start = new Date(from); start.setHours(0, 0, 0, 0)
  const end   = new Date(to);   end.setHours(0, 0, 0, 0)
  const first = new Date(start)
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7))   // back to Monday

  const cols: (Date | null)[][] = []
  const cursor = new Date(first)
  while (cursor <= end) {
    const col: (Date | null)[] = []
    for (let i = 0; i < 7; i++) {
      col.push(cursor < start || cursor > end ? null : new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    cols.push(col)
  }
  return cols
}

/** Weekday labels down the left edge, aligned to 12px rows with a 2px gap. */
export function WeekdayGutter() {
  return (
    <div className="flex flex-col gap-[2px] pr-1.5">
      {WEEKDAY_GUTTER.map((label, i) => (
        <span key={i} className="h-3 w-6 text-right text-[9px] leading-3 text-text-muted">{label}</span>
      ))}
    </div>
  )
}

export function HeatLegend() {
  return (
    <div className="flex items-center gap-[2px] text-[11px] text-text-muted">
      <span className="mr-1">Az</span>
      {([0, 1, 2, 3] as IntensityLevel[]).map(l => (
        <span key={l} title={INTENSITY_LABEL[l]} className={cn(HEAT_CELL, INTENSITY_CLASS[l])} />
      ))}
      <span className="ml-1">Çok</span>
    </div>
  )
}
