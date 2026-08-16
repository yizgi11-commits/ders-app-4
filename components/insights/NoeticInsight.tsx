'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import type { NoeticInsightData } from '@/lib/insights/types'

export default function NoeticInsight() {
  const [data, setData]       = useState<NoeticInsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/insights/noetic')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-gray-950 to-gray-900 p-6 shadow-lg"
    >
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/12 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-600/10 rounded-full blur-[60px] pointer-events-none" />

      {/* Label — makes it unmistakable that this layer is AI-written */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-[0.16em]">
          Noetic Insight
        </span>
        {data?.fallback && (
          <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
            otomatik özet
          </span>
        )}
        {data?.rate_limited && (
          <span className="text-[10px] text-amber-300/70 border border-amber-400/20 rounded-full px-2 py-0.5">
            günlük limit doldu
          </span>
        )}
      </div>

      {loading ? (
        <div className="relative flex items-center gap-2.5 text-white/40 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-sm">Veriler yorumlanıyor…</span>
        </div>
      ) : error || !data ? (
        <div className="relative flex items-center gap-2.5 text-white/40 py-3">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Yorum şu anda üretilemedi.</span>
        </div>
      ) : (
        <div className="relative">
          <p className="text-lg font-bold text-white leading-snug flex items-start gap-2.5">
            <span className="text-xl shrink-0 leading-none mt-0.5">{data.icon}</span>
            <span>{data.headline}</span>
          </p>
          <p className="text-sm text-white/55 leading-relaxed mt-3">
            {data.body}
          </p>
        </div>
      )}
    </motion.div>
  )
}
