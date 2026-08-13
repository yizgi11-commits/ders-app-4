'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Timer } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_CONFIG, type PlannerTask } from '@/lib/planner/types'

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyCalendar() {
  const today = new Date().toISOString().split('T')[0]
  const [weekStart, setWeekStart] = useState(getWeekStart(today))
  const [tasks, setTasks] = useState<PlannerTask[]>([])
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

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-3">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <p className="text-sm font-semibold text-gray-700">
          {new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(addDays(weekStart, 6) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, i) => {
          const dayTasks = tasks.filter(t => t.date === date)
          const isToday = date === today
          return (
            <div
              key={date}
              className={cn(
                'bg-white border rounded-xl p-2 min-h-[130px] flex flex-col gap-1.5',
                isToday ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-border',
              )}
            >
              <p className={cn('text-[10px] font-bold uppercase tracking-wide', isToday ? 'text-indigo-600' : 'text-muted-foreground')}>
                {DAY_LABELS[i]}
              </p>
              <p className={cn('text-sm font-black', isToday ? 'text-indigo-600' : 'text-gray-800')}>
                {new Date(date + 'T00:00:00').getDate()}
              </p>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {loading ? null : dayTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => setSelected(task)}
                    className={cn(
                      'w-full text-left text-[10px] font-medium px-1.5 py-1 rounded-md truncate transition-opacity',
                      task.completed ? 'bg-gray-100 text-muted-foreground line-through opacity-70' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
                    )}
                  >
                    {task.subjects?.icon} {task.subjects?.name ?? 'Task'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail popover */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${selected.subjects?.color ?? '#6366f1'}15` }}>
                    {selected.subjects?.icon ?? '📚'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selected.subjects?.name}</p>
                    {(selected.topics?.title ?? selected.topic_text) && (
                      <p className="text-xs text-muted-foreground">{selected.topics?.title ?? selected.topic_text}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span>{selected.duration_minutes} min</span>
                {selected.priority && (
                  <span className={cn('font-semibold px-2 py-0.5 rounded-full border', TASK_PRIORITY_CONFIG[selected.priority].bg, TASK_PRIORITY_CONFIG[selected.priority].border, TASK_PRIORITY_CONFIG[selected.priority].color)}>
                    {TASK_PRIORITY_CONFIG[selected.priority].label}
                  </span>
                )}
                <span>{new Date(selected.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>

              {!selected.completed && (
                <Link
                  href={`/dashboard/focus?task=${selected.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                >
                  <Timer className="w-4 h-4" /> Start Focus
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
