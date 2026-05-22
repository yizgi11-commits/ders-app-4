'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Flame, Trophy } from 'lucide-react'
import { stagger, fadeUp } from '@/lib/motion'

interface StatsData {
  subjectCount:      number
  todayHours:        number
  currentStreak:     number
  longestStreak:     number
  achievementCount:  number
  totalAchievements: number
}

function useCounter(target: number, duration = 1100, delay = 0, enabled = true) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return
    setValue(0)
    const timeout = setTimeout(() => {
      const start  = performance.now()
      const tick = (now: number) => {
        const elapsed  = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased    = 1 - Math.pow(1 - progress, 3)
        setValue(parseFloat((target * eased).toFixed(target % 1 !== 0 ? 1 : 0)))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(rafRef.current) }
  }, [target, duration, delay, enabled])

  return value
}

// ── Skeleton ──────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
      <div className="flex flex-col gap-1.5">
        <div className="h-6 w-16 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-3 w-24 rounded-lg bg-gray-100 animate-pulse" />
        <div className="h-3 w-20 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────
interface CardDef {
  label:   string
  value:   number
  suffix:  string
  sub:     string | null
  icon:    React.ElementType
  color:   string
  bg:      string
  border:  string
  glow:    string
  ring:    string
  isEmpty: boolean
  emptyLabel: string
}

function StatCard({ label, value, suffix, sub, icon: Icon, color, bg, border, glow, ring, isEmpty, emptyLabel, delay }: CardDef & { delay: number }) {
  const count        = useCounter(value, 1000, delay + 100, !isEmpty)
  const displayValue = isEmpty
    ? '—'
    : value % 1 !== 0
    ? count.toFixed(1)
    : Math.round(count).toString()

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`bg-white rounded-2xl border ${border} p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg ${glow} transition-shadow cursor-default`}
    >
      <motion.div
        whileHover={{ scale: 1.12, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center ring-1 ${ring}`}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </motion.div>

      <div>
        {isEmpty ? (
          <>
            <p className="text-xl font-black text-gray-300 tabular-nums">0{suffix}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground/40 mt-0.5 leading-snug">{emptyLabel}</p>
          </>
        ) : (
          <>
            <p className="text-xl font-black text-gray-900 tabular-nums">
              {displayValue}{suffix}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-muted-foreground/50 mt-0.5">{sub}</p>}
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function StatsGrid() {
  const [data, setData]       = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <StatSkeleton key={i} />)}
      </div>
    )
  }

  const d = data ?? { subjectCount: 0, todayHours: 0, currentStreak: 0, longestStreak: 0, achievementCount: 0, totalAchievements: 23 }

  const cards: (CardDef & { delay: number })[] = [
    {
      label:      'Aktif Ders',
      value:      d.subjectCount,
      suffix:     '',
      sub:        d.subjectCount > 0 ? `${d.subjectCount} ders eklendi` : null,
      isEmpty:    d.subjectCount === 0,
      emptyLabel: 'Henüz ders eklenmedi',
      icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50/80',
      border: 'border-indigo-100', glow: 'hover:shadow-indigo-100/60', ring: 'ring-indigo-100',
      delay: 0,
    },
    {
      label:      'Bugün Çalışılan',
      value:      d.todayHours,
      suffix:     ' saat',
      sub:        d.todayHours > 0 ? 'Pomodoro oturumları' : null,
      isEmpty:    d.todayHours === 0,
      emptyLabel: 'İlk pomodoro\'nu başlat!',
      icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50/80',
      border: 'border-violet-100', glow: 'hover:shadow-violet-100/60', ring: 'ring-violet-100',
      delay: 80,
    },
    {
      label:      'Seri',
      value:      d.currentStreak,
      suffix:     ' gün',
      sub:        d.currentStreak > 0 ? `Rekor: ${d.longestStreak} gün` : null,
      isEmpty:    d.currentStreak === 0,
      emptyLabel: 'Bugün çalışarak seriyi başlat',
      icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50/80',
      border: 'border-orange-100', glow: 'hover:shadow-orange-100/60', ring: 'ring-orange-100',
      delay: 160,
    },
    {
      label:      'Başarımlar',
      value:      d.achievementCount,
      suffix:     ` / ${d.totalAchievements}`,
      sub:        d.achievementCount > 0 ? `${d.totalAchievements - d.achievementCount} başarım kaldı` : null,
      isEmpty:    d.achievementCount === 0,
      emptyLabel: 'İlk görevi tamamla',
      icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50/80',
      border: 'border-amber-100', glow: 'hover:shadow-amber-100/60', ring: 'ring-amber-100',
      delay: 240,
    },
  ]

  return (
    <motion.div
      variants={stagger(0.07)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map(card => (
        <StatCard key={card.label} {...card} />
      ))}
    </motion.div>
  )
}
