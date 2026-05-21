'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ACHIEVEMENTS, RARITY_CONFIG } from '@/lib/gamification/achievements'
import type { UserAchievement } from '@/lib/gamification/types'
import AchievementCard from './AchievementCard'
import { Trophy, Filter } from 'lucide-react'
import { stagger } from '@/lib/motion'

type Category = 'all' | 'pomodoro' | 'streak' | 'task' | 'xp' | 'focus' | 'special'

const CATEGORY_LABELS: Record<Category, string> = {
  all:      'Tümü',
  pomodoro: 'Pomodoro',
  streak:   'Seri',
  task:     'Görev',
  xp:       'XP & Seviye',
  focus:    'Odak',
  special:  'Özel',
}

interface Props {
  userAchievements: UserAchievement[]
}

export default function AchievementsGrid({ userAchievements }: Props) {
  const [activeCategory, setCategory] = useState<Category>('all')

  const unlockedMap = new Map(
    userAchievements.map(ua => [ua.achievement_id, ua.unlocked_at])
  )

  const filtered = ACHIEVEMENTS.filter(a =>
    activeCategory === 'all' || a.category === activeCategory
  )

  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedMap.has(a.id)).length
  const totalCount    = ACHIEVEMENTS.length
  const pct           = Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="flex flex-col gap-6">

      {/* Header stats */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {/* Overall progress */}
        <div className="sm:col-span-2 bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <motion.circle
                cx="32" cy="32" r="26" fill="none"
                stroke="url(#achGrad)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
              <defs>
                <linearGradient id="achGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-white">{pct}%</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-black text-white">
              {unlockedCount}
              <span className="text-white/30 font-normal text-sm">/{totalCount}</span>
            </p>
            <p className="text-xs text-white/40">Başarım Açıldı</p>
            <div className="flex gap-1 mt-2">
              {(['common', 'uncommon', 'rare', 'legendary'] as const).map(r => {
                const cnt = userAchievements.filter(ua =>
                  ACHIEVEMENTS.find(a => a.id === ua.achievement_id)?.rarity === r
                ).length
                const c = RARITY_CONFIG[r]
                return cnt > 0 ? (
                  <span key={r} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.color}`}>
                    {cnt}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </div>

        {/* Rarity breakdown */}
        {(['uncommon', 'rare', 'legendary'] as const).map(r => {
          const c   = RARITY_CONFIG[r]
          const cnt = userAchievements.filter(ua =>
            ACHIEVEMENTS.find(a => a.id === ua.achievement_id)?.rarity === r
          ).length
          const total = ACHIEVEMENTS.filter(a => a.rarity === r).length
          return (
            <div key={r} className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-4">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${c.color}`}>{c.label}</div>
              <p className="text-2xl font-black text-white">{cnt}<span className="text-sm font-normal text-white/30">/{total}</span></p>
            </div>
          )
        })}
      </motion.div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Filter className="w-3.5 h-3.5 text-white/25 shrink-0" />
        {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`relative text-[11px] font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors shrink-0 ${
              activeCategory === cat
                ? 'text-white'
                : 'text-white/35 hover:text-white/60'
            }`}
          >
            {activeCategory === cat && (
              <motion.div
                layoutId="ach-filter"
                className="absolute inset-0 bg-white/[0.1] border border-white/[0.12] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {filtered.map((achievement, i) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedMap.has(achievement.id)}
              unlockedAt={unlockedMap.get(achievement.id)}
              index={i}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/25 text-sm">
          Bu kategoride başarım yok.
        </div>
      )}
    </div>
  )
}
