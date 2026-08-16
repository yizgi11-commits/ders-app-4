'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Settings, Flame, Clock, Map, Brain, CheckCircle2, CalendarDays,
  Trophy, ArrowRight, GraduationCap, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACHIEVEMENTS, RARITY_CONFIG } from '@/lib/gamification/achievements'
import { formatFocus } from '@/lib/journey/types'
import type { ProfileData } from '@/lib/profile/queries'

export default function ProfileClient({ data }: { data: ProfileData }) {
  const memberSince = new Date(data.memberSince).toLocaleDateString('tr-TR', {
    month: 'long', year: 'numeric',
  })

  const unlocked = ACHIEVEMENTS.filter(a => data.unlockedAchievementIds.includes(a.id))

  return (
    <div className="space-y-6">
      {/* ── OVERVIEW ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-border rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200 shrink-0">
              {data.displayName.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{data.displayName}</p>
              <p className="text-xs text-muted-foreground">{data.email}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {data.gradeLabel && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 rounded-full px-2.5 py-1">
                    <GraduationCap className="w-3 h-3" /> {data.gradeLabel}
                  </span>
                )}
                {data.goal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
                    <Target className="w-3 h-3" /> {data.goal.emoji} {data.goal.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-border rounded-xl px-3 py-2 transition-colors shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </motion.div>

      {/* ── MOMENTUM ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">Momentum</p>

        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Level</p>
              <p className="text-2xl font-black leading-tight">
                {data.level} <span className="text-base font-semibold text-indigo-300">— {data.levelTitle}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Total XP</p>
              <p className="text-xl font-black tabular-nums">{data.totalXp.toLocaleString('tr-TR')}</p>
            </div>
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${data.xpPct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-[11px] text-white/40 mt-1.5">
            {data.xpCurrent} / {data.xpRequired} XP — sonraki seviyeye
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums">{data.currentStreak} days</p>
                <p className="text-[10px] text-white/40">Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <p className="text-sm font-bold tabular-nums">{formatFocus(data.totalFocusMinutes)}</p>
                <p className="text-[10px] text-white/40">Total Focus</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── LEARNING STATS ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">Learning Stats</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile icon={Map}          color="violet"  value={String(data.totalTopicsStudied)}  label="Topics Studied" />
          <StatTile icon={Brain}        color="amber"   value={String(data.totalRecallCards)}    label="Recall Cards" />
          <StatTile icon={CheckCircle2} color="emerald" value={String(data.totalTasksCompleted)} label="Tasks Completed" />
          <StatTile icon={CalendarDays} color="indigo"  value={memberSince}                      label="Member Since" />
        </div>
      </motion.div>

      {/* ── ACHIEVEMENTS ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white border border-border rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Achievements
          </p>
          <span className="text-xs font-bold text-gray-500 tabular-nums">
            {unlocked.length}<span className="text-muted-foreground font-normal">/{ACHIEVEMENTS.length}</span>
          </span>
        </div>

        {unlocked.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Henüz bir başarım açmadın — ilk Focus oturumunla başla.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 mb-4">
            {unlocked.slice(0, 12).map(a => {
              const c = RARITY_CONFIG[a.rarity]
              return (
                <div
                  key={a.id}
                  title={a.title}
                  className={cn('aspect-square rounded-xl border flex items-center justify-center text-xl', c.bg, c.border)}
                >
                  {a.icon}
                </div>
              )
            })}
          </div>
        )}

        <Link
          href="/dashboard/journey"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Journey&apos;de tümünü gör <ArrowRight className="w-3 h-3" />
        </Link>
      </motion.div>
    </div>
  )
}

const TILE_COLORS = {
  indigo:  { bg: 'bg-indigo-50/80',  ring: 'ring-indigo-100',  icon: 'text-indigo-600',  border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50/80', ring: 'ring-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-100' },
  violet:  { bg: 'bg-violet-50/80',  ring: 'ring-violet-100',  icon: 'text-violet-600',  border: 'border-violet-100' },
  amber:   { bg: 'bg-amber-50/80',   ring: 'ring-amber-100',   icon: 'text-amber-600',   border: 'border-amber-100' },
} as const

function StatTile({ icon: Icon, color, value, label }: {
  icon: React.ElementType
  color: keyof typeof TILE_COLORS
  value: string
  label: string
}) {
  const c = TILE_COLORS[color]
  return (
    <div className={cn('bg-white rounded-2xl border p-4 shadow-sm', c.border)}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center ring-1 mb-3', c.bg, c.ring)}>
        <Icon className={cn('w-4 h-4', c.icon)} />
      </div>
      <p className="text-lg font-black text-gray-900 tabular-nums truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
