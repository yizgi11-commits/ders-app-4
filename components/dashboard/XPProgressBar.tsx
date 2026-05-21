'use client'

import { motion } from 'framer-motion'

interface XPProgressBarProps {
  pct:     number
  current: number
  required: number
  level:   number
}

export function XPProgressBar({ pct, current, required, level }: XPProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/60 mb-2">
        <span>{current.toLocaleString('tr')} XP</span>
        <span>{required.toLocaleString('tr')} XP</span>
      </div>
      <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-yellow-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        />
      </div>
      <p className="text-xs text-white/50 mt-1.5 text-center">
        Seviye {level + 1} için %{pct} tamamlandı
      </p>
    </div>
  )
}
