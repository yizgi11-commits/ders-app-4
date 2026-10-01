'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Settings, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import { ACHIEVEMENTS } from '@/lib/gamification/achievements'
import { formatFocus } from '@/lib/journey/types'
import type { ProfileData } from '@/lib/profile/queries'
import { SectionLabel } from '@/components/ui/section-label'
import { initialsOf } from '@/components/dashboard/nav'

export default function ProfileClient({ data }: { data: ProfileData }) {
  const memberSince = new Date(data.memberSince).toLocaleDateString('tr-TR', {
    month: 'long', year: 'numeric',
  })

  const unlockedIds = new Set(data.unlockedAchievementIds)
  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length
  // Achieved first, so the grid reads as "what I've earned, then what's next".
  const achievements = [...ACHIEVEMENTS].sort((a, b) => Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)))

  const stats: { label: string; value: string; mono: boolean }[] = [
    { label: 'Çalışılan konu',   value: String(data.totalTopicsStudied),  mono: true },
    { label: 'Recall kartı',    value: String(data.totalRecallCards),    mono: true },
    { label: 'Tamamlanan görev', value: String(data.totalTasksCompleted), mono: true },
    { label: 'Üyelik tarihi',   value: memberSince,                      mono: false },
  ]

  return (
    <div className="space-y-12">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-12 shrink-0 rounded-full bg-accent-soft text-accent flex items-center justify-center text-base font-semibold">
            {initialsOf(data.displayName) || '?'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-text truncate">{data.displayName}</h1>
            <p className="text-sm text-text-muted truncate">{data.email}</p>
            {(data.gradeLabel || data.goal) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {data.gradeLabel && (
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-text-secondary">
                    {data.gradeLabel}
                  </span>
                )}
                {data.goal && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                    {data.goal.emoji} {data.goal.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
        >
          <Settings className="size-3.5" /> <span className="hidden sm:inline">Ayarlar</span>
        </Link>
      </div>

      {/* ── Momentum — rows, no cards ──────────────────────── */}
      <section>
        <SectionLabel className="pb-2 border-b border-border">MOMENTUM</SectionLabel>
        <div className="py-3.5 border-b border-border">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-base font-medium text-text">
              Seviye <span className="tabular">{data.level}</span>
              <span className="text-text-secondary font-normal"> — {data.levelTitle}</span>
            </p>
            <p className="tabular text-xs text-text-muted">{data.xpCurrent} / {data.xpRequired} XP</p>
          </div>
          <div className="mt-2.5 h-1 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${data.xpPct}%` }}
              transition={{ duration: 0.8, ease: EASE_CURVE }}
            />
          </div>
        </div>
        <div className="h-12 flex items-center justify-between border-b border-border">
          <p className="text-base text-text">🔥 <span className="tabular">{data.currentStreak}</span> günlük seri</p>
          <p className="text-xs text-text-muted">Rekor: <span className="tabular">{data.longestStreak}</span> gün</p>
        </div>
        <div className="h-12 flex items-center justify-between border-b border-border">
          <p className="text-base text-text">Toplam Focus</p>
          <p className="tabular-nums text-base text-text">{formatFocus(data.totalFocusMinutes)}</p>
        </div>
        <div className="h-12 flex items-center justify-between border-b border-border">
          <p className="text-base text-text">Toplam XP</p>
          <p className="tabular text-base text-text">{data.totalXp.toLocaleString('tr-TR')}</p>
        </div>
      </section>

      {/* ── Learning stats — 2-column grid ─────────────────── */}
      <section>
        <SectionLabel className="pb-2 border-b border-border">ÖĞRENME İSTATİSTİKLERİ</SectionLabel>
        <dl className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
          {stats.map(s => (
            <div key={s.label} className="h-12 flex items-center justify-between border-b border-border">
              <dt className="text-base text-text-secondary">{s.label}</dt>
              <dd className={cn('text-base text-text', s.mono && 'tabular')}>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Achievements — compact badge grid ──────────────── */}
      <section>
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <SectionLabel>BAŞARIMLAR</SectionLabel>
          <span className="tabular text-sm text-text-secondary">{unlockedCount} / {ACHIEVEMENTS.length}</span>
        </div>
        <ul className="mt-4 grid grid-cols-7 sm:grid-cols-10 gap-2">
          {achievements.map(a => {
            const on = unlockedIds.has(a.id)
            return (
              <li
                key={a.id}
                title={`${a.title}${on ? '' : ' — kilitli'}`}
                aria-label={`${a.title}${on ? '' : ' (kilitli)'}`}
                className={cn(
                  'aspect-square rounded-md border border-border bg-surface flex items-center justify-center text-lg',
                  !on && 'grayscale opacity-40',
                )}
              >
                {a.icon}
              </li>
            )
          })}
        </ul>
        <Link
          href="/dashboard/journey"
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-accent hover:text-accent-dark transition-colors duration-[160ms]"
        >
          Tümünü Journey’de gör <ArrowRight className="size-3.5" />
        </Link>
      </section>
    </div>
  )
}
