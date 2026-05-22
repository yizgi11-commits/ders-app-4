'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'
import type { DailyCoachData } from '@/lib/ai/types'
import AIInsightCard from './AIInsightCard'
import AILoadingState from './AILoadingState'
import { stagger } from '@/lib/motion'

interface Props {
  onOpenWeeklyReport?: () => void
}

export default function AIInsightsSection({ onOpenWeeklyReport }: Props) {
  const [data, setData]         = useState<DailyCoachData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [res] = await Promise.all([
        fetch('/api/ai/insights'),
        new Promise(r => setTimeout(r, 600)),
      ])
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: [0, 15, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            className="w-7 h-7 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 rounded-lg border border-indigo-500/25 flex items-center justify-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </motion.div>
          <div>
            <p className="text-xs font-bold text-white">AI Çalışma Koçu</p>
            <p className="text-[10px] text-white/30">Günlük kişisel analiz</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Weekly report button */}
          {onOpenWeeklyReport && (
            <button
              onClick={onOpenWeeklyReport}
              className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Haftalık Rapor
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AILoadingState lines={3} />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <p className="text-2xl">🤖</p>
              <p className="text-xs text-white/40">AI şu an yanıt veremiyor.</p>
              <button onClick={() => load()} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                Tekrar dene
              </button>
            </motion.div>
          ) : data ? (
            <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Greeting */}
              {data.greeting && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-semibold text-indigo-400 mb-3 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {data.greeting}
                </motion.p>
              )}

              {/* Insights */}
              <motion.div
                variants={stagger(0.07)}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-2"
              >
                {data.insights.map((insight, i) => (
                  <AIInsightCard key={i} insight={insight} index={i} />
                ))}
              </motion.div>

              {/* Motivation */}
              {data.motivation && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 pt-4 border-t border-white/[0.06]"
                >
                  <p className="text-[11px] text-white/35 italic text-center leading-relaxed">
                    ✨ {data.motivation}
                  </p>
                </motion.div>
              )}

              {/* Timestamp */}
              <p className="text-[9px] text-white/15 text-right mt-3">
                {new Date(data.generated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} güncellendi
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
