'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURATION_OPTIONS, TASK_PRIORITY_CONFIG, type TaskPriority, type PlannerTask } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import { fieldClass, primaryButtonClass, PRIORITY_DOT } from './ui'

interface Props {
  onCreated: (task: PlannerTask) => void
}

// Inline creation form — always visible at the top of the Tasks tab.
export default function TaskForm({ onCreated }: Props) {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [topicText, setTopicText] = useState('')
  const [useFreeText, setUseFreeText] = useState(false)
  const [duration, setDuration] = useState<typeof DURATION_OPTIONS[number]>(30)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? [])).catch(() => {})
  }, [])

  const currentSubject = subjects.find(s => s.id === subjectId)

  async function handleSubmit() {
    if (!subjectId || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/planner/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          topic_id: useFreeText ? null : (topicId || null),
          topic_text: useFreeText ? topicText.trim() : null,
          duration_minutes: duration,
          date,
          priority,
        }),
      })
      if (!res.ok) return
      const task = await res.json()
      onCreated(task)
      setTopicId(''); setTopicText('')
    } finally { setSaving(false) }
  }

  const optionClass = (active: boolean) => cn(
    'transition-colors duration-[160ms]',
    active ? 'text-accent font-medium' : 'text-text-muted hover:text-text-secondary',
  )

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_150px] gap-2">
        <select
          value={subjectId}
          onChange={e => { setSubjectId(e.target.value); setTopicId('') }}
          aria-label="Ders"
          className={fieldClass}
        >
          <option value="">— Select subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>

        {useFreeText ? (
          <input
            value={topicText}
            onChange={e => setTopicText(e.target.value)}
            placeholder="Topic name…"
            aria-label="Konu"
            className={fieldClass}
          />
        ) : (
          <select
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            disabled={!subjectId}
            aria-label="Konu"
            className={fieldClass}
          >
            <option value="">— No specific topic</option>
            {(currentSubject?.topics ?? []).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          aria-label="Tarih"
          className={cn(fieldClass, 'tabular-nums')}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <div className="flex items-center gap-2.5" role="group" aria-label="Süre">
          <span className="text-xs text-text-muted">Duration</span>
          {DURATION_OPTIONS.map(d => (
            <button key={d} type="button" onClick={() => setDuration(d)} aria-pressed={duration === d}
              className={cn('tabular', optionClass(duration === d))}
            >
              {d}
            </button>
          ))}
          <span className="text-xs text-text-muted">min</span>
        </div>

        <div className="flex items-center gap-3" role="group" aria-label="Öncelik">
          <span className="text-xs text-text-muted">Priority</span>
          {(Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[]).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)} aria-pressed={priority === p}
              className={cn('inline-flex items-center gap-1.5', optionClass(priority === p))}
            >
              <span className={cn('size-1.5 rounded-full', PRIORITY_DOT[p])} />
              {TASK_PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setUseFreeText(v => !v)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-[160ms]"
        >
          {useFreeText ? 'Pick topic from list' : 'Type topic instead'}
        </button>

        <button onClick={handleSubmit} disabled={!subjectId || saving} className={cn(primaryButtonClass, 'ml-auto h-8 px-3')}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Add task
        </button>
      </div>
    </div>
  )
}
