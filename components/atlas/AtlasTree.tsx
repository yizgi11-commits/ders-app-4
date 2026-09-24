'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import type { SubjectWithProgress } from '@/lib/subjects/types'
import CreateSubjectModal from '@/components/subjects/CreateSubjectModal'

interface Props {
  initialSubjects: SubjectWithProgress[]
  initialExamName: string | null
}

/** 0 → "0h", 45 → "45m", 90 → "1.5h" */
function fmtFocus(minutes: number): string {
  if (minutes <= 0) return '0h'
  if (minutes < 60) return `${minutes}m`
  const h = minutes / 60
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`
}

function AddSubjectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
    >
      <Plus className="size-3.5" /> Add subject
    </button>
  )
}

export default function AtlasTree({ initialSubjects, initialExamName }: Props) {
  const [subjects, setSubjects] = useState<SubjectWithProgress[]>(initialSubjects)
  const [examName]              = useState<string | null>(initialExamName)
  const [search, setSearch]     = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted truncate">
          {(examName || 'My Atlas').toLocaleUpperCase('tr-TR')}
        </p>
        <div className="flex items-center gap-4 shrink-0">
          {subjects.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search subjects…"
                aria-label="Ders ara"
                className="w-44 h-8 rounded-md bg-surface border border-border pl-8 pr-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors duration-[160ms]"
              />
            </div>
          )}
          <AddSubjectButton onClick={() => setShowCreate(true)} />
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-base font-medium text-text">Your Atlas is empty</p>
          <p className="text-sm text-text-secondary mt-1 mb-4">Add a subject to start mapping what you&apos;re learning.</p>
          <AddSubjectButton onClick={() => setShowCreate(true)} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-sm text-text-muted">No subjects match “{search}”.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {filtered.map(subject => {
            const isCollapsed = collapsed.has(subject.id)
            const topics = subject.topics ?? []

            return (
              <section key={subject.id}>
                {/* Subject */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggle(subject.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? `${subject.name} konularını aç` : `${subject.name} konularını kapat`}
                    className="p-0.5 -ml-0.5 rounded-sm text-text-muted hover:text-text transition-colors duration-[160ms]"
                  >
                    <ChevronDown className={cn('size-4 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                  </button>
                  <Link
                    href={`/dashboard/atlas/${subject.id}`}
                    className="flex-1 min-w-0 truncate text-[16px] leading-6 font-semibold text-text hover:text-accent transition-colors duration-[160ms]"
                  >
                    <span className="mr-1.5">{subject.icon}</span>{subject.name}
                  </Link>
                  <span className="shrink-0 tabular text-sm text-text-muted">{subject.subjectPct}%</span>
                </div>

                <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.subjectPct}%` }}
                    transition={{ duration: 0.6, ease: EASE_CURVE }}
                  />
                </div>

                {/* Topics — indented, hanging off a 1px tree line */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EASE_CURVE }}
                      className="overflow-hidden"
                    >
                      <div className="ml-2 pl-4 border-l border-border mt-2">
                        {topics.length === 0 ? (
                          <p className="h-10 flex items-center text-sm text-text-muted">No topics yet.</p>
                        ) : topics.map(topic => (
                          <Link
                            key={topic.id}
                            href={`/dashboard/atlas/${subject.id}/${topic.id}`}
                            className="relative h-10 -ml-4 pl-4 pr-2 flex items-center gap-4 border-b border-border hover:bg-surface-subtle transition-colors duration-[160ms]"
                          >
                            <span aria-hidden className="absolute left-0 top-1/2 w-2.5 h-px bg-border" />
                            <span className={cn(
                              'flex-1 min-w-0 truncate text-base font-medium',
                              topic.progress_pct >= 100 ? 'text-text-secondary' : 'text-text',
                            )}>
                              {topic.title}
                            </span>
                            <span className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-text-muted">
                              <span>Focus: <span className="tabular">{fmtFocus(topic.focus_minutes)}</span></span>
                              <span>Recall: <span className="tabular">{topic.recall_count}</span></span>
                              <span>Notes: <span className="tabular">{topic.note_count}</span></span>
                            </span>
                            <span
                              className="w-20 h-[3px] rounded-full bg-border overflow-hidden shrink-0"
                              title={`${topic.progress_pct}%`}
                            >
                              <span
                                className={cn('block h-full rounded-full', topic.progress_pct >= 100 ? 'bg-success' : 'bg-accent')}
                                style={{ width: `${topic.progress_pct}%` }}
                              />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateSubjectModal
            onClose={() => setShowCreate(false)}
            onCreated={(subject) => {
              setSubjects(prev => [...prev, { ...subject, topics: [], completedTopics: 0, totalTopics: 0, subjectPct: 0 }])
              setShowCreate(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
