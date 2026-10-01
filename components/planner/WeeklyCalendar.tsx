'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Timer } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_CONFIG, type Exam, type PlannerTask } from '@/lib/planner/types'
import { PRIORITY_DOT, primaryButtonClass } from './ui'
import { addDays, todayStr } from './week'

const DAY_LABELS = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ']

export default function WeeklyCalendar({ weekStart }: { weekStart: string }) {
  const today = todayStr()
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PlannerTask | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const end = addDays(weekStart, 6)
      const res = await fetch(`/api/planner/tasks?start=${weekStart}&end=${end}`)
      const data = await res.json()
      setTasks(data.tasks ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [weekStart])

  useEffect(() => { load() }, [load])

  // Exam dates for the day-column markers (read-only; same endpoint as the Exams tab).
  useEffect(() => {
    fetch('/api/exams')
      .then(r => (r.ok ? r.json() : { exams: [] }))
      .then(d => setExams(d.exams ?? []))
      .catch(() => {})
  }, [])

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div>
      {/* 7 columns; scrolls sideways on narrow screens rather than crushing the chips */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] grid grid-cols-7 rounded-lg border border-border bg-surface overflow-hidden">
          {days.map((date, i) => {
            const dayTasks = tasks.filter(t => t.date === date)
            const dayExams = exams.filter(e => e.exam_date === date)
            const isToday = date === today
            return (
              <div
                key={date}
                className={cn(
                  'min-h-[180px] p-2 flex flex-col gap-1 border-r border-border last:border-r-0',
                  dayExams.length > 0 && 'shadow-[inset_0_2px_0_0_var(--danger)]',
                )}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className={cn('text-[11px] font-medium tracking-[0.08em]', isToday ? 'text-accent' : 'text-text-muted')}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={cn('tabular text-sm', isToday ? 'text-accent font-semibold' : 'text-text-secondary')}>
                    {new Date(date + 'T00:00:00').getDate()}
                  </span>
                </div>

                {dayExams.map(exam => (
                  <p key={exam.id} className="text-[11px] leading-4 font-medium text-danger truncate" title={exam.name}>
                    {exam.name}
                  </p>
                ))}

                {loading ? (
                  <>
                    <div className="h-5 rounded-sm skeleton-shimmer" />
                    <div className="h-5 w-2/3 rounded-sm skeleton-shimmer" />
                  </>
                ) : dayTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setSelected(task)}
                    className={cn(
                      'w-full text-left text-[11px] leading-4 px-1.5 py-0.5 rounded-sm border-l-2 truncate transition-colors duration-[160ms]',
                      task.completed
                        ? 'border-l-border-strong text-text-muted line-through'
                        : 'border-l-accent bg-surface-subtle text-text hover:bg-accent-soft',
                    )}
                  >
                    {task.topics?.title ?? task.topic_text ?? task.subjects?.name ?? 'Görev'}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail popover */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface border border-border rounded-lg p-5 w-full max-w-sm shadow-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-md font-semibold text-text truncate">
                    {selected.subjects?.icon} {selected.subjects?.name}
                  </p>
                  {(selected.topics?.title ?? selected.topic_text) && (
                    <p className="text-sm text-text-secondary truncate">{selected.topics?.title ?? selected.topic_text}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} aria-label="Kapat" className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mb-4">
                <span className="tabular">{selected.duration_minutes} dk</span>
                {selected.priority && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('size-1.5 rounded-full', PRIORITY_DOT[selected.priority])} />
                    {TASK_PRIORITY_CONFIG[selected.priority].label}
                  </span>
                )}
                <span>{new Date(selected.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
              </div>

              {!selected.completed && (
                <Link href={`/dashboard/focus?task=${selected.id}`} className={cn(primaryButtonClass, 'w-full')}>
                  <Timer className="size-4" /> Focus’u başlat
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
