'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ScheduleBlock } from '@/lib/planner/types'

interface DayInfo {
  date: string
  dayLabel: string
  shortLabel: string
  isToday: boolean
  blocks: ScheduleBlock[]
  studyBlocks: number
  completed: number
  totalMins: number
}

interface Props {
  blocks: ScheduleBlock[]
  weekStart: string
  selectedDate: string
  onSelectDate: (date: string) => void
}

const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function WeekOverview({ blocks, weekStart, selectedDate, onSelectDate }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const days: DayInfo[] = []
  const start = new Date(weekStart + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dayBlocks = blocks.filter(b => b.date === dateStr)
    const study = dayBlocks.filter(b => b.block_type !== 'break')
    const totalMins = dayBlocks.reduce((sum, b) => {
      if (b.block_type === 'break') return sum
      const [sh, sm] = b.start_time.split(':').map(Number)
      const [eh, em] = b.end_time.split(':').map(Number)
      return sum + (eh * 60 + em) - (sh * 60 + sm)
    }, 0)
    days.push({
      date: dateStr,
      dayLabel: DAY_SHORT[i] ?? '',
      shortLabel: String(d.getDate()),
      isToday: dateStr === today,
      blocks: dayBlocks,
      studyBlocks: study.length,
      completed: study.filter(b => b.status === 'completed').length,
      totalMins,
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Haftalık Özet
      </h3>

      <div className="overflow-x-auto -mx-2 px-2">
      <div className="grid grid-cols-7 gap-2 min-w-[280px]">
        {days.map((day, i) => {
          const isSelected = day.date === selectedDate
          const pct = day.studyBlocks > 0 ? (day.completed / day.studyBlocks) * 100 : 0

          return (
            <motion.button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'flex flex-col items-center gap-2 py-3 px-1 rounded-xl border transition-all',
                isSelected
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm shadow-indigo-100'
                  : 'bg-gray-50/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50',
              )}
            >
              {/* Day label */}
              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-wider',
                day.isToday ? 'text-indigo-600' : 'text-gray-400',
              )}>
                {day.dayLabel}
              </span>

              {/* Date number */}
              <span className={cn(
                'text-sm font-bold',
                day.isToday ? 'text-indigo-600' :
                isSelected ? 'text-gray-900' : 'text-gray-500',
              )}>
                {day.shortLabel}
              </span>

              {/* Mini bar */}
              <div className="w-full px-2">
                <div className="relative w-full bg-gray-200 rounded-full overflow-hidden" style={{ height: 4 }}>
                  {day.studyBlocks > 0 && (
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                    />
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                {day.studyBlocks > 0 ? (
                  <>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {day.completed}/{day.studyBlocks}
                    </p>
                    <p className="text-[9px] text-gray-400">{day.totalMins}dk</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-300">—</p>
                )}
              </div>

              {/* Today dot */}
              {day.isToday && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </motion.button>
          )
        })}
      </div>
      </div>
    </div>
  )
}
