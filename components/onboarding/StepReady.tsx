'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Loader2, Sparkles, Check } from 'lucide-react'
import type { OnboardingData } from '@/lib/onboarding/types'
import { STUDY_GOALS, PREFERRED_HOURS, FOCUS_OPTIONS, CONSISTENCY_OPTIONS } from '@/lib/onboarding/types'

interface Props {
  data: OnboardingData
  loading: boolean
  onComplete: () => void
  onBack: () => void
}

export default function StepReady({ data, loading, onComplete, onBack }: Props) {
  const goal = STUDY_GOALS.find(g => g.value === data.studyGoal)
  const hours = PREFERRED_HOURS.find(h => h.value === data.preferredHours)
  const intensity = FOCUS_OPTIONS.find(f => f.value === data.focusIntensity)
  const consistency = CONSISTENCY_OPTIONS.find(c => c.value === data.consistencyLevel)

  const summaryItems = [
    { label: 'Hedef', value: `${goal?.emoji} ${goal?.label}`, done: true },
    { label: 'Günlük Süre', value: `${Math.floor(data.dailyAvailMins / 60)}s ${data.dailyAvailMins % 60}dk`, done: true },
    { label: 'Zaman Dilimi', value: `${hours?.emoji} ${hours?.label}`, done: true },
    { label: 'Yoğunluk', value: `${intensity?.emoji} ${intensity?.label}`, done: true },
    { label: 'Düzenlilik', value: `${consistency?.emoji} ${consistency?.label}`, done: true },
    { label: 'Zayıf Dersler', value: data.weakSubjects.length > 0 ? data.weakSubjects.join(', ') : 'Seçilmedi', done: true },
  ]

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
        className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/40 mx-auto mb-6"
      >
        <Rocket className="w-8 h-8 text-white" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-black text-white mb-2"
      >
        Her şey hazır! 🚀
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-white/35 mb-8"
      >
        Profilini oluşturduk. İşte senin planın:
      </motion.p>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6 text-left"
      >
        <div className="space-y-3">
          {summaryItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-xs text-white/40">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-white/70">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* What will happen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-indigo-500/[0.06] border border-indigo-500/15 rounded-xl p-4 mb-8"
      >
        <div className="flex items-center gap-2 mb-2 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            AI otomatik oluşturacak
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'Kişisel çalışma programı',
            'Günlük hedefler',
            'Ders planı',
            'Başarım sistemi',
          ].map(f => (
            <span key={f} className="text-[10px] text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15">
              {f}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Geri
        </button>
        <motion.button
          onClick={onComplete}
          disabled={loading}
          whileHover={!loading ? { scale: 1.03, y: -2 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-60 text-white font-bold text-sm px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-2xl shadow-emerald-900/40 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Oluşturuluyor…</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Başla!</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
