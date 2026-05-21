'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DailyFocusStat } from '@/lib/analytics/types'

const TR_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

interface Props { data: DailyFocusStat[] }  // last 30 days

function intensityClass(minutes: number): string {
  if (minutes === 0)   return 'bg-gray-100'
  if (minutes < 30)    return 'bg-indigo-100'
  if (minutes < 60)    return 'bg-indigo-200'
  if (minutes < 90)    return 'bg-indigo-400'
  if (minutes < 120)   return 'bg-indigo-500'
  return                      'bg-indigo-600'
}

export default function FocusHeatmap({ data }: Props) {
  const maxMins = Math.max(...data.map(d => d.focus_minutes), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.18 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Odak Isı Haritası</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 30 günün odak yoğunluğu</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Az</span>
          {['bg-gray-100', 'bg-indigo-100', 'bg-indigo-300', 'bg-indigo-500', 'bg-indigo-700'].map((c, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>Çok</span>
        </div>
      </div>

      {/* Grid: 5 rows × 7 cols (max 35 days, show last 30) */}
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {TR_SHORT.map(d => (
              <p key={d} className="text-center text-[9px] text-muted-foreground/60 font-medium">{d}</p>
            ))}
          </div>

          {/* Pad data to start on correct weekday */}
          {(() => {
            const firstDow = new Date(data[0]?.date + 'T12:00:00').getDay()
            const padded: (DailyFocusStat | null)[] = [
              ...Array(firstDow).fill(null),
              ...data,
            ]
            // Fill to complete last row
            while (padded.length % 7 !== 0) padded.push(null)

            const rows: (DailyFocusStat | null)[][] = []
            for (let i = 0; i < padded.length; i += 7) rows.push(padded.slice(i, i + 7))

            return rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1 mb-1">
                {row.map((cell, ci) => (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (ri * 7 + ci) * 0.008, type: 'spring', stiffness: 400, damping: 22 }}
                    title={cell ? `${cell.date}: ${cell.focus_minutes} dk` : ''}
                    className={cn(
                      'aspect-square rounded-md',
                      cell ? intensityClass(cell.focus_minutes) : 'opacity-0'
                    )}
                  />
                ))}
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
        <span className="text-xs text-muted-foreground">
          Aktif günler:{' '}
          <span className="font-bold text-gray-900">
            {data.filter(d => d.focus_minutes > 0).length}
          </span>
          /{data.length}
        </span>
        <span className="text-xs text-muted-foreground">
          Toplam:{' '}
          <span className="font-bold text-indigo-600">
            {Math.round(data.reduce((s, d) => s + d.focus_minutes, 0) / 60 * 10) / 10} saat
          </span>
        </span>
      </div>
    </motion.div>
  )
}
