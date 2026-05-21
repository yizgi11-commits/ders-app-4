'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, Coffee, Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Recommendations } from '@/lib/ai/types'
import AILoadingState from './AILoadingState'
import { stagger } from '@/lib/motion'

const DIFFICULTY_CONFIG = {
  increase: { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Zorluk Artır' },
  decrease: { icon: TrendingDown, color: 'text-amber-400',   bg: 'bg-amber-500/10   border-amber-500/20',   label: 'Zorluk Azalt' },
  maintain: { icon: Minus,        color: 'text-indigo-400',  bg: 'bg-indigo-500/10  border-indigo-500/20',  label: 'Seviyeyi Koru' },
}

export default function AIRecommendations() {
  const [data, setData]       = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    // Slight delay for "AI analyzing" feel
    Promise.all([
      fetch('/api/ai/recommendations'),
      new Promise(r => setTimeout(r, 800)),
    ])
      .then(([res]) => (res as Response).json())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const diffCfg = data ? DIFFICULTY_CONFIG[data.difficulty_adjustment] : null
  const DiffIcon = diffCfg?.icon ?? Minus

  const tips = data ? [
    { icon: Clock,  text: data.focus_tip,    color: 'text-indigo-400',  bg: 'bg-indigo-500/10  border-indigo-500/20'  },
    { icon: Coffee, text: data.break_tip,    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Brain,  text: data.workload_tip, color: 'text-violet-400',  bg: 'bg-violet-500/10  border-violet-500/20'  },
  ] : []

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 bg-gradient-to-br from-violet-500/30 to-indigo-500/20 rounded-lg border border-violet-500/25 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">AI Öneriler</p>
          <p className="text-[10px] text-white/30">Kişiselleştirilmiş tavsiyeler</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AILoadingState lines={2} />
            </motion.div>
          ) : error || !data ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4 text-center">
              <p className="text-xs text-white/30">Öneri yüklenemedi.</p>
            </motion.div>
          ) : (
            <motion.div
              key="data"
              variants={stagger(0.08)}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {/* Difficulty recommendation */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${diffCfg?.bg}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${diffCfg?.bg}`}>
                  <DiffIcon className={`w-4 h-4 ${diffCfg?.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${diffCfg?.color}`}>
                    {diffCfg?.label}
                  </p>
                  <p className="text-[11px] text-white/55 leading-snug">{data.difficulty_reason}</p>
                </div>
              </motion.div>

              {/* Session duration */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-white/60">Önerilen oturum süresi</span>
                </div>
                <span className="text-sm font-bold text-white">{data.optimal_session_mins} dk</span>
              </motion.div>

              {/* Tips */}
              {tips.map((tip, i) => (
                <motion.div
                  key={i}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-start gap-2.5 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl"
                >
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${tip.bg}`}>
                    <tip.icon className={`w-3 h-3 ${tip.color}`} />
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed">{tip.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
