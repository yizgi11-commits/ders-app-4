'use client'

import { motion } from 'framer-motion'
import { LucideIcon, Rocket, Sparkles } from 'lucide-react'
import { stagger } from '@/lib/motion'

interface Props {
  icon: LucideIcon
  baslik: string
  aciklama: string
  renk?: string
}

const particles = [
  { x: '15%', y: '20%', size: 3, delay: 0 },
  { x: '80%', y: '15%', size: 2, delay: 0.4 },
  { x: '70%', y: '75%', size: 4, delay: 0.8 },
  { x: '25%', y: '70%', size: 2, delay: 1.2 },
  { x: '55%', y: '12%', size: 3, delay: 0.2 },
  { x: '90%', y: '50%', size: 2, delay: 0.6 },
]

export default function PlaceholderPage({ icon: Icon, baslik, aciklama }: Props) {
  return (
    <div className="max-w-7xl mx-auto">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <h1 className="text-xl font-bold text-gray-900">{baslik}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{aciklama}</p>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.08] rounded-3xl p-16 flex flex-col items-center justify-center text-center gap-6 overflow-hidden min-h-[420px]"
      >

        {/* Background ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[10%] w-72 h-72 bg-indigo-600/15 rounded-full blur-[80px] animate-orb-drift" />
          <div className="absolute bottom-[-10%] right-[10%] w-56 h-56 bg-violet-600/12 rounded-full blur-[60px] animate-orb-drift" style={{ animationDelay: '-8s', animationDuration: '22s' }} />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        {/* Floating particles */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-400/40"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
            animate={{ y: [0, -12, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3 + i * 0.5, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.25 }}
          className="relative"
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Icon className="w-9 h-9 text-indigo-400" />
          </div>
        </motion.div>

        {/* Text content */}
        <motion.div
          variants={stagger(0.08, 0.4)}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-2 relative z-10"
        >
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="text-2xl font-black text-white"
          >
            {baslik}
          </motion.h2>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            className="text-sm text-white/40 max-w-sm leading-relaxed"
          >
            {aciklama}
          </motion.p>
        </motion.div>

        {/* Coming soon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24, delay: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 bg-white/[0.07] border border-white/[0.12] text-white/70 text-xs font-semibold px-5 py-2.5 rounded-full backdrop-blur-sm">
            <Rocket className="w-3.5 h-3.5 text-indigo-400" />
            Yakında Geliyor
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
        </motion.div>

        {/* Feature hint dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-1.5 relative z-10"
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[11px] text-white/20 max-w-xs relative z-10"
        >
          Bu bölüm şu an geliştirme aşamasındadır. Çok yakında burada harika özellikler seni bekliyor!
        </motion.p>
      </motion.div>
    </div>
  )
}
