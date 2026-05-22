'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, BookOpen, Brain, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stagger, fadeUp } from '@/lib/motion'

interface DayData {
  gun:  string
  saat: number | null  // null = future day
}

interface SubjectData {
  ders:  string
  count: number
  yuzde: number
  renk:  string
}

interface Summary {
  weekHours:    number
  weekTasksDone: number
  focusScore:   number | null
  trend:        number | null
}

interface WeeklyData {
  days:     DayData[]
  summary:  Summary
  subjects: SubjectData[]
  hasData:  boolean
}

const MAX_SAAT = 6

// ── Skeleton ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-36 rounded-lg bg-gray-100" />
          <div className="h-3 w-24 rounded-lg bg-gray-100" />
        </div>
        <div className="h-6 w-16 rounded-lg bg-gray-100" />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {[0,1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100" />)}
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md bg-gray-100" style={{ height: `${30 + i * 8}%` }} />
            <div className="h-2 w-4 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.1 }}
      className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Haftalık İlerleme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Bu haftanın çalışma özeti</p>
        </div>
        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
          Bu Hafta
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <BarChart2 className="w-7 h-7 text-indigo-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">Henüz çalışma yok</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
            İlk pomodoro&apos;nu tamamladığında haftalık istatistiklerin burada görünecek.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function WeeklyProgress() {
  const [data, setData]       = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/weekly')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />
  if (!data || !data.hasData) return <EmptyState />

  const { days, summary, subjects } = data
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  const TrendIcon = summary.trend !== null && summary.trend >= 0 ? TrendingUp : TrendingDown
  const trendColor = summary.trend !== null && summary.trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
  const trendLabel = summary.trend !== null
    ? `${summary.trend >= 0 ? '+' : ''}${summary.trend}%`
    : '—'

  const ozet = [
    { label: 'Toplam Süre',  deger: `${summary.weekHours} saat`,   icon: Clock,      renk: 'text-indigo-600 bg-indigo-50' },
    { label: 'Tamamlanan',   deger: `${summary.weekTasksDone} görev`, icon: BookOpen, renk: 'text-green-600 bg-green-50'  },
    { label: 'Odak Skoru',   deger: summary.focusScore !== null ? `${summary.focusScore}%` : '—', icon: Brain, renk: 'text-violet-600 bg-violet-50' },
    { label: 'Büyüme',       deger: trendLabel,                     icon: TrendIcon,  renk: trendColor },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.1 }}
      className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Haftalık İlerleme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Bu haftanın çalışma özeti</p>
        </div>
        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
          Bu Hafta
        </span>
      </div>

      {/* Summary cards */}
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
      >
        {ozet.map(({ label, deger, icon: Icon, renk }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            className="bg-gray-50/70 rounded-xl p-3 border border-border/70 hover:border-border transition-colors"
          >
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', renk)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-gray-900 leading-tight">{deger}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Bar chart */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Günlük Çalışma (Saat)
        </p>
        <div className="flex items-end gap-1.5 h-28">
          {days.map(({ gun, saat }, i) => {
            const isFuture   = saat === null
            const hours      = saat ?? 0
            const yukseklik  = Math.round((Math.min(hours, MAX_SAAT) / MAX_SAAT) * 100)
            const bugun      = i === todayIdx

            return (
              <div key={gun} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-gray-500 h-3 flex items-end">
                  {!isFuture && hours > 0 ? hours.toFixed(1) : ''}
                </span>
                <div className="w-full relative flex items-end justify-center h-20">
                  <motion.div
                    className={cn(
                      'w-full rounded-t-md',
                      isFuture
                        ? 'bg-gray-50 border border-dashed border-gray-200'
                        : hours === 0
                        ? 'bg-gray-100'
                        : bugun
                        ? 'bg-amber-400'
                        : 'bg-indigo-500'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: isFuture ? '8%' : `${hours === 0 ? 6 : yukseklik}%` }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.06 }}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  bugun ? 'text-indigo-600 font-bold' : 'text-muted-foreground'
                )}>
                  {gun}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject distribution — only when data exists */}
      {subjects.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Ders Dağılımı
          </p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
            {subjects.map(({ ders, renk, yuzde }, i) => (
              <motion.div
                key={ders}
                className={cn('h-full', renk)}
                initial={{ width: 0 }}
                animate={{ width: `${yuzde}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.05 }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {subjects.map(({ ders, count, renk, yuzde }) => (
              <div key={ders} className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full shrink-0', renk)} />
                <span className="text-xs text-gray-700 flex-1">{ders}</span>
                <span className="text-xs text-muted-foreground">{count} görev</span>
                <span className="text-xs font-semibold text-gray-900 w-8 text-right">{yuzde}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
