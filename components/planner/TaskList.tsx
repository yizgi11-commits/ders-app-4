'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, Timer, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_CONFIG, type PlannerTask } from '@/lib/planner/types'

interface Props {
  tasks: PlannerTask[]
  onChange: (tasks: PlannerTask[]) => void
}

function fmtDateGroup(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function TaskList({ tasks, onChange }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function toggleComplete(task: PlannerTask) {
    if (busyId) return
    setBusyId(task.id)
    try {
      const res = await fetch(`/api/planner/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      if (!res.ok) return
      const updated = await res.json()
      onChange(tasks.map(t => t.id === task.id ? updated : t))
    } finally { setBusyId(null) }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      await fetch(`/api/planner/tasks/${id}`, { method: 'DELETE' })
      onChange(tasks.filter(t => t.id !== id))
    } finally { setBusyId(null) }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
        <p className="text-3xl mb-3">🗓️</p>
        <p className="text-sm text-muted-foreground">No tasks yet — add one above.</p>
      </div>
    )
  }

  const groups = new Map<string, PlannerTask[]>()
  for (const t of tasks) {
    if (!groups.has(t.date)) groups.set(t.date, [])
    groups.get(t.date)!.push(t)
  }
  const sortedDates = Array.from(groups.keys()).sort()

  return (
    <div className="space-y-5">
      {sortedDates.map(date => {
        const dayTasks = groups.get(date)!
        const pending = dayTasks.filter(t => !t.completed)
        const done = dayTasks.filter(t => t.completed)
        return (
          <div key={date}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{fmtDateGroup(date)}</p>
            <div className="space-y-2">
              {[...pending, ...done].map(task => {
                const busy = busyId === task.id
                const topicLabel = task.topics?.title ?? task.topic_text
                const prioCfg = task.priority ? TASK_PRIORITY_CONFIG[task.priority] : null
                return (
                  <motion.div
                    key={task.id}
                    layout
                    className={cn(
                      'flex items-center gap-3 bg-white border border-border rounded-2xl p-3.5 shadow-sm',
                      task.completed && 'opacity-60',
                    )}
                  >
                    <button onClick={() => toggleComplete(task)} disabled={busy} className="shrink-0">
                      {busy ? (
                        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>

                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: `${task.subjects?.color ?? '#6366f1'}15` }}
                    >
                      {task.subjects?.icon ?? '📚'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold text-gray-900 truncate', task.completed && 'line-through text-muted-foreground')}>
                        {task.subjects?.name ?? 'Subject'}{topicLabel ? ` — ${topicLabel}` : ''}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {task.duration_minutes} min
                        {prioCfg && <span className={cn('ml-2 font-semibold', prioCfg.color)}>{prioCfg.label}</span>}
                      </p>
                    </div>

                    {!task.completed && (
                      <Link
                        href={`/dashboard/focus?task=${task.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-xl transition-colors shrink-0"
                      >
                        <Timer className="w-3.5 h-3.5" /> Start Focus
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={busy}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400/60 hover:text-red-500" />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
