'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { X, Loader2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
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

/** Border-only for Again/Hard/Good, filled for Easy — no playful color blocks. */
const GRADE_STYLE: Record<RecallGrade, string> = {
  again: 'border-border text-danger hover:bg-danger-soft',
  hard:  'border-border text-warning hover:bg-warning-soft',
  good:  'border-border text-success hover:bg-success-soft',
  easy:  'border-success bg-success text-white hover:opacity-90',
}

const GRADE_TEXT: Record<RecallGrade, string> = {
  again: 'text-danger', hard: 'text-warning', good: 'text-success', easy: 'text-success',
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
        const finalTally = { ...tally, [g]: tally[g] + 1 }
        const remembered  = finalTally.good + finalTally.easy
        const score       = total > 0 ? Math.round((remembered / total) * 100) : 0
        fetch('/api/recall/session-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardsCount: total, score }),
        }).catch(() => {})
        setDone(true)
        onFinished()
      } else {
        setIndex(i => i + 1)
      }
    } finally {
      setSaving(false)
    }
  }, [card, saving, index, total, onFinished, tally])

  const reviewed = tally.again + tally.hard + tally.good + tally.easy

  // ── Free daily limit hit mid-session ────────────────────────────
  if (locked) {
    return (
      <div className="max-w-[560px] mx-auto pt-16 text-center">
        <Lock className="size-5 text-text-muted mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-text">Bugünkü Recall limitine ulaştın</h2>
        <p className="mt-2 text-base text-text-secondary">
          <span className="tabular">{reviewed}</span> kart tamamladın. Free planda günde 20 kart — Pro ile sınırsız.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-md border border-border text-base font-medium text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
          >
            Recall&apos;a dön
          </button>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center h-10 px-5 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium transition-colors duration-[160ms]"
          >
            Upgrade
          </Link>
        </div>
      </div>
    )
  }

  // ── Summary ──────────────────────────────────────────────────
  if (done) {
    const remembered = tally.good + tally.easy
    const rate = total > 0 ? Math.round((remembered / total) * 100) : 0
    return (
      <div className="max-w-[560px] mx-auto pt-16 text-center">
        <p className="text-[13px] font-medium tracking-[0.12em] text-text-muted">SESSION COMPLETE</p>
        <h2 className="mt-2 text-2xl font-semibold text-text">
          <span className="tabular">{total}</span> kart · <span className="tabular">%{rate}</span> hatırlandı
        </h2>

        <div className="mt-10 grid grid-cols-4 border-y border-border divide-x divide-border">
          {RECALL_GRADES.map(g => (
            <div key={g} className="py-4">
              <p className="tabular text-xl text-text">{tally[g]}</p>
              <p className={cn('mt-0.5 text-xs font-medium', GRADE_TEXT[g])}>{GRADE_CONFIG[g].label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-10 h-10 px-6 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium transition-colors duration-[160ms]"
        >
          Recall&apos;a dön
        </button>
      </div>
    )
  }

  if (!card) return null

  const pct = Math.round((index / total) * 100)
  const context = [card.subject_name, card.topic_title].filter(Boolean).join(' · ') || 'Konusuz'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          aria-label="Oturumu kapat"
          className="p-1.5 -ml-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
        >
          <X className="size-4" />
        </button>
        <p className="flex-1 min-w-0 truncate text-[13px] text-text-muted">{context}</p>
        <span className="tabular text-[13px] text-text-muted shrink-0">{index + 1} / {total}</span>
      </div>
      <div className="mt-3 h-0.5 bg-border rounded-full overflow-hidden" aria-hidden>
        <motion.div
          className="h-full bg-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: EASE_CURVE }}
        />
      </div>

      {/* Card — enter-only fade per card */}
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: EASE_CURVE }}
        className="max-w-[560px] mx-auto"
      >
        <p className="py-12 text-center text-[22px] leading-8 font-semibold text-text whitespace-pre-wrap">
          {card.front}
        </p>

        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-px bg-border" />
            <p className="py-6 text-center text-[16px] leading-7 text-text-secondary whitespace-pre-wrap">
              {card.back}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Reveal / grade */}
      <div className="max-w-[560px] mx-auto">
        {!revealed ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setRevealed(true)}
              className="h-10 px-6 rounded-md border border-border text-base font-medium text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
            >
              Show Answer
            </button>
            <p className="text-xs text-text-muted">Önce hatırlamayı dene — sonra cevabı aç.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Ne kadar iyi hatırladın?">
            {RECALL_GRADES.map(g => (
              <div key={g} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => grade(g)}
                  disabled={saving}
                  className={cn(
                    'w-full h-10 rounded-md border text-base font-medium transition-colors duration-[160ms] disabled:opacity-50',
                    GRADE_STYLE[g],
                  )}
                >
                  {saving ? <Loader2 className="size-4 animate-spin mx-auto" /> : GRADE_CONFIG[g].label}
                </button>
                <span className="text-xs text-text-muted">{GRADE_CONFIG[g].hint}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
