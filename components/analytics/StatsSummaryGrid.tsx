'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Flame, Timer, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { stagger, fadeUp } from '@/lib/motion'
import type { AnalyticsData } from '@/lib/analytics/types'

function useCounter(target: number, duration = 900, delay = 0) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick  = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(target * e))
        if (p < 1) raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf.current) }
  }, [target, duration, delay])
  return value
}

function Trend({ pct }: { pct: number }) {
  if (pct === 0) return <span className="flex items-center gap-0.5 text-gray-400 text-xs"><Minus className="w-3 h-3" />0%</span>
  if (pct > 0)   return <span className="flex items-center gap-0.5 text-green-500 text-xs font-semibold"><TrendingUp className="w-3 h-3" />+{pct}%</span>
  return               <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold"><TrendingDown className="w-3 h-3" />{pct}%</span>
}

interface Props { data: AnalyticsData }

export default function StatsSummaryGrid({ data }: Props) {
  const totalHours = Math.round(data.pomodoroStats.total_focus_minutes / 60 * 10) / 10
  const weekHours  = Math.round(data.weeklyComparison.this_week_minutes / 60 * 10) / 10

  const xp      = useCounter(data.totalXP,            900,  0)
  const streak  = useCounter(data.currentStreak,       900, 80)
  const minutes = useCounter(data.weeklyComparison.this_week_minutes, 900, 160)
  const tasks   = useCounter(data.weeklyComparison.this_week_tasks,   900, 240)

  const cards = [
    {
      label: 'Toplam XP',
      value: xp.toLocaleString('tr'),
      suffix: ' XP',
      sub: `Seviye ${data.level}`,
      trend: data.weeklyComparison.xp_change_pct,
      icon: Zap,
      gradient: 'from-indigo-500 to-violet-600',
      glow: 'shadow-indigo-200/60',
    },
    {
      label: 'Aktif Seri',
      value: streak.toString(),
      suffix: ' gün',
      sub: `Rekor: ${data.longestStreak} gün`,
      trend: 0,
      icon: Flame,
      gradient: 'from-orange-400 to-red-500',
      glow: 'shadow-orange-200/60',
    },
    {
      label: 'Bu Hafta',
      value: String(minutes),
      suffix: ' dk',
      sub: `${weekHours} saat`,
      trend: data.weeklyComparison.minutes_change_pct,
      icon: Timer,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-200/60',
    },
    {
      label: 'Tamamlanan',
      value: tasks.toString(),
      suffix: ' görev',
      sub: 'Bu hafta',
      trend: data.weeklyComparison.tasks_change_pct,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-500',
      glow: 'shadow-emerald-200/60',
    },
  ]

  return (
    <motion.div
      variants={stagger(0.07)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map(({ label, value, suffix, sub, trend, icon: Icon, gradient, glow }) => (
        <motion.div
          key={label}
          variants={fadeUp}
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`bg-white rounded-2xl border border-border p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg ${glow} transition-shadow cursor-default`}
        >
          <div className="flex items-center justify-between">
            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <Trend pct={trend} />
          </div>
          <div>
            <p className="text-xl font-black text-gray-900 tabular-nums leading-tight">
              {value}<span className="text-sm font-semibold text-muted-foreground">{suffix}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">{sub}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
