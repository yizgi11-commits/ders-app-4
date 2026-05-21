'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FOCUS_OPTIONS, CONSISTENCY_OPTIONS } from '@/lib/onboarding/types'
import type { FocusIntensity, ConsistencyLevel } from '@/lib/onboarding/types'

interface Props {
  intensity: FocusIntensity
  consistency: ConsistencyLevel
  onIntensityChange: (v: FocusIntensity) => void
  onConsistencyChange: (v: ConsistencyLevel) => void
  onNext: () => void
  onBack: () => void
}

export default function StepHabits({ intensity, consistency, onIntensityChange, onConsistencyChange, onNext, onBack }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white mb-2"
      >
        Çalışma alışkanlıkların 💪
      </motion.h2>
      <p className="text-sm text-white/35 mb-8">Sana en uygun yoğunluk ve hedefleri belirleyelim.</p>

      {/* Intensity */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Odak Yoğunluğu
        </p>
        <div className="grid grid-cols-3 gap-3">
          {FOCUS_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onIntensityChange(opt.value)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'text-center p-4 rounded-xl border transition-all',
                intensity === opt.value
                  ? 'bg-indigo-500/15 border-indigo-500/30'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <p className={cn(
                'text-sm font-bold mt-2',
                intensity === opt.value ? 'text-indigo-300' : 'text-white/60',
              )}>
                {opt.label}
              </p>
              <p className="text-[10px] text-white/25 mt-1">{opt.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Consistency */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Şu anki düzenliliğin
        </p>
        <div className="space-y-2">
          {CONSISTENCY_OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              onClick={() => onConsistencyChange(opt.value)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                consistency === opt.value
                  ? 'bg-indigo-500/15 border-indigo-500/30'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className={cn(
                'text-sm font-medium',
                consistency === opt.value ? 'text-indigo-300' : 'text-white/50',
              )}>
                {opt.label}
              </span>
              {consistency === opt.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-2 h-2 rounded-full bg-indigo-400"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Geri
        </button>
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/40"
        >
          Devam <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
