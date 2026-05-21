'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RARITY_CONFIG } from '@/lib/gamification/achievements'
import type { Achievement } from '@/lib/gamification/types'
import { Zap } from 'lucide-react'

interface Props {
  achievement: Achievement
  index:       number
  onClose:     () => void
}

export default function AchievementToast({ achievement, index, onClose }: Props) {
  const cfg = RARITY_CONFIG[achievement.rarity]

  // Auto-dismiss after 5s
  useEffect(() => {
    const t = setTimeout(onClose, 5000 + index * 500)
    return () => clearTimeout(t)
  }, [onClose, index])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="pointer-events-auto"
      style={{ marginBottom: index > 0 ? -8 : 0 }}
    >
      <div
        className="relative bg-gray-950 border rounded-2xl px-4 py-3.5 flex items-center gap-3.5 min-w-[280px] max-w-[320px] overflow-hidden shadow-2xl"
        style={{ borderColor: `rgba(${rarityRgb(achievement.rarity)}, 0.35)` }}
      >
        {/* Glow edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl"
          style={{ background: `rgba(${rarityRgb(achievement.rarity)}, 0.8)`, boxShadow: `0 0 12px rgba(${rarityRgb(achievement.rarity)}, 0.6)` }}
        />

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${cfg.bg} border ${cfg.border}`}
        >
          {achievement.icon}
        </motion.div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: rarityColor(achievement.rarity) }}>
              Başarım Açıldı!
            </p>
          </div>
          <p className="text-sm font-bold text-white leading-tight truncate">{achievement.title}</p>
          <p className="text-[11px] text-white/40 truncate">{achievement.desc}</p>
        </div>

        {/* XP reward */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 400 }}
          className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-1 rounded-lg shrink-0"
        >
          <Zap className="w-3 h-3" />+{achievement.xpReward}
        </motion.div>

        {/* Progress bar (auto-dismiss indicator) */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{ background: `rgba(${rarityRgb(achievement.rarity)}, 0.6)` }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5 + index * 0.5, ease: 'linear' }}
        />
      </div>
    </motion.div>
  )
}

function rarityRgb(rarity: string): string {
  const map: Record<string, string> = {
    common:    '156,163,175',
    uncommon:  '52,211,153',
    rare:      '99,102,241',
    legendary: '251,191,36',
  }
  return map[rarity] ?? '156,163,175'
}

function rarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common:    '#9ca3af',
    uncommon:  '#34d399',
    rare:      '#818cf8',
    legendary: '#fbbf24',
  }
  return map[rarity] ?? '#9ca3af'
}
