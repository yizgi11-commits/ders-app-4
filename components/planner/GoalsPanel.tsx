'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Goal } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import { fieldClass, primaryButtonClass, textButtonClass, SectionLabel, daysFromToday, shortDate } from './ui'

/** "Aug 20 (12 days)" */
function fmtDeadline(dateStr: string | null): string {
  if (!dateStr) return 'Son tarih yok'
  const days = daysFromToday(dateStr)
  const label = shortDate(dateStr)
  if (days < 0) return `${label} (gecikti)`
  if (days === 0) return `${label} (bugün)`
  return `${label} (${days} gün)`
}

export default function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [goalsRes, subRes] = await Promise.all([fetch('/api/goals'), fetch('/api/subjects')])
      const goalsData = await goalsRes.json()
      const subData = await subRes.json()
      setGoals(goalsData.goals ?? [])
      setSubjects(subData.subjects ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), subject_id: subjectId || null, deadline: deadline || null }),
      })
      if (!res.ok) return
      const goal = await res.json()
      setGoals(prev => [...prev, goal])
      setTitle(''); setSubjectId(''); setDeadline(''); setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function adjustProgress(goal: Goal, delta: number) {
    const next = Math.max(0, Math.min(100, (goal.progress_pct ?? goal.manual_progress_pct) + delta))
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, progress_pct: next, manual_progress_pct: next } : g))
    await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_progress_pct: next }),
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map(i => <div key={i} className="h-16 rounded-md skeleton-shimmer" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <SectionLabel>HEDEFLER</SectionLabel>
        <button onClick={() => setShowForm(v => !v)} className={textButtonClass}>
          <Plus className="size-3.5" /> Yeni hedef
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 rounded-lg border border-border bg-surface p-3 space-y-2">
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder='Hedef başlığı — örn. "TYT Fonksiyonlar’ı bitir"'
                aria-label="Hedef başlığı"
                className={fieldClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-2">
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} aria-label="Ders" className={fieldClass}>
                  <option value="">— Ders (isteğe bağlı)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <input
                  type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  aria-label="Son tarih"
                  className={cn(fieldClass, 'tabular-nums')}
                />
                <button onClick={handleCreate} disabled={!title.trim() || saving} className={primaryButtonClass}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Hedef ekle
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <p className="text-sm text-text-muted py-4 border-b border-border">Henüz hedef yok.</p>
      ) : (
        <ul>
          {goals.map(goal => {
            const pct = goal.progress_pct ?? goal.manual_progress_pct
            return (
              <li key={goal.id} className="group py-4 border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-md font-semibold text-text truncate">{goal.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {!goal.topic_id && (
                      <>
                        <button onClick={() => adjustProgress(goal, -10)} aria-label="İlerlemeyi %10 azalt"
                          className="size-6 rounded-md border border-border text-sm text-text-secondary hover:text-text hover:border-border-strong">−</button>
                        <button onClick={() => adjustProgress(goal, 10)} aria-label="İlerlemeyi %10 artır"
                          className="size-6 rounded-md border border-border text-sm text-text-secondary hover:text-text hover:border-border-strong">+</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(goal.id)} aria-label={`${goal.title} hedefini sil`}
                      className="ml-1 p-1 rounded-sm text-text-muted hover:text-danger transition-[color,opacity] duration-[160ms] sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 h-1 rounded-full bg-border overflow-hidden">
                  <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-accent')} style={{ width: `${pct}%` }} />
                </div>

                <p className="mt-2 text-sm text-text-muted">
                  <span className="tabular">%{pct}</span>
                  {goal.subjects?.name && <> · {goal.subjects.name}</>}
                  {' · '}<span className="tabular-nums">{fmtDeadline(goal.deadline)}</span>
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
