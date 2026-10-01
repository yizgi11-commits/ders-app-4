'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Exam } from '@/lib/planner/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import { fieldClass, primaryButtonClass, textButtonClass, SectionLabel, daysFromToday, shortDate } from './ui'

function daysLabel(days: number): string {
  if (days < 0) return 'geçti'
  if (days === 0) return 'bugün'
  return `${days} gün kaldı`
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-md skeleton-shimmer" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <SectionLabel>SINAVLAR</SectionLabel>
        <button onClick={() => setShowForm(v => !v)} className={textButtonClass}>
          <Plus className="size-3.5" /> Sınav ekle
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 rounded-lg border border-border bg-surface p-3 space-y-2">
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Sınav adı — örn. Fizik Sınavı"
                aria-label="Sınav adı"
                className={fieldClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr_auto] gap-2">
                <input
                  type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                  aria-label="Sınav tarihi"
                  className={cn(fieldClass, 'tabular-nums')}
                />
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)} aria-label="Ders" className={fieldClass}>
                  <option value="">— Ders (isteğe bağlı)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <button onClick={handleCreate} disabled={!name.trim() || !examDate || saving} className={primaryButtonClass}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Sınav ekle
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {exams.length === 0 ? (
        <p className="text-sm text-text-muted py-4 border-b border-border">Henüz sınav eklenmedi.</p>
      ) : (
        <ul>
          {exams.map(exam => {
            const days = daysFromToday(exam.exam_date)
            const urgent = days >= 0 && days < 3
            return (
              <li key={exam.id} className="group h-12 flex items-center gap-3 border-b border-border">
                <p className="flex-1 min-w-0 truncate text-base">
                  <span className="font-medium text-text">{exam.name}</span>
                  {exam.subjects?.name && exam.subjects.name !== exam.name && (
                    <span className="text-text-secondary"> · {exam.subjects.name}</span>
                  )}
                </p>
                <p className={cn(
                  'shrink-0 text-sm tabular-nums',
                  urgent ? 'text-danger font-medium' : days < 0 ? 'text-text-muted' : 'text-text-secondary',
                )}>
                  {shortDate(exam.exam_date)} · {daysLabel(days)}
                </p>
                <button onClick={() => handleDelete(exam.id)} aria-label={`${exam.name} sınavını sil`}
                  className="hit-area shrink-0 p-1 rounded-sm text-text-muted hover:text-danger transition-[color,opacity] duration-[160ms] sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
