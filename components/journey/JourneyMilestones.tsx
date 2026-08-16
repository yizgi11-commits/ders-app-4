'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Circle, Trophy, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACHIEVEMENTS, RARITY_CONFIG } from '@/lib/gamification/achievements'
import type { AchievementCategory } from '@/lib/gamification/types'

type Filter = 'all' | AchievementCategory

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'Tümü' },
  { id: 'focus',   label: 'Focus' },
  { id: 'streak',  label: 'Streak' },
  { id: 'recall',  label: 'Recall' },
  { id: 'planner', label: 'Planner' },
  { id: 'task',    label: 'Tasks' },
  { id: 'xp',      label: 'XP' },
  { id: 'special', label: 'Special' },
]

interface Props {
  unlocked: { achievement_id: string; unlocked_at: string }[]
}

export default function JourneyMilestones({ unlocked }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u.unlocked_at]))
  const list = ACHIEVEMENTS.filter(a => filter === 'all' || a.category === filter)

  // Unlocked first, then by rarity weight so the next goals read naturally.
  const RARITY_ORDER = { common: 0, uncommon: 1, rare: 2, legendary: 3 }
  const sorted = [...list].sort((a, b) => {
    const ua = unlockedMap.has(a.id) ? 0 : 1
    const ub = unlockedMap.has(b.id) ? 0 : 1
    if (ua !== ub) return ua - ub
    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  })

  const total = ACHIEVEMENTS.length
  const done  = ACHIEVEMENTS.filter(a => unlockedMap.has(a.id)).length
  const pct   = Math.round((done / total) * 100)

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Milestones
          </p>
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            {done}<span className="text-muted-foreground font-normal">/{total}</span>
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-border overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'relative text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors shrink-0',
              filter === f.id ? 'text-white' : 'text-muted-foreground hover:text-gray-700',
            )}
          >
            {filter === f.id && (
              <motion.span
                layoutId="milestone-filter"
                className="absolute inset-0 bg-indigo-600 rounded-full"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-border/70">
        {sorted.map(a => {
          const at  = unlockedMap.get(a.id)
          const on  = Boolean(at)
          const cfg = RARITY_CONFIG[a.rarity]
          return (
            <div
              key={a.id}
              className={cn('flex items-center gap-3 px-5 py-3', !on && 'opacity-60')}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                on ? 'bg-emerald-500' : 'border-2 border-gray-300',
              )}>
                {on ? <Check className="w-3 h-3 text-white" /> : <Circle className="w-0 h-0" />}
              </span>

              <span className="text-base shrink-0">{a.icon}</span>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold truncate',
                  on ? 'text-gray-900' : 'text-gray-500',
                )}>
                  {a.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{a.desc}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[10px] font-bold', cfg.color.replace('400', '600'))}>
                  {cfg.label}
                </span>
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />{a.xpReward}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
