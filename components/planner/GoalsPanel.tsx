'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Target, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Goal } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'

function daysUntil(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0]
  const d1 = new Date(today + 'T00:00:00')
  const d2 = new Date(dateStr + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / 86400000)
}

function fmtDeadline(dateStr: string | null): string {
  if (!dateStr) return 'No deadline'
  const days = daysUntil(dateStr)
  const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days < 0) return `${label} (overdue)`
  if (days === 0) return `${label} (today)`
  return `${label} (${days} day${days !== 1 ? 's' : ''} away)`
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

  if (loading) return <div className="h-40 bg-white border border-border rounded-2xl animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Goals</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          <Plus className="w-3.5 h-3.5" /> New Goal
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-2.5">
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder='Goal title — e.g. "Finish TYT Functions"'
                className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                >
                  <option value="">— Subject (optional)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <input
                  type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
          <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No goals yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map(goal => {
            const pct = goal.progress_pct ?? goal.manual_progress_pct
            return (
              <div key={goal.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Goal: <span className="text-gray-900 normal-case">{goal.title}</span>
                  </p>
                  <button onClick={() => handleDelete(goal.id)} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50">
                    <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-500" />
                  </button>
                </div>

                <p className="text-sm font-semibold text-gray-700 mb-2">Progress: {pct}%</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Deadline: {fmtDeadline(goal.deadline)}</p>
                  {!goal.topic_id && (
                    <div className="flex gap-1">
                      <button onClick={() => adjustProgress(goal, -10)} className="w-6 h-6 rounded-md bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-500">−</button>
                      <button onClick={() => adjustProgress(goal, 10)} className="w-6 h-6 rounded-md bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-500">+</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
