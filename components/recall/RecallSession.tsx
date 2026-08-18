'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, Eye, Loader2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RECALL_GRADES, GRADE_CONFIG,
  type RecallCard, type RecallGrade,
} from '@/lib/recall/types'

interface Props {
  cards:   RecallCard[]
  onClose: () => void
  /** Fired once the session ends so the queue/analytics can refetch. */
  onFinished: () => void
}

export default function RecallSession({ cards, onClose, onFinished }: Props) {
  const [index, setIndex]     = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [locked, setLocked]   = useState(false)
  const [tally, setTally]     = useState<Record<RecallGrade, number>>({
    again: 0, hard: 0, good: 0, easy: 0,
  })

  const total = cards.length
  const card  = cards[index]

  const grade = useCallback(async (g: RecallGrade) => {
    if (!card || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/recall/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcard_id: card.id, grade: g }),
      })
      if (res.status === 403) {
        setLocked(true)
        onFinished()
        return
      }
      setTally(t => ({ ...t, [g]: t[g] + 1 }))
      setRevealed(false)

      if (index + 1 >= total) {
        setDone(true)
        onFinished()
      } else {
        setIndex(i => i + 1)
      }
    } finally {
      setSaving(false)
    }
  }, [card, saving, index, total, onFinished])

  // ── Free daily limit hit mid-session ────────────────────────────
  if (locked) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-lg mx-auto py-14 flex flex-col items-center text-center gap-5"
      >
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
          <Lock className="w-7 h-7 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Bugünkü Recall limitine ulaştın</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tally.again + tally.hard + tally.good + tally.easy} kart tamamladın. Free planda günde 20 kart — Pro ile sınırsız.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Recall&apos;a dön
          </button>
          <Link
            href="/dashboard/upgrade"
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Summary ──────────────────────────────────────────────────
  if (done) {
    const remembered = tally.good + tally.easy
    const rate = total > 0 ? Math.round((remembered / total) * 100) : 0
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-lg mx-auto py-14 flex flex-col items-center text-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
          className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200"
        >
          <Brain className="w-10 h-10 text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-black text-gray-900">Recall tamamlandı</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {total} kart · %{rate} hatırlandı
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full">
          {RECALL_GRADES.map(g => {
            const cfg = GRADE_CONFIG[g]
            return (
              <div key={g} className={cn('rounded-2xl border p-3 text-center', cfg.bg, cfg.border)}>
                <p className={cn('text-2xl font-black', cfg.color)}>{tally[g]}</p>
                <p className={cn('text-[11px] font-semibold mt-0.5', cfg.color)}>{cfg.label}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-200/50 transition-colors"
        >
          Recall&apos;a dön
        </button>
      </motion.div>
    )
  }

  if (!card) return null

  const pct = Math.round((index / total) * 100)
  const topicLabel = card.topic_title ?? card.subject_name ?? 'Konusuz'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <p className="text-sm font-bold text-gray-900">Recall Session</p>
            <p className="text-xs text-muted-foreground">{index + 1} / {total} kart</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {RECALL_GRADES.filter(g => tally[g] > 0).map(g => (
            <span
              key={g}
              className={cn('text-[11px] font-bold px-2 py-1 rounded-full border', GRADE_CONFIG[g].bg, GRADE_CONFIG[g].border, GRADE_CONFIG[g].color)}
            >
              {GRADE_CONFIG[g].label} {tally[g]}
            </span>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-gray-950 to-gray-900 p-8 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-600/10 rounded-full blur-[70px] pointer-events-none" />

          {/* Topic */}
          <p className="relative text-[11px] font-bold text-indigo-400 uppercase tracking-[0.18em] mb-5">
            {card.subject_icon ? `${card.subject_icon} ` : ''}{topicLabel}
          </p>

          {/* Question */}
          <p className="relative text-xl sm:text-2xl font-bold text-white leading-relaxed">
            {card.front}
          </p>

          {/* Answer */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden"
              >
                <div className="flex items-center gap-3 my-5">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Show Answer</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-lg text-white/85 leading-relaxed">{card.back}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Reveal / grade */}
      {!revealed ? (
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => setRevealed(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg transition-colors"
          >
            <Eye className="w-4 h-4" /> Show Answer
          </motion.button>
          <p className="text-xs text-muted-foreground">Önce hatırlamayı dene — sonra cevabı aç.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="space-y-3"
        >
          <p className="text-center text-sm font-semibold text-gray-700">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-2">
            {RECALL_GRADES.map(g => {
              const cfg = GRADE_CONFIG[g]
              return (
                <motion.button
                  key={g}
                  onClick={() => grade(g)}
                  disabled={saving}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all disabled:opacity-50',
                    cfg.bg, cfg.border, cfg.color, cfg.hover,
                  )}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : cfg.label}
                  <span className="text-[10px] font-medium opacity-60">{cfg.hint}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
