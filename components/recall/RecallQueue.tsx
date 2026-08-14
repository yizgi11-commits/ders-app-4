'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, ArrowRight, CheckCircle2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { daysAgoLabel, type RecallQueueResponse, type RecallQueueGroup } from '@/lib/recall/types'

interface Props {
  queue:        RecallQueueResponse | null
  onStart:      () => void
  onStartTopic: (group: RecallQueueGroup) => void
}

export default function RecallQueue({ queue, onStart, onStartTopic }: Props) {
  if (!queue) {
    return (
      <div className="space-y-3">
        <div className="h-14 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-40 bg-white border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  // ── Nothing due ────────────────────────────────────────────
  if (queue.totalCards === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl py-16 px-6 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Bugün tekrar bekleyen kart yok</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
          Her şey güncel. Yeni kartlar Vault&apos;tan veya Focus oturumu sonunda eklenir.
        </p>
        <Link
          href="/dashboard/vault"
          className="inline-flex items-center gap-2 bg-white border border-border hover:bg-gray-50 text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Vault&apos;a git <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-5 py-4 text-white shadow-lg shadow-indigo-200/50">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Due Today</p>
          <p className="text-base font-black leading-tight">
            {queue.totalTopics} konu, {queue.totalCards} kart
          </p>
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-2">
        {queue.groups.map((group, i) => {
          const lastStudied = daysAgoLabel(group.lastStudiedAt)
          return (
            <motion.div
              key={group.topicId ?? '__none__'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center gap-3 bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <span className="text-lg shrink-0">{group.subjectIcon ?? '🧠'}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{group.topicTitle}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {group.subjectName && (
                    <span className="text-[11px] font-medium text-indigo-600">{group.subjectName}</span>
                  )}
                  {lastStudied && (
                    <span className="text-[11px] text-muted-foreground">Son çalışma: {lastStudied}</span>
                  )}
                </div>
              </div>

              <span className="text-[11px] font-bold text-gray-600 bg-gray-100 rounded-full px-2.5 py-1 shrink-0">
                {group.cards.length} kart
              </span>

              <button
                onClick={() => onStartTopic(group)}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                <Play className="w-3 h-3 fill-current" /> Başlat
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Start */}
      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800',
          'text-white font-bold text-sm py-4 rounded-2xl shadow-lg transition-colors',
        )}
      >
        <Brain className="w-4 h-4" />
        START RECALL
        <span className="font-normal opacity-60">· {queue.totalCards} kart</span>
      </motion.button>
    </div>
  )
}
