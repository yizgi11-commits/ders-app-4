'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// `Map` is aliased — the lucide icon otherwise shadows the global Map constructor.
import { CalendarDays, X, Clock, Map as MapIcon, Brain, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  JOURNEY_DAYS, intensityFor, formatFocus, hasActivity,
  INTENSITY_CLASS, INTENSITY_LABEL,
  type JourneyDay, type IntensityLevel,
} from '@/lib/journey/types'

const DAY_LABELS = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz']

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function JourneyCalendar({ days }: { days: JourneyDay[] }) {
  const [selected, setSelected] = useState<JourneyDay | null>(null)

  const byDate = useMemo(() => new Map(days.map(d => [d.date, d])), [days])

  // Build 12 columns of 7 days ending today, aligned so each column is a
  // Monday-start week.
  const weeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Walk back to the Monday of the week containing (today - 83 days).
    const first = new Date(today)
    first.setDate(first.getDate() - (JOURNEY_DAYS - 1))
    const offset = (first.getDay() + 6) % 7   // Monday = 0
    first.setDate(first.getDate() - offset)

    const cols: (Date | null)[][] = []
    const cursor = new Date(first)
    while (cursor <= today) {
      const col: (Date | null)[] = []
      for (let i = 0; i < 7; i++) {
        col.push(cursor > today ? null : new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      cols.push(col)
    }
    return cols
  }, [])

  const activeDays = days.filter(hasActivity).length

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            Journey Calendar
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Son 12 hafta · {activeDays} aktif gün
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-0.5">Az</span>
          {([0, 1, 2, 3] as IntensityLevel[]).map(l => (
            <span
              key={l}
              title={INTENSITY_LABEL[l]}
              className={cn('w-3 h-3 rounded-sm border', INTENSITY_CLASS[l])}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">Çok</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-max">
          {/* Weekday gutter */}
          <div className="flex flex-col gap-1 pr-1">
            {DAY_LABELS.map((label, i) => (
              <span key={i} className="h-3.5 text-[9px] text-muted-foreground/60 leading-[14px] w-6 text-right">
                {label}
              </span>
            ))}
          </div>

          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((date, ri) => {
                if (!date) return <span key={ri} className="w-3.5 h-3.5" />
                const key = toKey(date)
                const day = byDate.get(key)
                const level = intensityFor(day)
                const isSelected = selected?.date === key
                return (
                  <button
                    key={ri}
                    onClick={() => setSelected(day ?? {
                      date: key, focusMinutes: 0, topicsStudied: 0, recallCards: 0, tasksCompleted: 0,
                    })}
                    title={`${key} — ${day ? formatFocus(day.focusMinutes) : '0m'}`}
                    className={cn(
                      'w-3.5 h-3.5 rounded-sm border transition-all hover:ring-2 hover:ring-indigo-300',
                      INTENSITY_CLASS[level],
                      isSelected && 'ring-2 ring-indigo-500',
                    )}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">
                  {new Date(selected.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
                  })}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {hasActivity(selected) ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Detail icon={Clock}        label="Focus"   value={formatFocus(selected.focusMinutes)} />
                  <Detail icon={MapIcon}      label="Topics"  value={String(selected.topicsStudied)} />
                  <Detail icon={Brain}        label="Recall"  value={String(selected.recallCards)} />
                  <Detail icon={CheckCircle2} label="Tasks"   value={String(selected.tasksCompleted)} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Bu gün kayıtlı aktivite yok.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Detail({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string
}) {
  return (
    <div className="bg-gray-50/70 border border-border rounded-xl p-3">
      <Icon className="w-3.5 h-3.5 text-indigo-500 mb-1.5" />
      <p className="text-base font-black text-gray-900 tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
