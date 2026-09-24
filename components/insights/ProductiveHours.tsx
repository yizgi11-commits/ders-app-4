'use client'

import { motion } from 'framer-motion'
import { EASE_CURVE } from '@/lib/motion'
import type { HourlyStat } from '@/lib/analytics/types'
import { SectionLabel } from '@/components/ui/section-label'

interface Props {
  hourly: HourlyStat[]
}

function fmtMinutes(mins: number): string {
  if (mins < 60) return `${mins}dk`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}s` : `${h}s ${m}dk`
}

const pad = (h: number) => String(h).padStart(2, '0')

// Thin 24-hour bar chart: 4px accent bars, height = share of the busiest hour.
export default function ProductiveHours({ hourly }: Props) {
  const byHour = new Map(hourly.map(h => [h.hour, h.minutes]))
  const hours  = Array.from({ length: 24 }, (_, h) => ({ hour: h, minutes: byHour.get(h) ?? 0 }))
  const max    = Math.max(1, ...hours.map(h => h.minutes))
  const peak   = hours.reduce((best, h) => (h.minutes > best.minutes ? h : best), hours[0])
  const hasData = peak.minutes > 0

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>PRODUCTIVE HOURS</SectionLabel>
        {hasData && (
          <p className="text-xs text-text-muted">
            Son 30 gün · Zirve <span className="tabular text-text">{pad(peak.hour)}:00</span>
          </p>
        )}
      </div>

      {!hasData ? (
        <p className="text-sm text-text-muted py-8">Henüz tamamlanmış odak oturumu yok.</p>
      ) : (
        <>
          <div className="mt-5 h-28 flex items-end justify-between border-b border-border">
            {hours.map((h, i) => (
              <div
                key={h.hour}
                className="flex-1 h-full flex items-end justify-center"
                title={`${pad(h.hour)}:00 — ${fmtMinutes(h.minutes)}`}
              >
                {h.minutes > 0 && (
                  <motion.div
                    className="w-1 rounded-t-[2px] bg-accent"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(3, (h.minutes / max) * 100)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.015, ease: EASE_CURVE }}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Every 3rd hour, centred under its bar — positioned, so narrow screens don't overflow */}
          <div className="relative mt-1.5 h-4">
            {hours.filter(h => h.hour % 3 === 0).map(h => (
              <span
                key={h.hour}
                className="absolute -translate-x-1/2 tabular text-xs text-text-muted"
                style={{ left: `${((h.hour + 0.5) / 24) * 100}%` }}
              >
                {pad(h.hour)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
