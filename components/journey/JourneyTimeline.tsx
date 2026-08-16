'use client'

import { motion } from 'framer-motion'
import { Clock, Map, Brain, CheckCircle2, History } from 'lucide-react'
import {
  formatFocus, formatDayHeading, hasActivity, type JourneyDay,
} from '@/lib/journey/types'

interface Props {
  days:  JourneyDay[]
  limit?: number
}

export default function JourneyTimeline({ days, limit = 30 }: Props) {
  const active = days.filter(hasActivity).slice(0, limit)

  if (active.length === 0) {
    return (
      <div className="bg-white border border-dashed border-border rounded-2xl py-14 text-center">
        <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Henüz kayıtlı aktivite yok.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Bir Focus oturumu tamamla — geçmişin burada birikmeye başlasın.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Spine */}
      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />

      <div className="space-y-5">
        {active.map((day, i) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className="relative pl-8"
          >
            {/* Node */}
            <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-white" />

            <p className="text-xs font-black text-gray-900 tracking-[0.12em] mb-2.5">
              {formatDayHeading(day.date)}
            </p>

            <div className="flex flex-wrap gap-2">
              {day.focusMinutes > 0 && (
                <Stat icon={Clock} color="indigo" value={formatFocus(day.focusMinutes)} label="Focus" />
              )}
              {day.topicsStudied > 0 && (
                <Stat icon={Map} color="violet" value={String(day.topicsStudied)} label={day.topicsStudied === 1 ? 'Topic Studied' : 'Topics Studied'} />
              )}
              {day.recallCards > 0 && (
                <Stat icon={Brain} color="amber" value={String(day.recallCards)} label={day.recallCards === 1 ? 'Recall Card' : 'Recall Cards'} />
              )}
              {day.tasksCompleted > 0 && (
                <Stat icon={CheckCircle2} color="emerald" value={String(day.tasksCompleted)} label={day.tasksCompleted === 1 ? 'Task Completed' : 'Tasks Completed'} />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const STAT_COLORS = {
  indigo:  'bg-indigo-50 border-indigo-100 text-indigo-700',
  violet:  'bg-violet-50 border-violet-100 text-violet-700',
  amber:   'bg-amber-50 border-amber-100 text-amber-700',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
} as const

function Stat({ icon: Icon, color, value, label }: {
  icon: React.ElementType
  color: keyof typeof STAT_COLORS
  value: string
  label: string
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-xl px-2.5 py-1.5 ${STAT_COLORS[color]}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="font-black tabular-nums">{value}</span>
      <span className="font-medium opacity-75">{label}</span>
    </span>
  )
}
