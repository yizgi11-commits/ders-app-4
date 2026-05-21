'use client'

import { motion } from 'framer-motion'
import { Clock, Flame, TrendingUp, Trophy, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { stagger } from '@/lib/motion'

function fmtMinutes(mins: number) {
  if (mins < 60) return `${mins}dk`
  return `${Math.floor(mins / 60)}s ${mins % 60}dk`
}

const COLOR_MAP: Record<string, { icon: string; bg: string; glow: string }> = {
  indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/20',  glow: 'rgba(99,102,241,0.3)' },
  violet: { icon: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/20',  glow: 'rgba(139,92,246,0.3)' },
  amber:  { icon: 'text-amber-400',  bg: 'bg-amber-500/15  border-amber-500/20',   glow: 'rgba(245,158,11,0.3)' },
  orange: { icon: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20',  glow: 'rgba(249,115,22,0.3)' },
}

const ICON_MAP: Record<string, LucideIcon> = {
  indigo: Clock,
  violet: TrendingUp,
  amber: Trophy,
  orange: Flame,
}

interface TopCard {
  label: string
  value: string
  sub: string
  color: string
}

interface Bar {
  label: string
  minutes: number
  isToday: boolean
}

interface Session {
  type: string
  status: string
  xp_earned: number
  started_at: string
}

interface Props {
  topCards: TopCard[]
  bars: Bar[]
  weekMinutes: number
  recentSessions: Session[]
}

export default function StudyStatsClient({ topCards, bars, weekMinutes, recentSessions }: Props) {
  const maxMinutes = Math.max(...bars.map(b => b.minutes), 1)

  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        {topCards.map(({ label, value, sub, color }) => {
          const c = COLOR_MAP[color] ?? COLOR_MAP.indigo
          const Icon = ICON_MAP[color] ?? Clock
          return (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 28 } }
              }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="relative bg-gradient-to-br from-gray-900 to-gray-950 border border-white/[0.07] rounded-2xl p-4 overflow-hidden group"
            >
              {/* Subtle inner glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `inset 0 0 30px ${c.glow}` }}
              />
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-2.5 ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
              </div>
              <p className="text-lg font-black text-white leading-tight">{value}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* 7-day bar chart */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.28 } }
        }}
        className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/[0.07] rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white/80">Haftalık Odak</h3>
          <span className="text-[11px] text-indigo-400 font-semibold">
            {fmtMinutes(weekMinutes)}
          </span>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {bars.map(({ label, minutes, isToday }, i) => {
            const pct = Math.round((minutes / maxMinutes) * 100)
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-white/30 h-3 flex items-center">
                  {minutes > 0 ? fmtMinutes(minutes) : ''}
                </span>
                <div className="w-full flex items-end justify-center h-12">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${minutes === 0 ? 8 : Math.max(pct, 8)}%` }}
                    transition={{ duration: 0.6, delay: 0.35 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full rounded-t-md"
                    style={{
                      background: minutes === 0
                        ? 'rgba(255,255,255,0.05)'
                        : isToday
                          ? 'linear-gradient(to top, #4f46e5, #7c3aed)'
                          : 'rgba(99,102,241,0.35)',
                      boxShadow: isToday && minutes > 0 ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
                    }}
                  />
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-400' : 'text-white/30'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28, delay: 0.38 } }
          }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/[0.07] rounded-2xl p-4"
        >
          <h3 className="text-xs font-bold text-white/80 mb-3">Son Oturumlar</h3>
          <div className="flex flex-col gap-1.5">
            {recentSessions.map((s, i) => {
              const label = s.type === 'focus' ? '🎯 Odak' : s.type === 'short_break' ? '☕ Kısa Mola' : '🛋️ Uzun Mola'
              const time = new Date(s.started_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0"
                >
                  <span className="text-xs text-white/60">{label}</span>
                  <div className="flex items-center gap-2.5">
                    {s.xp_earned > 0 && (
                      <span className="text-[10px] text-yellow-400/80 font-semibold flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />+{s.xp_earned}
                      </span>
                    )}
                    <span className="text-[10px] text-white/25">{time}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
