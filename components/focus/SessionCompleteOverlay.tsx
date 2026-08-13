'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SESSION_RATING_LABELS, type SessionRating } from '@/lib/pomodoro/types'

export interface OverlaySession {
  sessionId:       string
  subjectName:     string | null
  topicName:       string | null
  durationSeconds: number
}

const RATINGS: SessionRating[] = ['poor', 'okay', 'good', 'excellent']

function fmtDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} min`
}

export default function SessionCompleteOverlay({
  session, onSaved,
}: {
  session: OverlaySession
  onSaved?: () => void
}) {
  const router = useRouter()
  const [rating, setRating] = useState<SessionRating>('good')
  const [recallText, setRecallText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = recallText.trim().length >= 1 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/pomodoro/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, rating, recallText: recallText.trim() }),
      })
      if (!res.ok) throw new Error()
      onSaved?.()
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Could not save — please try again.')
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="w-full max-w-md bg-gray-950 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }}
            className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/40 mb-4"
          >
            <PartyPopper className="w-7 h-7 text-white" />
          </motion.div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Session Complete</p>
          <p className="text-lg font-black text-white leading-snug">
            {session.subjectName ?? 'Free session'}
            {session.topicName && <span className="text-white/50"> — {session.topicName}</span>}
          </p>
          <p className="text-sm text-white/35 mt-1">{fmtDuration(session.durationSeconds)}</p>
        </div>

        {/* Rating */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-white/50 mb-2.5">How did it go?</p>
          <div className="flex items-center justify-between gap-2">
            {RATINGS.map(r => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors"
              >
                <span className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all',
                  rating === r ? 'bg-indigo-500 border-indigo-400 scale-110' : 'border-white/20',
                )} />
                <span className={cn('text-[11px] font-medium', rating === r ? 'text-indigo-300' : 'text-white/35')}>
                  {SESSION_RATING_LABELS[r]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recall */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-white/50 mb-2">What did you learn?</p>
          <textarea
            value={recallText}
            onChange={e => setRecallText(e.target.value)}
            rows={4}
            placeholder="Write a quick summary of what you studied…"
            className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4 text-center">
            {error}
          </p>
        )}

        {/* Save */}
        <motion.button
          onClick={handleSave}
          disabled={!canSave}
          whileHover={canSave ? { scale: 1.02 } : {}}
          whileTap={canSave ? { scale: 0.98 } : {}}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
            canSave
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40'
              : 'bg-white/[0.06] text-white/25 cursor-not-allowed',
          )}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          ) : (
            <>Save &amp; Continue<ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
