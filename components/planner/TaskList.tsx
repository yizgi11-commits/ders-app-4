'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Timer, Trash2, CalendarDays, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_CONFIG, type PlannerTask } from '@/lib/planner/types'
import { PRIORITY_DOT, SectionLabel } from './ui'
import { EmptyState, StateAction, AnimatedCheck } from '@/components/ui/states'

interface Props {
  tasks: PlannerTask[]
  onChange: (tasks: PlannerTask[]) => void
}

function fmtDateGroup(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Bugün'
  if (dateStr === tomorrow) return 'Yarın'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'long' })
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
      <EmptyState icon={CalendarDays} title="Bugün için plan oluşturulmadı." description="Yukarıdaki formdan ilk görevini ekleyebilirsin." className="border-y border-border">
        <StateAction onClick={() => document.getElementById('planner-task-subject')?.focus()}>
          <Plus className="size-3.5" /> Görev ekle
        </StateAction>
      </EmptyState>
    )
  }

  const groups = new Map<string, PlannerTask[]>()
  for (const t of tasks) {
    if (!groups.has(t.date)) groups.set(t.date, [])
    groups.get(t.date)!.push(t)
  }
  const sortedDates = Array.from(groups.keys()).sort()

  return (
    <div className="space-y-8">
      {sortedDates.map(date => {
        const dayTasks = groups.get(date)!
        const pending = dayTasks.filter(t => !t.completed)
        const done = dayTasks.filter(t => t.completed)
        return (
          <section key={date}>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <SectionLabel>{fmtDateGroup(date).toLocaleUpperCase('tr-TR')}</SectionLabel>
              <span className="tabular text-sm text-text-secondary">{done.length} / {dayTasks.length}</span>
            </div>
            <ul>
              {[...pending, ...done].map(task => {
                const busy = busyId === task.id
                const topicLabel = task.topics?.title ?? task.topic_text
                const title = topicLabel ?? task.subjects?.name ?? 'Görev'
                return (
                  <li key={task.id} className="group h-12 flex items-center gap-3 border-b border-border">
                    {task.priority ? (
                      <span
                        className={cn('size-1.5 rounded-full shrink-0', PRIORITY_DOT[task.priority])}
                        title={`${TASK_PRIORITY_CONFIG[task.priority].label} öncelik`}
                      />
                    ) : <span className="size-1.5 shrink-0" />}

                    <button
                      onClick={() => toggleComplete(task)}
                      disabled={busy}
                      role="checkbox"
                      aria-checked={task.completed}
                      aria-label={`${title} — ${task.completed ? 'tamamlanmadı olarak işaretle' : 'tamamlandı olarak işaretle'}`}
                      className={cn(
                        'size-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors duration-200',
                        task.completed ? 'bg-accent border-accent' : 'bg-surface border-border-strong hover:border-accent',
                      )}
                    >
                      {busy
                        ? <Loader2 className="size-3 text-accent animate-spin" />
                        : task.completed && <AnimatedCheck className="text-white" />}
                    </button>

                    <span className={cn(
                      'flex-1 min-w-0 truncate text-base font-medium transition-colors duration-200',
                      task.completed ? 'line-through text-text-muted' : 'text-text',
                    )}>
                      {title}
                    </span>

                    {topicLabel && task.subjects?.name && (
                      <span className="shrink-0 max-w-[140px] truncate rounded-sm bg-accent-soft text-accent text-[11px] font-medium px-1.5 py-0.5">
                        {task.subjects.name}
                      </span>
                    )}

                    <span className="tabular text-sm text-text-muted shrink-0">{task.duration_minutes} dk</span>

                    {!task.completed && (
                      <Link
                        href={`/dashboard/focus?task=${task.id}`}
                        className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
                      >
                        <Timer className="size-3.5" /> Focus
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={busy}
                      aria-label={`${title} görevini sil`}
                      className="hit-area shrink-0 p-1 rounded-sm text-text-muted hover:text-danger transition-[color,opacity] duration-[160ms] sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
