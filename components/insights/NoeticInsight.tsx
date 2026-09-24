'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, RefreshCw, Lock } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-surface-subtle p-6"
    >
      <div className="flex items-baseline gap-3 mb-4">
        <SectionLabel>NOETIC INSIGHT</SectionLabel>
        {data?.fallback && <span className="text-xs text-text-muted">otomatik özet</span>}
        {data?.rate_limited && <span className="text-xs text-warning">günlük limit doldu</span>}
      </div>

      {tier === 'free' ? (
        <Link href="/dashboard/upgrade" className="flex items-center gap-3 group">
          <Lock className="size-4 text-text-muted shrink-0" />
          <p className="text-[15px] leading-[1.7] text-text-secondary">
            Haftalık yorum Pro&apos;da açılır.{' '}
            <span className="text-accent group-hover:text-accent-dark transition-colors duration-[160ms]">Yükselt →</span>
          </p>
        </Link>
      ) : (
      <>
      {status === 'checking' && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Kontrol ediliyor…
        </p>
      )}

      {status === 'idle' && (
        <div>
          <p className="text-[15px] leading-[1.7] text-text-secondary mb-4">
            Bu haftanın verilerini yorumlamamı ister misin?
          </p>
          <button
            onClick={generate}
            className="h-9 px-4 rounded-md border border-border bg-surface text-sm font-medium text-text hover:border-border-strong transition-colors duration-[160ms]"
          >
            Analiz et
          </button>
        </div>
      )}

      {status === 'generating' && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Veriler yorumlanıyor…
        </p>
      )}

      {status === 'error' && (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <RefreshCw className="size-4" /> Yorum şu anda üretilemedi.
        </p>
      )}

      {status === 'ready' && data && (
        <div>
          <p className="text-md font-semibold text-text flex items-start gap-2">
            <span className="shrink-0">{data.icon}</span>
            <span>{data.headline}</span>
          </p>
          <p className="mt-2 text-[15px] leading-[1.7] text-text-secondary">
            {data.body}
          </p>
        </div>
      )}
      </>
      )}
    </motion.div>
  )
}
