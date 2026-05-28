'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Check, Brain } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'

interface Props {
  cards:       FlashcardWithSubject[]
  onReviewed:  (id: string, result: 'know' | 'again') => void
  onClose:     () => void
}

export default function FlashcardStudyMode({ cards, onReviewed, onClose }: Props) {
  const [index, setIndex]         = useState(0)
  const [flipped, setFlipped]     = useState(false)
  const [direction, setDirection] = useState(0)   // -1 left, 1 right
  const [knowCount, setKnowCount] = useState(0)
  const [againCount, setAgainCount] = useState(0)
  const [done, setDone]           = useState(false)

  const total = cards.length
  const card  = cards[index]
  const pct   = Math.round((index / total) * 100)

  const advance = useCallback((result: 'know' | 'again') => {
    if (!card) return

    // Fire API update (non-blocking)
    fetch(`/api/flashcards/${card.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ result }),
    }).catch(() => {})

    onReviewed(card.id, result)

    if (result === 'know') setKnowCount(k => k + 1)
    else setAgainCount(a => a + 1)

    setDirection(result === 'know' ? 1 : -1)
    setFlipped(false)

    setTimeout(() => {
      if (index + 1 >= total) {
        setDone(true)
      } else {
        setIndex(i => i + 1)
      }
    }, 150)
  }, [card, index, total, onReviewed])

  // ── Done screen ───────────────────────────────────────────────
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto py-16 flex flex-col items-center text-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.1 }}
          className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200"
        >
          <Brain className="w-10 h-10 text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-black text-gray-900">Oturum Tamamlandı!</h2>
          <p className="text-sm text-muted-foreground mt-1">{total} kart çalışıldı</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-700">{knowCount}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Biliyorum ✓</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{againCount}</p>
            <p className="text-xs text-red-500 font-semibold mt-0.5">Tekrar ❌</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Bitir
          </button>
          <motion.button
            onClick={() => {
              setIndex(0); setFlipped(false); setKnowCount(0)
              setAgainCount(0); setDone(false)
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-200/50"
          >
            Tekrar Çalış
          </motion.button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <p className="text-sm font-bold text-gray-900">Çalışma Modu</p>
            <p className="text-xs text-muted-foreground">{index + 1} / {total} kart</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            ✓ {knowCount}
          </span>
          <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
            ❌ {againCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Flip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${direction}`}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 60 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="perspective-1000"
          style={{ perspective: '1000px' }}
        >
          <motion.div
            className="relative w-full cursor-pointer select-none"
            style={{ transformStyle: 'preserve-3d', minHeight: '320px' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped(f => !f)}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-2xl shadow-xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] pointer-events-none" />
              {card.subjects && (
                <span
                  className="absolute top-4 left-4 text-[10px] font-bold px-2 py-1 rounded-full border text-white/50 border-white/[0.07] bg-white/[0.04]"
                >
                  {card.subjects.icon} {card.subjects.name}
                </span>
              )}
              <span className="absolute top-4 right-4 text-[10px] text-white/20 font-semibold uppercase tracking-widest">
                SORU
              </span>
              <p className="relative text-xl sm:text-2xl font-bold text-white text-center leading-relaxed">
                {card.front}
              </p>
              <p className="absolute bottom-4 text-xs text-white/20 flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3" /> Tıkla ve çevir
              </p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-950 to-violet-950 border border-indigo-500/[0.2] rounded-2xl shadow-xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="absolute top-0 left-0 w-48 h-48 bg-violet-600/15 rounded-full blur-[60px] pointer-events-none" />
              <span className="absolute top-4 right-4 text-[10px] text-indigo-400/50 font-semibold uppercase tracking-widest">
                CEVAP
              </span>
              <p className="relative text-lg sm:text-xl font-semibold text-white/90 text-center leading-relaxed">
                {card.back}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Action buttons — only when flipped */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="grid grid-cols-2 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => advance('again')}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-white border-2 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 font-bold text-sm transition-all shadow-sm"
            >
              <span className="text-xl">❌</span>
              Tekrar
              <span className="text-xs font-normal text-red-400 ml-0.5">(yarın)</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => advance('know')}
              className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/60"
            >
              <Check className="w-5 h-5" />
              Biliyorum
              <span className="text-xs font-normal opacity-70 ml-0.5">(3 gün)</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint when not flipped */}
      {!flipped && (
        <p className="text-center text-xs text-muted-foreground">
          Cevabı görmek için karta tıkla
        </p>
      )}
    </div>
  )
}
