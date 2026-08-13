'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STUDY_GOALS } from '@/lib/onboarding/types'
import type { StudyGoal } from '@/lib/onboarding/types'

interface Props {
  value: StudyGoal
  onChange: (v: StudyGoal) => void
  onNext: () => void
  onBack?: () => void
}

export default function StepGoal({ value, onChange, onNext, onBack }: Props) {
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
        Ne başarmak istiyorsun? 🎯
      </motion.h2>
      <p className="text-sm text-white/35 mb-8">Sana en uygun planı oluşturmamıza yardımcı olur.</p>

      {/* Goal cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {STUDY_GOALS.map((goal, i) => (
          <motion.button
            key={goal.value}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onChange(goal.value)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'text-left p-4 rounded-xl border transition-all relative overflow-hidden',
              value === goal.value
                ? 'bg-indigo-500/15 border-indigo-500/30'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
            )}
          >
            {value === goal.value && (
              <motion.div
                layoutId="goal-glow"
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/5"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="text-2xl relative z-10">{goal.emoji}</span>
            <h4 className="text-sm font-bold text-white mt-2 relative z-10">{goal.label}</h4>
            <p className="text-[11px] text-white/35 mt-0.5 relative z-10">{goal.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Geri
          </button>
        ) : <div />}
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
