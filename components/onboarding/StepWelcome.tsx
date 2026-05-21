'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'

interface Props {
  name: string
  onNext: () => void
}

export default function StepWelcome({ name, onNext }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/60 mb-8"
      >
        <Zap className="w-10 h-10 text-white" />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl sm:text-4xl font-black text-white mb-3"
      >
        Hoş geldin, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{name || 'öğrenci'}</span>! 👋
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-base text-white/40 max-w-md mb-4 leading-relaxed"
      >
        Study OS, çalışma düzenini optimize eden kişisel asistanın.
        Seni tanıyalım ki sana en uygun programı oluşturalım.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-xs text-white/20 mb-10"
      >
        Sadece 1 dakika sürecek — hadi başlayalım!
      </motion.p>

      {/* Features preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4 mb-10 flex-wrap justify-center"
      >
        {[
          { emoji: '📅', text: 'Kişisel Plan' },
          { emoji: '🎯', text: 'Akıllı Hedefler' },
          { emoji: '📊', text: 'İlerleme Takibi' },
          { emoji: '🏆', text: 'Başarımlar' },
        ].map((f, i) => (
          <motion.div
            key={f.text}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 300 }}
            className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2"
          >
            <span className="text-sm">{f.emoji}</span>
            <span className="text-xs text-white/50 font-medium">{f.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={onNext}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm px-10 py-4 rounded-xl flex items-center gap-2 shadow-2xl shadow-indigo-900/50 group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span>Başlayalım</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  )
}
