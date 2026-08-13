'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DURATION_OPTIONS, TASK_PRIORITY_CONFIG, type TaskPriority, type PlannerTask } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'

interface Props {
  onCreated: (task: PlannerTask) => void
}

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

  return (
    <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Subject */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Subject</label>
          <select
            value={subjectId}
            onChange={e => { setSubjectId(e.target.value); setTopicId('') }}
            className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          >
            <option value="">— Select subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Topic</label>
            <button
              type="button"
              onClick={() => setUseFreeText(v => !v)}
              className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
            >
              {useFreeText ? 'Use dropdown' : 'Type instead'}
            </button>
          </div>
          {useFreeText ? (
            <input
              value={topicText}
              onChange={e => setTopicText(e.target.value)}
              placeholder="Topic name…"
              className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          ) : (
            <select
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              disabled={!subjectId}
              className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 disabled:opacity-50"
            >
              <option value="">— No specific topic</option>
              {(currentSubject?.topics ?? []).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Duration */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration</label>
          <div className="flex gap-1">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  'flex-1 text-[11px] font-bold py-2 rounded-lg border transition-all',
                  duration === d ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50/50 border-border text-gray-500 hover:border-gray-300',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Priority</label>
          <div className="flex gap-1">
            {(Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[]).map(p => {
              const cfg = TASK_PRIORITY_CONFIG[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 text-[11px] font-bold py-2 rounded-lg border transition-all',
                    priority === p ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-gray-50/50 border-border text-gray-500 hover:border-gray-300',
                  )}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={!subjectId || saving}
        whileHover={subjectId ? { scale: 1.01 } : {}}
        whileTap={subjectId ? { scale: 0.98 } : {}}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Task
      </motion.button>
    </div>
  )
}
