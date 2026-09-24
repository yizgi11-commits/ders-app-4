'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'
import { SectionLabel } from '@/components/ui/section-label'

// Plain measurement readout: no glow, no giant number.
const ROWS: { key: keyof LearningScoreResponse['breakdown']; label: string }[] = [
  { key: 'consistency', label: 'Consistency' },
  { key: 'focus',       label: 'Focus' },
  { key: 'recall',      label: 'Recall' },
  { key: 'completion',  label: 'Completion' },
]

export default function LearningScoreCard({ data }: { data: LearningScoreResponse }) {
  const { score, change, breakdown } = data

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <SectionLabel>LEARNING SCORE</SectionLabel>

      <p className="mt-3 tabular text-[48px] leading-none text-text">
        {score}<span className="text-text-muted"> / 100</span>
      </p>
      <p className={cn(
        'mt-2 text-sm',
        change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-text-muted',
      )}>
        {change === 0
          ? 'No change from last week'
          : <><span className="tabular">{change > 0 ? '+' : ''}{change}</span> from last week</>}
      </p>

      <div className="mt-6 space-y-3">
        {ROWS.map((row, i) => {
          const value = breakdown[row.key]
          return (
            <div key={row.key} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-sm text-text-secondary">{row.label}</span>
              <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_CURVE }}
                />
              </div>
              <span className="w-10 shrink-0 text-right tabular text-sm text-text">{value}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
