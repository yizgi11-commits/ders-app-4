'use client'

import { motion } from 'framer-motion'
import { Timer, CheckCircle2, XCircle, Flame } from 'lucide-react'
import { stagger, fadeUp } from '@/lib/motion'
import type { PomodoroStat } from '@/lib/analytics/types'

interface Props { stats: PomodoroStat }

export default function PomodoroStats({ stats }: Props) {
  const hours = Math.floor(stats.total_focus_minutes / 60)
  const mins  = stats.total_focus_minutes % 60

  const cards = [
    {
      icon: CheckCircle2,
      label: 'Tamamlanan Seans',
      value: stats.total_completed.toString(),
      color: 'text-emerald-600',
      bg:    'bg-emerald-50',
    },
    {
      icon: XCircle,
      label: 'Yarıda Bırakılan',
      value: stats.total_interrupted.toString(),
      color: 'text-red-500',
      bg:    'bg-red-50',
    },
    {
      icon: Timer,
      label: 'Toplam Odak',
      value: hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`,
      color: 'text-indigo-600',
      bg:    'bg-indigo-50',
    },
    {
      icon: Flame,
      label: 'Seans Rekoru',
      value: `${stats.longest_streak} ardışık`,
      color: 'text-orange-500',
      bg:    'bg-orange-50',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.2 }}
      className="bg-white rounded-2xl border border-border p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Pomodoro İstatistikleri</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Tüm zamanların odak verileri</p>
        </div>
        {/* Completion ring */}
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <motion.circle
              cx="20" cy="20" r="16"
              fill="none" stroke="#6366f1" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - stats.completion_rate / 100)}`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 16}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 16 * (1 - stats.completion_rate / 100)}` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-gray-700">{stats.completion_rate}%</span>
          </div>
        </div>
      </div>

      <motion.div
        variants={stagger(0.07)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {cards.map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            className="bg-gray-50/70 rounded-xl p-3 border border-border/60"
          >
            <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-base font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
