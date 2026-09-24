'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
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

// A plain checklist: ✓ done, ○ not yet.
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
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="tabular text-sm text-text-secondary shrink-0">{done} / {total}</span>
      </div>

      {/* Filters — plain text */}
      <div className="flex items-center gap-4 mt-4 overflow-x-auto" role="group" aria-label="Kategori">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              'text-sm whitespace-nowrap shrink-0 transition-colors duration-[160ms]',
              filter === f.id ? 'text-accent font-medium' : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Checklist */}
      <ul className="mt-3 border-t border-border">
        {sorted.map(a => {
          const on = unlockedMap.has(a.id)
          return (
            <li key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border">
              <span
                aria-label={on ? 'Tamamlandı' : 'Henüz değil'}
                className={cn(
                  'size-4 shrink-0 rounded-full flex items-center justify-center',
                  on ? 'bg-success' : 'border border-border-strong',
                )}
              >
                {on && <Check className="size-2.5 text-white" strokeWidth={3} />}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-base truncate', on ? 'text-text font-medium' : 'text-text-secondary')}>
                  {a.title}
                </p>
                <p className="text-xs text-text-muted truncate">{a.desc}</p>
              </div>
              <span className="tabular text-xs text-text-muted shrink-0">+{a.xpReward} XP</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
