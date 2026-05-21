'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubjectInfo {
  name: string
  icon: string
  color: string
}

interface Props {
  subjects: SubjectInfo[]
  weakSubjects: string[]
  onToggleWeak: (name: string) => void
  onNext: () => void
  onBack: () => void
}

export default function StepSubjects({ subjects, weakSubjects, onToggleWeak, onNext, onBack }: Props) {
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
        Zayıf derslerini seç 📚
      </motion.h2>
      <p className="text-sm text-white/35 mb-3">
        Bu derslere programında daha fazla zaman ayrılacak.
      </p>
      <p className="text-[11px] text-white/20 mb-8">
        Hedefe göre oluşturulan dersler otomatik eklenecek. İstediğin zaman değiştirebilirsin.
      </p>

      {/* Subject grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {subjects.map((sub, i) => {
          const isWeak = weakSubjects.includes(sub.name)
          return (
            <motion.button
              key={sub.name}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => onToggleWeak(sub.name)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                isWeak
                  ? 'bg-amber-500/10 border-amber-500/25'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/[0.08] shrink-0"
                style={{ background: `${sub.color}15` }}
              >
                {sub.icon}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{sub.name}</p>
                {isWeak && (
                  <p className="text-[10px] text-amber-400/70 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    Zayıf — ekstra odak
                  </p>
                )}
              </div>

              {/* Check indicator */}
              {isWeak && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-amber-400" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-8">
        <p className="text-[11px] text-white/30 text-center">
          {weakSubjects.length === 0
            ? '💡 Zayıf ders seçmezsen tüm derslere eşit zaman ayrılır.'
            : `${weakSubjects.length} zayıf ders seçildi — bu derslere 1.5x fazla zaman ayrılacak.`
          }
        </p>
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
