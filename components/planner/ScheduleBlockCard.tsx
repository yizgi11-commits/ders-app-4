'use client'

import { motion } from 'framer-motion'
import { Check, SkipForward, Clock, RotateCcw } from 'lucide-react'
import type { ScheduleBlock } from '@/lib/planner/types'
import { BLOCK_TYPE_CONFIG } from '@/lib/planner/types'
import { cn } from '@/lib/utils'

// Light-theme color map for block types
const LIGHT_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  study:    { bg: 'bg-indigo-50',  border: 'border-indigo-200', color: 'text-indigo-600' },
  pomodoro: { bg: 'bg-violet-50',  border: 'border-violet-200', color: 'text-violet-600' },
  break:    { bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-600' },
  review:   { bg: 'bg-amber-50',   border: 'border-amber-200',  color: 'text-amber-600' },
}

interface Props {
  block: ScheduleBlock
  index: number
  onStatusChange: (id: string, status: 'completed' | 'skipped' | 'pending') => void
}

export default function ScheduleBlockCard({ block, index, onStatusChange }: Props) {
  const cfg = BLOCK_TYPE_CONFIG[block.block_type]
  const lc = LIGHT_COLORS[block.block_type] ?? LIGHT_COLORS.study
  const isBreak = block.block_type === 'break'
  const isDone = block.status === 'completed'
  const isSkipped = block.status === 'skipped'

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: {
          opacity: 1, x: 0,
          transition: { type: 'spring', stiffness: 340, damping: 28, delay: index * 0.04 },
        },
      }}
      className={cn(
        'group relative flex items-stretch gap-4',
        (isDone || isSkipped) && 'opacity-60',
      )}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center w-5 shrink-0">
        <motion.div
          className={cn(
            'w-3 h-3 rounded-full border-2 mt-4 z-10 shrink-0',
            isDone  ? 'bg-emerald-500 border-emerald-500' :
            isSkipped ? 'bg-gray-300 border-gray-300' :
            `border-current ${lc.color}`
          )}
          whileHover={{ scale: 1.3 }}
        />
        <div className="flex-1 w-px bg-gray-200" />
      </div>

      {/* Card */}
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className={cn(
          'flex-1 rounded-xl border p-4 mb-3 transition-colors',
          isDone ? 'bg-emerald-50 border-emerald-200' :
          isSkipped ? 'bg-gray-50 border-gray-200' :
          `${lc.bg} ${lc.border}`,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: info */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg shrink-0">{cfg.emoji}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-semibold',
                  isDone ? 'line-through text-gray-400' :
                  isSkipped ? 'line-through text-gray-400' :
                  'text-gray-900',
                )}>
                  {block.subject_name ?? cfg.label}
                </span>
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                  lc.bg, lc.color,
                )}>
                  {cfg.label}
                </span>
              </div>
              {block.topic_hint && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {block.topic_hint}
                </p>
              )}
            </div>
          </div>

          {/* Right: time + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{block.start_time} – {block.end_time}</span>
            </div>

            {!isBreak && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {block.status === 'pending' ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onStatusChange(block.id, 'completed')}
                      className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                      title="Tamamlandı"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onStatusChange(block.id, 'skipped')}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      title="Atla"
                    >
                      <SkipForward className="w-3.5 h-3.5 text-gray-400" />
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onStatusChange(block.id, 'pending')}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    title="Geri Al"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
