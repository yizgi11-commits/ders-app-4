'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import { SESSION_RATING_LABELS, type SessionRating } from '@/lib/pomodoro/types'

export interface OverlaySession {
  sessionId:       string
  subjectName:     string | null
  topicName:       string | null
  durationSeconds: number
  /** XP from /api/pomodoro/complete — unknown when the overlay is restored after a reload. */
  xpEarned?:       number
}

const RATINGS: SessionRating[] = ['poor', 'okay', 'good', 'excellent']

/** "+XP" float after saving — dims, rises 20px, fades out. */
const XP_FLOAT_MS = 700

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
  const [celebrating, setCelebrating] = useState(false)

  const canSave = recallText.trim().length >= 1 && !saving
  const minutes = Math.max(1, Math.round(session.durationSeconds / 60))

  function leave() {
    onSaved?.()
    router.push('/dashboard')
    router.refresh()
  }

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
      if (session.xpEarned && session.xpEarned > 0) {
        setCelebrating(true)
        setTimeout(leave, XP_FLOAT_MS)
      } else {
        leave()
      }
    } catch {
      setError('Kaydedilemedi — tekrar dene.')
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-[rgba(13,15,19,0.96)] flex items-center justify-center p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: celebrating ? 0.25 : 1, y: 0 }}
        transition={{ duration: celebrating ? 0.2 : 0.35, ease: EASE_CURVE }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-[13px] font-medium tracking-[0.12em] text-dark-text-muted">OTURUM TAMAMLANDI</p>
          <p className="mt-3 tabular text-[48px] leading-none font-light tracking-[-0.02em] text-white">
            {minutes} dk odaklandın
          </p>
          {(session.subjectName || session.topicName) && (
            <p className="mt-3 text-base text-dark-text-secondary truncate">
              {session.subjectName ?? 'Serbest oturum'}
              {session.topicName && <span className="text-dark-text-muted"> — {session.topicName}</span>}
            </p>
          )}
        </div>

        <div className="my-8 h-px bg-dark-border" />

        {/* Recall */}
        <label htmlFor="session-recall" className="block text-base text-dark-text-secondary mb-2">
          Ne öğrendin?
        </label>
        <textarea
          id="session-recall"
          value={recallText}
          onChange={e => setRecallText(e.target.value)}
          placeholder="Çalıştığın konuyu kısaca özetle…"
          className="w-full min-h-[100px] resize-none rounded-lg bg-dark-secondary border border-dark-border p-3 text-base text-dark-text placeholder:text-dark-text-muted focus:outline-none focus:border-accent transition-colors duration-[160ms]"
        />

        {/* Rating */}
        <p className="mt-6 mb-3 text-base text-dark-text-secondary" id="session-rating-label">Ne kadar odaklandın?</p>
        <div className="flex items-center gap-3" role="radiogroup" aria-labelledby="session-rating-label">
          {RATINGS.map((r, i) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rating === r}
              aria-label={SESSION_RATING_LABELS[r]}
              title={SESSION_RATING_LABELS[r]}
              onClick={() => setRating(r)}
              className={cn(
                'size-9 rounded-full border tabular text-sm transition-colors duration-[160ms]',
                rating === r
                  ? 'bg-accent border-accent text-white'
                  : 'border-dark-border text-dark-text-secondary hover:border-dark-text-muted',
              )}
            >
              {i + 1}
            </button>
          ))}
          <span className="ml-1 text-sm text-dark-text-muted">{SESSION_RATING_LABELS[rating]}</span>
        </div>

        {error && (
          <p className="mt-5 text-sm text-danger text-center">{error}</p>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'mt-8 w-full h-11 rounded-md flex items-center justify-center gap-2 text-base font-medium transition-colors duration-[160ms]',
            canSave || saving
              ? 'bg-accent hover:bg-accent-dark text-white'
              : 'bg-dark-secondary text-dark-text-muted cursor-not-allowed',
          )}
        >
          {saving ? <><Loader2 className="size-4 animate-spin" /> Kaydediliyor…</> : 'Kaydet ve devam et'}
        </button>
      </motion.div>

      {/* +XP float — plain text, no confetti */}
      {celebrating && session.xpEarned !== undefined && (
        <motion.p
          aria-live="polite"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -20 }}
          transition={{ duration: XP_FLOAT_MS / 1000, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center tabular text-[40px] font-light text-white"
        >
          +{session.xpEarned} XP
        </motion.p>
      )}
    </motion.div>
  )
}
