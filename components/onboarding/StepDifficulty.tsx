'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTY_OPTIONS } from '@/lib/onboarding/types'
import type { StudyDifficulty } from '@/lib/onboarding/types'

interface Props {
  value: StudyDifficulty[]
  onToggle: (v: StudyDifficulty) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDifficulty({ value, onToggle, onNext, onBack }: Props) {
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
        En çok hangi sorunu yaşıyorsun? 🧩
      </motion.h2>
      <p className="text-sm text-white/35 mb-8">Birden fazla seçebilirsin — sana özel önerileri buna göre şekillendireceğiz.</p>

      <div className="space-y-2 mb-8">
        {DIFFICULTY_OPTIONS.map((opt, i) => {
          const selected = value.includes(opt.value)
          return (
            <motion.button
              key={opt.value}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onToggle(opt.value)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                selected
                  ? 'bg-indigo-500/15 border-indigo-500/30'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className={cn(
                'flex-1 text-sm font-medium',
                selected ? 'text-indigo-300' : 'text-white/50',
              )}>
                {opt.label}
              </span>
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0"
                >
                  <Check className="w-3 h-3 text-indigo-300" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

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
