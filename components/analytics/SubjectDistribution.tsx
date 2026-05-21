'use client'

import { motion } from 'framer-motion'
import { stagger } from '@/lib/motion'
import type { SubjectStat } from '@/lib/analytics/types'

const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
  'bg-cyan-500',   'bg-emerald-500','bg-amber-500',
]
const TEXT_COLORS = [
  'text-indigo-600', 'text-violet-600', 'text-blue-600',
  'text-cyan-600',   'text-emerald-600','text-amber-600',
]
const BG_LIGHT = [
  'bg-indigo-50', 'bg-violet-50', 'bg-blue-50',
  'bg-cyan-50',   'bg-emerald-50','bg-amber-50',
]

interface Props { subjects: SubjectStat[] }

export default function SubjectDistribution({ subjects }: Props) {
  const maxTotal = Math.max(...subjects.map(s => s.total), 1)

  if (subjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.16 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Ders Dağılımı</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Son 30 günün görev dağılımı</p>
        </div>
      </div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {subjects.map(({ subject, total, completed, completion_rate, xp_earned }, i) => (
          <motion.div
            key={subject}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 360, damping: 28 } } }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                <span className="text-xs font-semibold text-gray-700">{subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${BG_LIGHT[i % BG_LIGHT.length]} ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>
                  %{completion_rate}
                </span>
                <span className="text-[10px] text-muted-foreground">{completed}/{total}</span>
              </div>
            </div>
            {/* Bar */}
            <div className="relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${COLORS[i % COLORS.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${(total / maxTotal) * 100}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.06 }}
              />
              {/* Completion overlay */}
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full bg-white/40"
                style={{ left: `${(completed / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* XP summary */}
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Toplam XP kazanıldı</span>
        <span className="text-sm font-bold text-indigo-600">
          {subjects.reduce((s, x) => s + x.xp_earned, 0).toLocaleString('tr')} XP
        </span>
      </div>
    </motion.div>
  )
}
