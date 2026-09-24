'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  JOURNEY_DAYS, intensityFor, formatFocus, hasActivity,
  INTENSITY_CLASS, type JourneyDay,
} from '@/lib/journey/types'
import { HEAT_CELL, HeatLegend, WeekdayGutter, weekColumns, dateKey } from '@/components/ui/heat-grid'

export default function JourneyCalendar({ days }: { days: JourneyDay[] }) {
  const [selected, setSelected] = useState<JourneyDay | null>(null)

  const byDate = useMemo(() => new Map(days.map(d => [d.date, d])), [days])

  // 12 Monday-start week columns ending today.
  const weeks = useMemo(() => {
    const today = new Date()
    const first = new Date(today)
    first.setDate(first.getDate() - (JOURNEY_DAYS - 1))
    return weekColumns(first, today)
  }, [])

  const activeDays = days.filter(hasActivity).length

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <p className="text-sm text-text-secondary">
          Son 12 hafta · <span className="tabular">{activeDays}</span> aktif gün
        </p>
        <HeatLegend />
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[2px] min-w-max">
          <WeekdayGutter />
          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[2px]">
              {col.map((date, ri) => {
                if (!date) return <span key={ri} className={HEAT_CELL} />
                const key = dateKey(date)
                const day = byDate.get(key)
                const isSelected = selected?.date === key
                return (
                  <button
                    key={ri}
                    onClick={() => setSelected(day ?? {
                      date: key, focusMinutes: 0, topicsStudied: 0, recallCards: 0, tasksCompleted: 0,
                    })}
                    title={`${key} — ${day ? formatFocus(day.focusMinutes) : '0m'}`}
                    aria-label={`${key}: ${day ? formatFocus(day.focusMinutes) : '0m'} odak`}
                    className={cn(
                      HEAT_CELL, INTENSITY_CLASS[intensityFor(day)],
                      'hover:ring-1 hover:ring-border-strong',
                      isSelected && 'ring-1 ring-text',
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail — one quiet line */}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
              <p className="flex-1 min-w-0 text-sm text-text">
                <span className="font-medium">
                  {new Date(selected.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                </span>
                <span className="text-text-secondary">
                  {hasActivity(selected) ? (
                    <>
                      {' · '}<span className="tabular-nums">{formatFocus(selected.focusMinutes)}</span> focus
                      {' · '}<span className="tabular">{selected.topicsStudied}</span> topics
                      {' · '}<span className="tabular">{selected.recallCards}</span> recall
                      {' · '}<span className="tabular">{selected.tasksCompleted}</span> tasks
                    </>
                  ) : ' · Bu gün kayıtlı aktivite yok.'}
                </span>
              </p>
              <button
                onClick={() => setSelected(null)}
                aria-label="Kapat"
                className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
