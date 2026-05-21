'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { stagger } from '@/lib/motion'
import type { Insight } from '@/lib/analytics/types'

const TYPE_STYLES: Record<Insight['type'], string> = {
  positive:    'bg-green-50   border-green-100  text-green-700',
  achievement: 'bg-indigo-50  border-indigo-100 text-indigo-700',
  warning:     'bg-amber-50   border-amber-100  text-amber-700',
  neutral:     'bg-gray-50    border-gray-100   text-gray-700',
}

const DOT_COLOR: Record<Insight['type'], string> = {
  positive:    'bg-green-400',
  achievement: 'bg-indigo-400',
  warning:     'bg-amber-400',
  neutral:     'bg-gray-300',
}

interface Props { insights: Insight[] }

export default function InsightsPanel({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.05 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Akıllı İçgörüler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Verilerine göre oluşturuldu</p>
        </div>
        <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-lg border border-violet-100">
          {insights.length} içgörü
        </span>
      </div>

      <motion.div
        variants={stagger(0.08, 0.05)}
        initial="hidden"
        animate="show"
        className="space-y-2.5"
      >
        {insights.map((ins) => (
          <motion.div
            key={ins.id}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 360, damping: 28 } } }}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border',
              TYPE_STYLES[ins.type]
            )}
          >
            <span className="text-base shrink-0 leading-none mt-0.5">{ins.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold leading-tight">{ins.title}</p>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLOR[ins.type])} />
              </div>
              <p className="text-[11px] mt-0.5 opacity-80 leading-relaxed">{ins.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
