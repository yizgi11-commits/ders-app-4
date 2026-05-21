'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, Zap } from 'lucide-react'
import { stagger } from '@/lib/motion'

const LEVEL_TITLES: [number, string][] = [
  [30, 'Efsane Öğrenci'],
  [20, 'Bilgi Savaşçısı'],
  [15, 'Üst Düzey Öğrenci'],
  [10, 'Ders Ustası'],
  [7,  'Ders Aşığı'],
  [5,  'Azimli Öğrenci'],
  [3,  'Çalışkan Öğrenci'],
  [1,  'Yeni Başlayan'],
]

function getTitle(level: number): string {
  for (const [threshold, title] of LEVEL_TITLES) {
    if (level >= threshold) return title
  }
  return 'Yeni Başlayan'
}

interface Props {
  level:         number
  totalXp:       number
  current:       number
  required:      number
  pct:           number
  unlockedCount: number
}

export default function BasarimlarHeader({ level, totalXp, current, required, pct, unlockedCount }: Props) {
  const title = getTitle(level)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-2xl p-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/8 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">

        {/* Level orb */}
        <motion.div
          initial={{ scale: 0.7, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="relative shrink-0"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400/15"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-900/40">
            <span className="text-2xl font-black text-yellow-900">{level}</span>
          </div>
        </motion.div>

        {/* Info */}
        <div className="flex-1">
          <motion.div
            variants={stagger(0.07, 0.1)}
            initial="hidden"
            animate="show"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
              className="flex items-center gap-2 mb-1"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Başarımlar & Seviye</span>
            </motion.div>
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
              className="text-xl font-black text-white mb-0.5"
            >
              Seviye {level} — {title}
            </motion.h1>
            <motion.p
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className="text-sm text-white/40 mb-3"
            >
              {totalXp.toLocaleString('tr')} toplam XP · {unlockedCount} başarım açıldı
            </motion.p>

            {/* XP progress bar */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            >
              <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" />{current.toLocaleString('tr')} XP</span>
                <span>Sonraki seviye: {required.toLocaleString('tr')} XP</span>
              </div>
              <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ boxShadow: '0 0 8px rgba(251,191,36,0.5)' }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-white/25">{pct}%</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="hidden sm:flex flex-col items-center gap-1"
        >
          {[0, 1, 2].map(i => (
            <Star
              key={i}
              className={`${i === 1 ? 'w-6 h-6 text-yellow-400 fill-yellow-400' : 'w-4 h-4 text-yellow-600/40'}`}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
