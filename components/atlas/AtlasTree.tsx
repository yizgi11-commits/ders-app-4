'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Map, Search } from 'lucide-react'
import type { SubjectWithProgress } from '@/lib/subjects/types'
import CreateSubjectModal from '@/components/subjects/CreateSubjectModal'
import { stagger } from '@/lib/motion'

function TreeSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-border rounded-2xl p-4 h-20 animate-pulse" />
      ))}
    </div>
  )
}

export default function AtlasTree() {
  const [subjects, setSubjects] = useState<SubjectWithProgress[]>([])
  const [examName, setExamName] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/atlas')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubjects(data.subjects ?? [])
      setExamName(data.examName ?? null)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function toggle(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <TreeSkeleton />

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="text-sm bg-white border border-border rounded-xl pl-9 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>
        <motion.button
          onClick={() => setShowCreate(true)}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </motion.button>
      </div>

      {/* Root node */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Map className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">
          {examName || 'My Atlas'}
        </h2>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-4">🗺️</div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Your Atlas is empty</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-5">
            Add a subject to start mapping what you're learning.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-4 h-4" /> Add your first subject
          </button>
        </div>
      ) : (
        <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="relative pl-4 space-y-2">
          {/* Trunk line */}
          <div className="absolute left-[7px] top-2 bottom-6 w-px bg-border" />

          {filtered.map(subject => {
            const isCollapsed = collapsed.has(subject.id)
            const topics = subject.topics ?? []

            return (
              <motion.div
                key={subject.id}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="relative"
              >
                {/* Branch connector */}
                <div className="absolute left-[-9px] top-5 w-3 h-px bg-border" />

                {/* Subject row */}
                <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <button
                      onClick={() => toggle(subject.id)}
                      className="shrink-0 p-0.5 -m-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${subject.color}15` }}
                    >
                      {subject.icon}
                    </div>

                    <Link href={`/dashboard/atlas/${subject.id}`} className="flex-1 min-w-0 group">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {subject.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {subject.completedTopics}/{subject.totalTopics} topics · {subject.subjectPct}%
                      </p>
                    </Link>

                    <div className="w-24 shrink-0 hidden sm:block">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.subjectPct}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topics */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && topics.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-border/70"
                      >
                        {topics.map((topic, i) => (
                          <Link
                            key={topic.id}
                            href={`/dashboard/atlas/${subject.id}/${topic.id}`}
                            className="flex items-center gap-3 pl-14 pr-4 py-2.5 hover:bg-gray-50/80 transition-colors group relative"
                          >
                            <span className="absolute left-9 top-0 bottom-0 w-px bg-border" />
                            <span className="absolute left-9 top-1/2 w-3.5 h-px bg-border" />
                            <span className={`text-sm flex-1 min-w-0 truncate ${
                              topic.progress_pct >= 100 ? 'text-muted-foreground line-through' : 'text-gray-700'
                            } group-hover:text-indigo-600 transition-colors`}>
                              {topic.title}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 tabular-nums w-9 text-right shrink-0">
                              {topic.progress_pct}%
                            </span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${topic.progress_pct}%`,
                                  background: topic.progress_pct >= 100 ? '#10b981' : subject.color,
                                }}
                              />
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                    {!isCollapsed && topics.length === 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border/70"
                      >
                        <p className="pl-14 pr-4 py-2.5 text-xs text-muted-foreground">No topics yet.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
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
