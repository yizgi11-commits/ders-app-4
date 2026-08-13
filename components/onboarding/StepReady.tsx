'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

interface Props {
  loading: boolean
  onComplete: () => void
  onBack: () => void
}

export default function StepReady({ loading, onComplete, onBack }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/60 mx-auto mb-6"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl font-black text-white mb-3"
      >
        Noetic hazır. 🎉
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-base text-white/40 mb-12"
      >
        Öğrenme döngün başlıyor.
      </motion.p>

      {/* Navigation */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={onComplete}
          disabled={loading}
          whileHover={!loading ? { scale: 1.03, y: -2 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-60 text-white font-bold text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-2xl shadow-indigo-900/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Hazırlanıyor…</span>
            </>
          ) : (
            <>
              <span>Command Center&apos;a Gir</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Geri
        </button>
      </div>
    </motion.div>
  )
}
