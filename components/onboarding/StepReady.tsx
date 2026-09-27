'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EASE_CURVE } from '@/lib/motion'

interface Props {
  loading: boolean
  onComplete: () => void
  onBack: () => void
}

// Final screen: a single drawn check — no fireworks.
export default function StepReady({ loading, onComplete, onBack }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <svg viewBox="0 0 48 48" className="size-12 mx-auto" aria-hidden>
        <motion.circle
          cx="24" cy="24" r="22" fill="none" strokeWidth="2" className="stroke-accent"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: EASE_CURVE }}
        />
        <motion.path
          d="M15 24.5l6 6 12-13" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.45, ease: EASE_CURVE }}
        />
      </svg>

      <motion.h2
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
        className="mt-6 text-2xl font-semibold text-text"
      >
        Noetic hazır.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.85 }}
        className="mt-2 text-md text-text-secondary"
      >
        Öğrenme döngün başlıyor.
      </motion.p>

      <div className="mt-10 flex flex-col items-center gap-4">
        <button
          onClick={onComplete}
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium transition-colors duration-[160ms] disabled:opacity-60"
        >
          {loading ? <><Loader2 className="size-4 animate-spin" /> Hazırlanıyor…</> : 'Command Center’a gir →'}
        </button>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors duration-[160ms]">
          <ArrowLeft className="size-3.5" /> Geri
        </button>
      </div>
    </motion.div>
  )
}
