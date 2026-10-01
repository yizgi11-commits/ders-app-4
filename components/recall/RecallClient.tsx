'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  RecallCard, RecallQueueGroup, RecallQueueResponse, RecallStats,
} from '@/lib/recall/types'
import { SectionLabel } from '@/components/ui/section-label'
import { ErrorState } from '@/components/ui/states'
import RecallQueue from './RecallQueue'
import RecallSession from './RecallSession'
import RecallAnalytics from './RecallAnalytics'

export default function RecallClient() {
  const [queue, setQueue]   = useState<RecallQueueResponse | null>(null)
  const [stats, setStats]   = useState<RecallStats | null>(null)
  const [session, setSession] = useState<RecallCard[] | null>(null)
  const [failed, setFailed]   = useState(false)

  const load = useCallback(async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        fetch('/api/recall/queue'),
        fetch('/api/recall/stats'),
      ])
      if (queueRes.ok) setQueue(await queueRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
      // A failed queue read used to leave the skeleton up forever.
      setFailed(!queueRes.ok)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function startAll() {
    if (!queue) return
    const all = queue.groups.flatMap(g => g.cards)
    if (all.length > 0) setSession(all)
  }

  function startTopic(group: RecallQueueGroup) {
    if (group.cards.length > 0) setSession(group.cards)
  }

  if (session) {
    // Full-bleed white sheet: cancels the dashboard <main> padding so the
    // session reads as a clean page, then re-applies the same padding inside.
    return (
      <div className="-mx-4 -mt-4 -mb-24 lg:-mx-6 lg:-mt-6 lg:-mb-20 min-h-[calc(100dvh-3.5rem)] bg-surface px-4 pt-6 pb-28 lg:px-6 lg:pb-24">
        <RecallSession
          cards={session}
          onFinished={load}
          onClose={() => { setSession(null); load() }}
        />
      </div>
    )
  }

  if (failed && !queue) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorState onRetry={() => { setFailed(false); load() }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <RecallQueue queue={queue} onStart={startAll} onStartTopic={startTopic} />

      <section className="mt-14">
        <SectionLabel className="pb-2 mb-5 border-b border-border">RECALL ANALİZİ</SectionLabel>
        <RecallAnalytics stats={stats} />
      </section>
    </div>
  )
}
