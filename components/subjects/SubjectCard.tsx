'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, Pencil, Trash2, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import type { SubjectWithTopics, TopicStatus } from '@/lib/subjects/types'
import { TOPIC_STATUS_CONFIG } from '@/lib/subjects/types'

interface Props {
  subject:   SubjectWithTopics
  analytics: { tasksCompleted: number; xpEarned: number } | null
  index:     number
  onSelect:  () => void
  onEdit:    () => void
  onDelete:  () => void
}

export default function SubjectCard({ subject, analytics, index, onSelect, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const topics = subject.topics ?? []
  const total  = topics.length
  const completed = topics.filter(t => t.status === 'completed').length
  const inProgress = topics.filter(t => t.status === 'in_progress').length
  const needsReview = topics.filter(t => t.status === 'needs_review').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Status distribution for mini bar
  const statusCounts: Record<TopicStatus, number> = {
    completed:    completed,
    in_progress:  inProgress,
    needs_review: needsReview,
    not_started:  total - completed - inProgress - needsReview,
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.97 },
        show: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: 'spring', stiffness: 340, damping: 28, delay: index * 0.05 },
        },
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-2xl p-5 cursor-pointer group"
      onClick={onSelect}
    >
      {/* Color accent line */}
      <div
        className="absolute top-0 left-5 right-5 h-0.5 rounded-full opacity-60"
        style={{ background: subject.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border border-white/[0.08] shrink-0"
            style={{ background: `${subject.color}15` }}
          >
            {subject.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-white/90 transition-colors">
              {subject.name}
            </h3>
            <p className="text-[11px] text-white/35">
              {total} konu · {pct}% tamamlandı
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-white/40" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-8 z-20 bg-gray-900 border border-white/[0.1] rounded-xl shadow-2xl py-1 min-w-[140px]"
              >
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Düzenle
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Sil
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex">
          {total > 0 && (['completed', 'in_progress', 'needs_review', 'not_started'] as const).map(status => {
            const count = statusCounts[status]
            if (count === 0) return null
            const w = (count / total) * 100
            return (
              <motion.div
                key={status}
                className="h-full"
                style={{ background: getStatusColor(status), width: `${w}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            )
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        {[
          { label: 'Tamamlanan', val: completed, color: 'text-emerald-400' },
          { label: 'Çalışılan', val: inProgress, color: 'text-indigo-400' },
          { label: 'Tekrar', val: needsReview, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="text-center flex-1">
            <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[9px] text-white/25">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics row */}
      {analytics && (analytics.tasksCompleted > 0) && (
        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] text-white/25">{analytics.tasksCompleted} görev</span>
          <span className="text-[10px] text-white/15">·</span>
          <span className="text-[10px] text-yellow-400/60">{analytics.xpEarned} XP</span>
        </div>
      )}

      {/* Arrow */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all">
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </motion.div>
  )
}

function getStatusColor(status: TopicStatus): string {
  const map: Record<TopicStatus, string> = {
    completed:    '#10b981',
    in_progress:  '#6366f1',
    needs_review: '#f59e0b',
    not_started:  'rgba(255,255,255,0.08)',
  }
  return map[status]
}
