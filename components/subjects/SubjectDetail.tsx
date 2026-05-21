'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Loader2, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import type { SubjectWithTopics, Topic, TopicStatus } from '@/lib/subjects/types'
import { TOPIC_STATUS_CONFIG } from '@/lib/subjects/types'
import { stagger } from '@/lib/motion'

interface Props {
  subject:  SubjectWithTopics
  onBack:   () => void
  onUpdate: (updated: SubjectWithTopics) => void
}

const STATUS_ORDER: TopicStatus[] = ['not_started', 'in_progress', 'needs_review', 'completed']
const STATUS_CYCLE: Record<TopicStatus, TopicStatus> = {
  not_started:  'in_progress',
  in_progress:  'needs_review',
  needs_review: 'completed',
  completed:    'not_started',
}

export default function SubjectDetail({ subject, onBack, onUpdate }: Props) {
  const [newTitle, setNewTitle]     = useState('')
  const [adding, setAdding]         = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)

  const topics = subject.topics ?? []
  const total  = topics.length
  const done   = topics.filter(t => t.status === 'completed').length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0

  // ── Add topic ──
  const handleAdd = useCallback(async () => {
    if (!newTitle.trim() || adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subject.id, title: newTitle.trim() }),
      })
      if (!res.ok) return
      const topic: Topic = await res.json()
      onUpdate({ ...subject, topics: [...topics, topic] })
      setNewTitle('')
      setShowAdd(false)
    } finally { setAdding(false) }
  }, [newTitle, adding, subject, topics, onUpdate])

  // ── Cycle status ──
  const cycleStatus = useCallback(async (topic: Topic) => {
    if (updatingId) return
    setUpdatingId(topic.id)
    const newStatus = STATUS_CYCLE[topic.status]
    try {
      const res = await fetch('/api/topics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: topic.id, status: newStatus }),
      })
      if (!res.ok) return
      const updated: Topic = await res.json()
      onUpdate({
        ...subject,
        topics: topics.map(t => t.id === topic.id ? updated : t),
      })
    } finally { setUpdatingId(null) }
  }, [updatingId, subject, topics, onUpdate])

  // ── Delete topic ──
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      await fetch('/api/topics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      onUpdate({ ...subject, topics: topics.filter(t => t.id !== id) })
    } finally { setDeletingId(null) }
  }, [subject, topics, onUpdate])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-2xl p-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: subject.color, opacity: 0.6 }} />

        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </motion.button>

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/[0.08]"
            style={{ background: `${subject.color}15` }}
          >
            {subject.icon}
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-black text-white">{subject.name}</h1>
            <p className="text-xs text-white/35">
              {total} konu · {done} tamamlandı · {pct}%
            </p>
          </div>

          {/* Progress ring */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <motion.circle
                cx="28" cy="28" r="22" fill="none"
                stroke={subject.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - pct / 100) }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Status distribution */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
          {STATUS_ORDER.map(status => {
            const cfg = TOPIC_STATUS_CONFIG[status]
            const count = topics.filter(t => t.status === status).length
            return (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-[10px] font-medium ${cfg.color}`}>
                  {cfg.label}: {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add topic */}
      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-950 border border-white/[0.08] rounded-xl p-4">
              <div className="flex gap-2">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Konu başlığı…"
                  className="input-premium flex-1"
                  style={{ paddingLeft: '1rem' }}
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim() || adding}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Ekle
                </button>
                <button onClick={() => { setShowAdd(false); setNewTitle('') }} className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.09] text-white/40 text-xs rounded-xl transition-colors">
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            onClick={() => setShowAdd(true)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/[0.1] hover:border-indigo-500/30 rounded-xl text-xs font-semibold text-white/30 hover:text-indigo-400 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Konu Ekle
          </motion.button>
        )}
      </AnimatePresence>

      {/* Topics list */}
      {total === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-sm text-white/40">Henüz konu eklenmedi.</p>
          <p className="text-xs text-white/20 mt-1">Yukarıdaki butona tıklayarak konu ekle.</p>
        </div>
      ) : (
        <motion.div
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
          className="space-y-1.5"
        >
          {topics.map((topic, i) => {
            const cfg = TOPIC_STATUS_CONFIG[topic.status]
            const isUpdating = updatingId === topic.id
            const isDeleting = deletingId === topic.id

            return (
              <motion.div
                key={topic.id}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
                }}
                layout
                className="flex items-center gap-3 bg-gradient-to-r from-gray-950 to-gray-900/80 border border-white/[0.07] rounded-xl px-4 py-3 group hover:border-white/[0.12] transition-colors"
              >
                {/* Status button */}
                <motion.button
                  onClick={() => cycleStatus(topic)}
                  disabled={isUpdating}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all shrink-0 ${cfg.bg} ${cfg.border}`}
                  title={`Durum değiştir → ${TOPIC_STATUS_CONFIG[STATUS_CYCLE[topic.status]].label}`}
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white/40" />
                  ) : topic.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  )}
                </motion.button>

                {/* Title */}
                <span className={`flex-1 text-sm font-medium ${
                  topic.status === 'completed' ? 'text-white/35 line-through' : 'text-white/75'
                }`}>
                  {topic.title}
                </span>

                {/* Status badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  {cfg.label}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(topic.id)}
                  disabled={isDeleting}
                  className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin text-red-400/50" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-red-400/40 hover:text-red-400" />
                  )}
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
