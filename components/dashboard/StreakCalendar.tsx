'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayData {
  dateStr: string
  active:  boolean
}

const GUN_ISIM = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function StreakCalendar({ days }: { days: DayData[] }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {GUN_ISIM.map((g) => (
          <p key={g} className="text-center text-[9px] text-muted-foreground/60 font-medium">{g}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ dateStr, active }, i) => (
          <motion.div
            key={dateStr}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.025,
              type: 'spring',
              stiffness: 420,
              damping: 22,
            }}
            title={dateStr}
            className={cn(
              'aspect-square rounded-lg flex items-center justify-center',
              active
                ? 'bg-orange-400 shadow-sm shadow-orange-200'
                : 'bg-gray-100 hover:bg-gray-150 transition-colors'
            )}
          >
            {active && <Flame className="w-3 h-3 text-white" />}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
