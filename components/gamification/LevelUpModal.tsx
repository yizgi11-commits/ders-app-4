'use client'

import { motion } from 'framer-motion'
import { Star, Zap, ArrowRight } from 'lucide-react'
import ConfettiEffect from './ConfettiEffect'

const LEVEL_TITLES: Record<number, string> = {
  1:  'Yeni Başlayan',
  2:  'Yeni Başlayan',
  3:  'Çalışkan Öğrenci',
  4:  'Çalışkan Öğrenci',
  5:  'Azimli Öğrenci',
  6:  'Azimli Öğrenci',
  7:  'Ders Aşığı',
  8:  'Ders Aşığı',
  9:  'Ders Aşığı',
  10: 'Ders Ustası',
  15: 'Üst Düzey Öğrenci',
  20: 'Bilgi Savaşçısı',
  30: 'Efsane Öğrenci',
}

function getTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a)
  for (const k of keys) {
    if (level >= k) return LEVEL_TITLES[k]
  }
  return 'Efsane Öğrenci'
}

const starVariants = {
  hidden: { scale: 0, rotate: -30, opacity: 0 },
  show:   (i: number) => ({
    scale: 1, rotate: 0, opacity: 1,
    transition: { type: 'spring' as const, stiffness: 350, damping: 18, delay: 0.3 + i * 0.08 },
  }),
}

export default function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const title = getTitle(level)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Confetti */}
      <ConfettiEffect count={80} />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1,   y: 0,  opacity: 1 }}
        exit={{    scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.1] rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-yellow-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-[50px] pointer-events-none" />

        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i} custom={i} variants={starVariants} initial="hidden" animate="show">
              <Star
                className={i === 2 ? 'w-7 h-7 text-yellow-400 fill-yellow-400' : 'w-4 h-4 text-yellow-500/60 fill-yellow-500/40'}
              />
            </motion.div>
          ))}
        </div>

        {/* Level badge */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.2 }}
          className="relative mx-auto w-24 h-24 mb-6"
        >
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-yellow-400/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-900/50 flex items-center justify-center">
            <span className="text-3xl font-black text-yellow-900">{level}</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1.5">
            Seviye Atladın! 🎉
          </p>
          <h2 className="text-3xl font-black text-white mb-1">Seviye {level}</h2>
          <p className="text-sm text-white/50 mb-2">{title}</p>
        </motion.div>

        {/* XP indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 350 }}
          className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-sm font-bold px-4 py-2 rounded-full mb-8"
        >
          <Zap className="w-4 h-4" />
          Tebrikler! Güçleniyorsun
        </motion.div>

        {/* CTA */}
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
        >
          Devam Et
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
