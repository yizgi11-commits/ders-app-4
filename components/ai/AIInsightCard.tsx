'use client'

import { motion } from 'framer-motion'
import type { Insight } from '@/lib/ai/types'

const TYPE_CONFIG = {
  positive: { border: 'border-emerald-500/20', glow: 'rgba(52,211,153,0.08)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  warning:  { border: 'border-amber-500/20',   glow: 'rgba(251,191,36,0.08)',  badge: 'bg-amber-500/10  text-amber-400  border-amber-500/20',  dot: 'bg-amber-400'  },
  tip:      { border: 'border-indigo-500/20',  glow: 'rgba(99,102,241,0.08)', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
  neutral:  { border: 'border-white/[0.08]',   glow: 'rgba(255,255,255,0.03)', badge: 'bg-white/[0.07] text-white/50   border-white/[0.1]',   dot: 'bg-white/30'  },
}

interface Props {
  insight: Insight
  index:   number
}

export default function AIInsightCard({ insight, index }: Props) {
  const cfg = TYPE_CONFIG[insight.type]

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -12 },
        show:   {
          opacity: 1, x: 0,
          transition: { type: 'spring', stiffness: 340, damping: 28, delay: index * 0.07 },
        },
      }}
      className={`relative flex items-start gap-3 p-3.5 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-colors group`}
      style={{ borderColor: cfg.border.replace('border-', '') }}
    >
      {/* Left accent */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: cfg.dot.replace('bg-', 'var(--tw-')?.replace(')', '') }}>
        <div className={`absolute inset-0 rounded-full ${cfg.dot}`} />
      </div>

      {/* Icon */}
      <div className="text-xl shrink-0 ml-1">{insight.icon}</div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 leading-relaxed">{insight.text}</p>
      </div>

      {/* Metric badge */}
      {insight.metric && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 + index * 0.07, type: 'spring', stiffness: 400 }}
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}
        >
          {insight.metric}
        </motion.span>
      )}
    </motion.div>
  )
}
