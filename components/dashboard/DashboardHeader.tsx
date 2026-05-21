'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface Props {
  tarih: string
}

export default function DashboardHeader({ tarih }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '⚡' : '🌙'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between"
    >
      <div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="flex items-center gap-2 mb-1"
        >
          <span className="text-base">{emoji}</span>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
            {greeting}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-xl font-black text-gray-900 tracking-tight"
        >
          Genel Bakış
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground capitalize mt-0.5"
        >
          {tarih}
        </motion.p>
      </div>

      {/* Decorative badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.25 }}
        className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full"
      >
        <Sparkles className="w-3 h-3" />
        Bugün harika ol
      </motion.div>
    </motion.div>
  )
}
