'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GRADE_LEVELS } from '@/lib/onboarding/types'
import type { GradeLevel } from '@/lib/onboarding/types'

interface Props {
  value: GradeLevel | null
  onChange: (v: GradeLevel) => void
  onNext: () => void
  onBack: () => void
}

export default function StepGrade({ value, onChange, onNext, onBack }: Props) {
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
        Hangi sınıftasın? 🎓
      </motion.h2>
      <p className="text-sm text-white/35 mb-8">Sana uygun içerik ve zorluk seviyesini belirlememize yardımcı olur.</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {GRADE_LEVELS.map((g, i) => (
          <motion.button
            key={g.value}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onChange(g.value)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all',
              value === g.value
                ? 'bg-indigo-500/15 border-indigo-500/30'
                : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
            )}
          >
            <GraduationCap className={cn('w-4 h-4', value === g.value ? 'text-indigo-300' : 'text-white/25')} />
            <span className={cn(
              'text-sm font-bold',
              value === g.value ? 'text-indigo-300' : 'text-white/60',
            )}>
              {g.label}
            </span>
          </motion.button>
        ))}
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
