'use client'

import { motion } from 'framer-motion'
import { scoreLabel } from '@/lib/analytics/productivity'
import type { ProductivityScore as Score } from '@/lib/analytics/types'

const PILLARS = [
  { key: 'consistency',       label: 'İstikrar',         desc: '7 günlük seri hedefi' },
  { key: 'task_completion',   label: 'Görev Tamamlama',  desc: 'Haftalık oran' },
  { key: 'focus_time',        label: 'Odak Süresi',      desc: '2 saat/gün hedefi' },
  { key: 'xp_growth',         label: 'XP Büyümesi',      desc: '500 XP/hafta hedefi' },
] as const

function GaugePath({ score }: { score: number }) {
  // SVG arc gauge: 0-100 → 0°-180°
  const r     = 52
  const cx    = 64
  const cy    = 68
  const start = { x: cx - r, y: cy }
  const pct   = Math.min(score / 100, 1)
  const angle = Math.PI * pct
  const end   = { x: cx + r * Math.cos(Math.PI - angle), y: cy - r * Math.sin(angle) }
  const large = pct > 0.5 ? 1 : 0
  const d     = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`

  // Color based on score
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#6366f1' : score >= 30 ? '#f59e0b' : '#94a3b8'

  return (
    <svg viewBox="0 0 128 72" className="w-full max-w-[180px]">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round"
      />
      {/* Fill */}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      />
    </svg>
  )
}

interface Props { score: Score }

export default function ProductivityScore({ score }: Props) {
  const { label, color } = scoreLabel(score.total)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Üretkenlik Skoru</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 7 günün genel performansı</p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
          Bu Hafta
        </span>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-full max-w-[180px]">
          <GaugePath score={score.total} />
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center -mb-1">
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
              className="text-3xl font-black text-gray-900 tabular-nums"
            >
              {score.total}
            </motion.p>
            <p className={`text-xs font-bold ${color}`}>{label}</p>
          </div>
        </div>
      </div>

      {/* Pillar bars */}
      <div className="space-y-3">
        {PILLARS.map(({ key, label, desc }) => {
          const val = score[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{desc}</span>
                </div>
                <span className="text-xs font-bold text-gray-900 tabular-nums">{val}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className={
                    val >= 75 ? 'h-full rounded-full bg-green-400' :
                    val >= 50 ? 'h-full rounded-full bg-indigo-400' :
                    val >= 30 ? 'h-full rounded-full bg-amber-400'  :
                                'h-full rounded-full bg-gray-300'
                  }
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
