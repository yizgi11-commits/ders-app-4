'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, GraduationCap, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Exam } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'

function daysAway(dateStr: string): number {
  const today = new Date().toISOString().split('T')[0]
  const d1 = new Date(today + 'T00:00:00')
  const d2 = new Date(dateStr + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / 86400000)
}

export default function ExamsPanel() {
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [examRes, subRes] = await Promise.all([fetch('/api/exams'), fetch('/api/subjects')])
      const examData = await examRes.json()
      const subData = await subRes.json()
      setExams(examData.exams ?? [])
      setSubjects(subData.subjects ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!name.trim() || !examDate || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), exam_date: examDate, subject_id: subjectId || null }),
      })
      if (!res.ok) return
      const exam = await res.json()
      setExams(prev => [...prev, exam].sort((a, b) => a.exam_date.localeCompare(b.exam_date)))
      setName(''); setExamDate(''); setSubjectId(''); setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/exams/${id}`, { method: 'DELETE' })
    setExams(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <div className="h-40 bg-white border border-border rounded-2xl animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Exams</p>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          <Plus className="w-3.5 h-3.5" /> Add Exam
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-2.5">
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Exam name — e.g. Physics Exam"
                className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                  className="text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                />
                <select
                  value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                >
                  <option value="">— Subject (optional)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !examDate || saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Exam
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {exams.length === 0 ? (
        <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
          <GraduationCap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No exams added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exams.map(exam => {
            const days = daysAway(exam.exam_date)
            return (
              <div key={exam.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {exam.subjects?.name ?? exam.name}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{exam.name}</p>
                    <p className={cn('text-xs mt-1', days <= 3 ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>
                      {new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {days < 0 ? 'past' : days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''} away`}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(exam.id)} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50">
                    <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
