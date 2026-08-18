'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw, Wand2, Lock } from 'lucide-react'
import type { NoeticInsightData } from '@/lib/insights/types'
import type { SubscriptionTier } from '@/lib/subscription'

type Status = 'checking' | 'idle' | 'generating' | 'ready' | 'error'

export default function NoeticInsight({ tier }: { tier: SubscriptionTier }) {
  const [status, setStatus] = useState<Status>('checking')
  const [data, setData]     = useState<NoeticInsightData | null>(null)

  // Cache read only — never triggers generation. If nothing was
  // generated yet this week, the user gets an explicit "Analiz Et"
  // button instead of a silent auto-generation. Free never calls this
  // at all — AI Insights is Pro-only.
  useEffect(() => {
    if (tier !== 'pro') return
    let cancelled = false
    fetch('/api/insights/noetic')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: NoeticInsightData & { cached: boolean }) => {
        if (cancelled) return
        if (d.cached) { setData(d); setStatus('ready') } else setStatus('idle')
      })
      .catch(() => { if (!cancelled) setStatus('idle') })
    return () => { cancelled = true }
  }, [tier])

  async function generate() {
    setStatus('generating')
    try {
      const res = await fetch('/api/insights/noetic', { method: 'POST' })
      if (!res.ok) throw new Error()
      setData(await res.json())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

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

      {tier === 'free' ? (
        <Link href="/dashboard/upgrade" className="relative flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-white/40" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/70">Haftalık AI yorumu Pro’da açılır.</p>
            <p className="text-xs text-indigo-300 group-hover:text-indigo-200 transition-colors">Yükseltmek için dokun →</p>
          </div>
        </Link>
      ) : (
      <>
      {status === 'checking' && (
        <div className="relative flex items-center gap-2.5 text-white/40 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-sm">Kontrol ediliyor…</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="relative py-1">
          <p className="text-sm text-white/50 leading-relaxed mb-3.5">
            Bu haftanın verilerini yorumlamamı ister misin?
          </p>
          <button
            onClick={generate}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors border border-white/10"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
            Analiz Et
          </button>
        </div>
      )}

      {status === 'generating' && (
        <div className="relative flex items-center gap-2.5 text-white/40 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-sm">Veriler yorumlanıyor…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="relative flex items-center gap-2.5 text-white/40 py-3">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Yorum şu anda üretilemedi.</span>
        </div>
      )}

      {status === 'ready' && data && (
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
      </>
      )}
    </motion.div>
  )
}
