'use client'

import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { ScheduleBlock } from '@/lib/planner/types'
import ScheduleBlockCard from './ScheduleBlockCard'
import { stagger } from '@/lib/motion'

interface Props {
  date: string
  blocks: ScheduleBlock[]
  onStatusChange: (id: string, status: 'completed' | 'skipped' | 'pending') => void
}

const DAY_NAMES: Record<number, string> = {
  0: 'Pazar', 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba',
  4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi',
}

export default function DayTimeline({ date, blocks, onStatusChange }: Props) {
  const d = new Date(date + 'T00:00:00')
  const dayName = DAY_NAMES[d.getDay()] ?? ''
  const isToday = date === new Date().toISOString().split('T')[0]
  const studyBlocks = blocks.filter(b => b.block_type !== 'break')
  const completed = studyBlocks.filter(b => b.status === 'completed').length
  const skipped = studyBlocks.filter(b => b.status === 'skipped').length
  const total = studyBlocks.length

  const totalMins = blocks.reduce((sum, b) => {
    if (b.block_type === 'break') return sum
    const [sh, sm] = b.start_time.split(':').map(Number)
    const [eh, em] = b.end_time.split(':').map(Number)
    return sum + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)

  return (
    <div>
      {/* Day header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isToday ? 'bg-indigo-100 border border-indigo-200' : 'bg-gray-100 border border-gray-200'
          }`}>
            <Calendar className={`w-4 h-4 ${isToday ? 'text-indigo-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">{dayName}</h3>
              {isToday && (
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Bugün
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {date} · {total} ders bloku · {totalMins} dk
            </p>
          </div>
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>{completed}/{total}</span>
            </div>
            {skipped > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <XCircle className="w-3 h-3" />
                <span>{skipped}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{totalMins} dk</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Blocks timeline */}
      {blocks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-gray-400 text-sm"
        >
          Bu gün için program oluşturulmamış.
        </motion.div>
      ) : (
        <motion.div
          variants={stagger(0.04)}
          initial="hidden"
          animate="show"
        >
          {blocks.map((block, i) => (
            <ScheduleBlockCard
              key={block.id}
              block={block}
              index={i}
              onStatusChange={onStatusChange}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
