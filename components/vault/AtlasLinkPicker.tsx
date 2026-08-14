'use client'

import { useEffect, useState } from 'react'
import { Map } from 'lucide-react'
import type { SubjectWithTopics } from '@/lib/subjects/types'

interface Props {
  subjectId: string | null
  topicId:   string | null
  onChange:  (subjectId: string | null, topicId: string | null) => void
  /** Renders the compact two-column variant used inside modals. */
  compact?:  boolean
  label?:    string
}

/**
 * Subject > Topic selector shared by notes, flashcards and documents.
 * Picking a different subject clears the topic, since topics are scoped
 * to their subject.
 */
export default function AtlasLinkPicker({
  subjectId, topicId, onChange, compact = false, label = 'Atlas bağlantısı',
}: Props) {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([])

  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [])

  const topics = subjects.find(s => s.id === subjectId)?.topics ?? []
  const selectCls = compact
    ? 'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30'
    : 'w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300'

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        <Map className="w-3 h-3" /> {label}
      </label>
      <div className={compact ? 'space-y-1.5' : 'grid grid-cols-2 gap-2'}>
        <select
          value={subjectId ?? ''}
          onChange={e => onChange(e.target.value || null, null)}
          className={selectCls}
        >
          <option value="">— Ders</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
        <select
          value={topicId ?? ''}
          onChange={e => onChange(subjectId, e.target.value || null)}
          disabled={!subjectId}
          className={`${selectCls} disabled:opacity-50`}
        >
          <option value="">— Konu</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
