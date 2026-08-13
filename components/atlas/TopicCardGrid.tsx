'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Loader2, ArrowRight, Trash2 } from 'lucide-react'
import type { TopicProgress } from '@/lib/subjects/types'
import { formatLastStudied } from '@/lib/subjects/format'
import { stagger } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Props {
  subjectId:     string
  initialTopics: TopicProgress[]
}

export default function TopicCardGrid({ subjectId, initialTopics }: Props) {
  const [topics, setTopics] = useState<TopicProgress[]>(initialTopics)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim() || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, title: newTitle.trim() }),
      })
      if (!res.ok) return
      const topic = await res.json()
      setTopics(prev => [...prev, {
        ...topic, progress_pct: 0, has_focus: false, has_recall: false, has_note: false, last_studied_at: null,
      }])
      setNewTitle('')
      setShowAdd(false)
    } finally { setAdding(false) }
  }, [newTitle, adding, subjectId])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch('/api/topics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setTopics(prev => prev.filter(t => t.id !== id))
    } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Topics</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Topic
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-border rounded-2xl p-3 flex gap-2 shadow-sm">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Topic title…"
                autoFocus
                className="flex-1 text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || adding}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle('') }}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-muted-foreground text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {topics.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-border rounded-2xl">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-sm text-muted-foreground">No topics yet — add one to start mapping this subject.</p>
        </div>
      ) : (
        <motion.div variants={stagger(0.04)} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map(topic => {
            const done = topic.progress_pct >= 100
            return (
              <motion.div
                key={topic.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="group relative bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => handleDelete(topic.id)}
                  disabled={deletingId === topic.id}
                  className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                >
                  {deletingId === topic.id
                    ? <Loader2 className="w-3 h-3 animate-spin text-red-400/60" />
                    : <Trash2 className="w-3 h-3 text-red-400/60 hover:text-red-500" />}
                </button>

                <p className="text-sm font-bold text-gray-900 pr-6 mb-3 truncate">{topic.title}</p>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', done ? 'bg-emerald-500' : 'bg-indigo-500')}
                      style={{ width: `${topic.progress_pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 tabular-nums w-9 text-right">{topic.progress_pct}%</span>
                </div>

                <p className="text-[11px] text-muted-foreground mb-3">{formatLastStudied(topic.last_studied_at)}</p>

                <Link
                  href={`/dashboard/atlas/${subjectId}/${topic.id}`}
                  className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl py-2 transition-colors"
                >
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
