'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PREFERRED_HOURS } from '@/lib/onboarding/types'
import type { PreferredHours } from '@/lib/onboarding/types'

interface Props {
  dailyMins: number
  preferredHours: PreferredHours
  onDailyChange: (v: number) => void
  onHoursChange: (v: PreferredHours) => void
  onNext: () => void
  onBack: () => void
}

const TIME_PRESETS = [
  { mins: 30,  label: '30 dk',  desc: 'Kısa ama düzenli' },
  { mins: 60,  label: '1 saat', desc: 'İyi bir başlangıç' },
  { mins: 120, label: '2 saat', desc: 'Dengeli çalışma' },
  { mins: 180, label: '3 saat', desc: 'Ciddi hazırlık' },
  { mins: 300, label: '5 saat', desc: 'Maraton çalışma' },
]

export default function StepTime({ dailyMins, preferredHours, onDailyChange, onHoursChange, onNext, onBack }: Props) {
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
        Ne kadar zamanın var? ⏰
      </motion.h2>
      <p className="text-sm text-white/35 mb-8">Günlük müsait olduğun süre ve tercih ettiğin zaman dilimi.</p>

      {/* Daily time */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Günlük Çalışma Süresi
        </p>
        <div className="flex flex-wrap gap-2">
          {TIME_PRESETS.map((t, i) => (
            <motion.button
              key={t.mins}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onDailyChange(t.mins)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex-1 min-w-[80px] text-center p-3 rounded-xl border transition-all',
                dailyMins === t.mins
                  ? 'bg-indigo-500/15 border-indigo-500/30'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              <p className={cn(
                'text-sm font-bold',
                dailyMins === t.mins ? 'text-indigo-300' : 'text-white/60',
              )}>
                {t.label}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">{t.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preferred hours */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Tercih Ettiğin Saat Dilimi
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREFERRED_HOURS.map((h, i) => (
            <motion.button
              key={h.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => onHoursChange(h.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                preferredHours === h.value
                  ? 'bg-indigo-500/15 border-indigo-500/30'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]',
              )}
            >
              <span className="text-xl">{h.emoji}</span>
              <div>
                <p className={cn(
                  'text-sm font-semibold',
                  preferredHours === h.value ? 'text-indigo-300' : 'text-white/60',
                )}>
                  {h.label}
                </p>
                <p className="text-[10px] text-white/25">{h.range}</p>
              </div>
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
