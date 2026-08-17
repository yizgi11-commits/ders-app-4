'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-gray-900'
}

const ROWS: { key: keyof LearningScoreResponse['breakdown']; label: string; color: string }[] = [
  { key: 'focus',       label: 'Focus',       color: 'bg-indigo-500' },
  { key: 'recall',      label: 'Recall',      color: 'bg-violet-500' },
  { key: 'completion',  label: 'Completion',  color: 'bg-emerald-500' },
  { key: 'consistency', label: 'Consistency', color: 'bg-orange-500' },
]

export default function LearningScoreCard({ data }: { data: LearningScoreResponse }) {
  const { score, change, breakdown } = data

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">
        Learning Score
      </p>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={cn('text-3xl font-black tabular-nums', scoreTone(score))}>{score}</span>
        {change !== 0 && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs font-bold',
            change > 0 ? 'text-emerald-600' : 'text-red-500',
          )}>
            {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change > 0 ? '+' : ''}{change} this week
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {ROWS.map((row, i) => {
          const value = breakdown[row.key]
          return (
            <div key={row.key} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">{row.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('h-full rounded-full', row.color)}
                />
              </div>
              <span className="text-xs font-bold text-gray-900 tabular-nums w-9 text-right shrink-0">{value}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
