'use client'

import { motion } from 'framer-motion'
import { Zap, CheckCircle2, Flame, BarChart2, Timer } from 'lucide-react'
import { stagger } from '@/lib/motion'

const highlights = [
  { icon: CheckCircle2, label: 'Akıllı Görev Sistemi',  desc: 'Seviyene uygun günlük görevler'    },
  { icon: Timer,        label: 'Pomodoro Zamanlayıcı',  desc: 'Bilimsel odak teknikleri'           },
  { icon: Flame,        label: 'Çalışma Serisi',        desc: 'Her gün çalışarak seri kazan'      },
  { icon: BarChart2,    label: 'Gelişim Analitiği',     desc: 'Detaylı ilerleme grafikleri'       },
]

// Floating stat cards shown on left panel
const floatingCards = [
  { label: 'Günlük Seri',   value: '12 gün 🔥',  color: 'from-orange-500/20 to-red-500/10',    border: 'border-orange-500/20' },
  { label: 'Bugün XP',      value: '+340 XP ⚡',  color: 'from-indigo-500/20 to-violet-500/10', border: 'border-indigo-500/20' },
  { label: 'Odak Süresi',   value: '2.4 saat ⏱', color: 'from-emerald-500/20 to-teal-500/10',  border: 'border-emerald-500/20' },
]

export default function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full px-12 py-12 relative overflow-hidden">

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] animate-orb-drift" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px] animate-orb-drift" style={{ animationDelay: '-10s', animationDuration: '20s' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 relative z-10"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Noetic OS</p>
          <p className="text-white/30 text-[10px] tracking-widest uppercase">Öğrenci Platformu</p>
        </div>
      </motion.div>

      {/* Hero copy */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.08] mb-4">
            Çalışmak bir
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              alışkanlık meselesi.
            </span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm">
            Akıllı görev sistemi, Pomodoro seansları ve XP ile çalışma
            rutinini premium bir deneyime dönüştür.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          variants={stagger(0.08, 0.3)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {highlights.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, x: -14 },
                show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
              }}
              className="flex items-center gap-3 glass-card rounded-xl px-4 py-3"
            >
              <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">{label}</p>
                <p className="text-[11px] text-white/35">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Floating stat cards */}
        <motion.div
          variants={stagger(0.1, 0.6)}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-2"
        >
          {floatingCards.map(({ label, value, color, border }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, scale: 0.85, y: 8 },
                show:   { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 360, damping: 24 } },
              }}
              className={`bg-gradient-to-br ${color} border ${border} rounded-xl px-3.5 py-2.5 animate-float-slow`}
              style={{ animationDelay: `${Math.random() * 2}s` }}
            >
              <p className="text-[10px] text-white/40 font-medium">{label}</p>
              <p className="text-xs font-bold text-white mt-0.5">{value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="text-xs text-white/20 relative z-10 italic"
      >
        "Başarı, her gün küçük adımlar atmaktır."
      </motion.p>
    </div>
  )
}
