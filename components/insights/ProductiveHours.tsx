'use client'

import { motion } from 'framer-motion'
import { Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HourlyStat } from '@/lib/analytics/types'

interface Props {
  hourly: HourlyStat[]
}

function fmtMinutes(mins: number): string {
  if (mins < 60) return `${mins}dk`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}s` : `${h}s ${m}dk`
}

export default function ProductiveHours({ hourly }: Props) {
  const active = hourly.filter(h => h.minutes > 0)
  const max = Math.max(1, ...active.map(h => h.minutes))

  // Only the hours the user actually studies in, most productive first,
  // so the chart doesn't waste rows on 24 mostly-empty slots.
  const ranked = [...active].sort((a, b) => b.minutes - a.minutes).slice(0, 8)
  const rows = ranked.sort((a, b) => a.hour - b.hour)
  const peak = ranked.length > 0 ? [...ranked].sort((a, b) => b.minutes - a.minutes)[0] : null

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-indigo-500" />
            Most Productive Hours
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Son 30 günün odak dağılımı</p>
        </div>
        {peak && (
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 shrink-0">
            Zirve {String(peak.hour).padStart(2, '0')}:00
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Henüz tamamlanmış odak oturumu yok.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((h, i) => {
            const pct = (h.minutes / max) * 100
            const isPeak = peak?.hour === h.hour
            return (
              <div key={h.hour} className="flex items-center gap-3">
                <span className={cn(
                  'text-xs tabular-nums w-12 shrink-0',
                  isPeak ? 'font-bold text-indigo-600' : 'text-muted-foreground',
                )}>
                  {String(h.hour).padStart(2, '0')}:00
                </span>

                <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-md', isPeak ? 'bg-indigo-600' : 'bg-indigo-400')}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <span className="text-xs font-semibold text-gray-700 tabular-nums w-16 text-right shrink-0">
                  {fmtMinutes(h.minutes)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
