'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Zap, Trophy } from 'lucide-react'
import type { JourneyResponse } from '@/lib/journey/types'
import JourneyTimeline from './JourneyTimeline'
import JourneyCalendar from './JourneyCalendar'
import JourneyMilestones from './JourneyMilestones'

export default function JourneyClient() {
  const [data, setData] = useState<JourneyResponse | null>(null)

  useEffect(() => {
    fetch('/api/journey')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-48 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-64 bg-white border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* XP / Level / Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Level</p>
              <p className="text-3xl font-black leading-tight">{data.xp.level}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Toplam XP</p>
              <p className="text-xl font-black tabular-nums">{data.xp.totalXp.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.xp.pct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-[11px] text-white/70 mt-1.5 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {data.xp.current} / {data.xp.required} XP — sonraki seviyeye
          </p>
        </div>

        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <div className="w-9 h-9 rounded-xl bg-orange-50 ring-1 ring-orange-100 flex items-center justify-center mb-3">
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 tabular-nums">{data.streak.current} gün</p>
          <p className="text-xs text-muted-foreground mt-0.5">Güncel seri</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">Rekor: {data.streak.longest} gün</p>
        </div>
      </div>

      {/* Contribution graph */}
      <JourneyCalendar days={data.days} />

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-4">Timeline</h2>
        <JourneyTimeline days={data.days} />
      </div>

      {/* Milestones */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Milestones
        </h2>
        <JourneyMilestones unlocked={data.unlocked} />
      </div>
    </div>
  )
}
