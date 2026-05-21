'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Brain, BarChart2, Lightbulb } from 'lucide-react'
import AIInsightsSection from './AIInsightsSection'
import AIRecommendations from './AIRecommendations'
import WeeklyReportModal from './WeeklyReportModal'
import { stagger } from '@/lib/motion'

const HOURS = new Date().getHours()
function getGreeting(name: string): string {
  if (HOURS < 12) return `Günaydın, ${name} ☀️`
  if (HOURS < 18) return `İyi günler, ${name} 👋`
  return `İyi akşamlar, ${name} 🌙`
}

export default function AICoachPageClient({ userName }: { userName: string }) {
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-2xl p-6 overflow-hidden"
      >
        {/* Ambient */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/8 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 10, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 6 }}
            className="w-16 h-16 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shrink-0"
          >
            <Brain className="w-7 h-7 text-indigo-400" />
          </motion.div>

          <div className="flex-1">
            <motion.div
              variants={stagger(0.06, 0.1)}
              initial="hidden"
              animate="show"
            >
              <motion.p
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1"
              >
                AI Çalışma Koçu
              </motion.p>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="text-xl font-black text-white mb-1"
              >
                {getGreeting(userName)}
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                className="text-sm text-white/40"
              >
                Çalışma alışkanlıklarını analiz ederek sana özel içgörüler ve öneriler üretiyorum.
              </motion.p>
            </motion.div>
          </div>

          {/* Weekly report CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            onClick={() => setShowWeeklyReport(true)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="relative shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-900/40 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <BarChart2 className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Haftalık Rapor</span>
          </motion.button>
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/[0.06]"
        >
          {[
            { icon: Sparkles, text: 'Günlük İçgörüler' },
            { icon: Lightbulb, text: 'Akıllı Öneriler' },
            { icon: BarChart2, text: 'Haftalık Analiz' },
            { icon: Brain, text: 'Kişiselleştirilmiş Koçluk' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full">
              <Icon className="w-2.5 h-2.5" />
              {text}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <AIInsightsSection onOpenWeeklyReport={() => setShowWeeklyReport(true)} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AIRecommendations />
        </motion.div>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-5"
      >
        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">AI Nasıl Çalışır?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Veri Analizi', desc: 'Pomodoro seansları, görev tamamlama oranları ve XP verilerini analiz eder.' },
            { step: '02', title: 'İçgörü Üretimi', desc: 'Claude AI modeliyle günlük ve haftalık kişiselleştirilmiş içgörüler oluşturur.' },
            { step: '03', title: 'Öneriler', desc: 'Çalışma alışkanlıklarını iyileştirmek için spesifik, uygulanabilir öneriler sunar.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <span className="text-xs font-black text-indigo-500/40 tabular-nums shrink-0 mt-0.5">{step}</span>
              <div>
                <p className="text-xs font-bold text-white/60 mb-1">{title}</p>
                <p className="text-[11px] text-white/30 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Report Modal */}
      <AnimatePresence>
        {showWeeklyReport && (
          <WeeklyReportModal onClose={() => setShowWeeklyReport(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
