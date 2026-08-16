'use client'

import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Brain, Flame, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyticsData } from '@/lib/analytics/types'

function fmtFocus(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export default function WeekMetrics({ data }: { data: AnalyticsData }) {
  const w = data.weeklyComparison

  const tiles = [
    {
      icon: Clock,
      color: 'indigo' as const,
      label: 'Focus',
      value: fmtFocus(w.this_week_minutes),
      delta: w.minutes_change_pct,
    },
    {
      icon: CheckCircle2,
      color: 'emerald' as const,
      label: 'Completion',
      value: `%${data.productivityScore.task_completion}`,
      delta: null,
    },
    {
      icon: Brain,
      color: 'violet' as const,
      label: 'Recall',
      value: `%${data.recallWeek.successRate}`,
      hint: data.recallWeek.total > 0 ? `${data.recallWeek.total} tekrar` : 'tekrar yok',
      delta: null,
    },
    {
      icon: Flame,
      color: 'orange' as const,
      label: 'Consistency',
      value: `%${data.productivityScore.consistency}`,
      hint: `${data.currentStreak} gün seri`,
      delta: null,
    },
  ]

  return (
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">
        This Week
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('bg-white rounded-2xl border p-4 shadow-sm', COLORS[t.color].border)}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center ring-1 mb-3', COLORS[t.color].bg, COLORS[t.color].ring)}>
              <t.icon className={cn('w-4 h-4', COLORS[t.color].icon)} />
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-xl font-black text-gray-900 tabular-nums">{t.value}</p>
              {t.delta !== null && t.delta !== 0 && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-[11px] font-bold',
                  t.delta > 0 ? 'text-emerald-600' : 'text-red-500',
                )}>
                  {t.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(t.delta)}%
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
            {t.hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t.hint}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const COLORS = {
  indigo:  { bg: 'bg-indigo-50/80',  ring: 'ring-indigo-100',  icon: 'text-indigo-600',  border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50/80', ring: 'ring-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-100' },
  violet:  { bg: 'bg-violet-50/80',  ring: 'ring-violet-100',  icon: 'text-violet-600',  border: 'border-violet-100' },
  orange:  { bg: 'bg-orange-50/80',  ring: 'ring-orange-100',  icon: 'text-orange-600',  border: 'border-orange-100' },
} as const
