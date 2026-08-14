'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  RecallCard, RecallQueueGroup, RecallQueueResponse, RecallStats,
} from '@/lib/recall/types'
import RecallQueue from './RecallQueue'
import RecallSession from './RecallSession'
import RecallAnalytics from './RecallAnalytics'

export default function RecallClient() {
  const [queue, setQueue]   = useState<RecallQueueResponse | null>(null)
  const [stats, setStats]   = useState<RecallStats | null>(null)
  const [session, setSession] = useState<RecallCard[] | null>(null)

  const load = useCallback(async () => {
    const [queueRes, statsRes] = await Promise.all([
      fetch('/api/recall/queue'),
      fetch('/api/recall/stats'),
    ])
    if (queueRes.ok) setQueue(await queueRes.json())
    if (statsRes.ok) setStats(await statsRes.json())
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
    return (
      <RecallSession
        cards={session}
        onFinished={load}
        onClose={() => { setSession(null); load() }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <RecallQueue queue={queue} onStart={startAll} onStartTopic={startTopic} />

      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Recall Analytics</h2>
        <RecallAnalytics stats={stats} />
      </div>
    </div>
  )
}
