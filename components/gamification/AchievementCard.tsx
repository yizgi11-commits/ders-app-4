'use client'

import { motion } from 'framer-motion'
import { Lock, Zap } from 'lucide-react'
import { RARITY_CONFIG } from '@/lib/gamification/achievements'
import type { Achievement } from '@/lib/gamification/types'

interface Props {
  achievement: Achievement
  unlocked:    boolean
  unlockedAt?: string
  index:       number
}

export default function AchievementCard({ achievement, unlocked, unlockedAt, index }: Props) {
  const cfg = RARITY_CONFIG[achievement.rarity]
  const date = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.95 },
        show: {
          opacity: 1, y: 0, scale: 1,
          transition: { type: 'spring', stiffness: 340, damping: 28, delay: index * 0.035 },
        },
      }}
      whileHover={unlocked ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-all group
        ${unlocked
          ? 'bg-gradient-to-br from-gray-900 to-gray-950 cursor-default'
          : 'bg-gray-950/60 opacity-55 cursor-default'
        }
      `}
      style={{ borderColor: unlocked ? `rgba(${rarityRgb(achievement.rarity)}, 0.3)` : 'rgba(255,255,255,0.06)' }}
    >
      {/* Glow overlay on hover */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: `inset 0 0 30px rgba(${rarityRgb(achievement.rarity)}, 0.12)` }}
        />
      )}

      {/* Icon + lock */}
      <div className="flex items-start justify-between">
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${cfg.bg} ${cfg.border}`}
          animate={unlocked ? {
            boxShadow: [
              `0 0 0px rgba(${rarityRgb(achievement.rarity)}, 0)`,
              `0 0 14px rgba(${rarityRgb(achievement.rarity)}, 0.5)`,
              `0 0 0px rgba(${rarityRgb(achievement.rarity)}, 0)`,
            ],
          } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
          style={!unlocked ? { filter: 'grayscale(100%) brightness(0.5)' } : {}}
        >
          {achievement.icon}
        </motion.div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              unlocked ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white/5 border-white/10 text-white/25'
            }`}
          >
            {cfg.label}
          </span>
          {!unlocked && (
            <Lock className="w-3.5 h-3.5 text-white/20" />
          )}
        </div>
      </div>

      {/* Text */}
      <div>
        <p className={`text-sm font-bold mb-0.5 ${unlocked ? 'text-white' : 'text-white/35'}`}>
          {achievement.title}
        </p>
        <p className={`text-[11px] leading-relaxed ${unlocked ? 'text-white/45' : 'text-white/20'}`}>
          {achievement.desc}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/[0.06]">
        <div className={`flex items-center gap-1 text-[11px] font-bold ${unlocked ? 'text-yellow-400' : 'text-white/20'}`}>
          <Zap className="w-3 h-3" />
          +{achievement.xpReward} XP
        </div>
        {date ? (
          <p className="text-[10px] text-white/25">{date}</p>
        ) : (
          <p className="text-[10px] text-white/15">Kilitli</p>
        )}
      </div>

      {/* Unlock shimmer effect */}
      {unlocked && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-[-100%] w-full h-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
            }}
            animate={{ left: ['−100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
        </div>
      )}
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
