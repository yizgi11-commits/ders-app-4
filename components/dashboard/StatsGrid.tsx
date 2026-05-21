'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Flame, Trophy } from 'lucide-react'
import { stagger, fadeUp } from '@/lib/motion'

// ── Animated counter hook ───────────────────────────
function useCounter(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start     = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(parseFloat((target * eased).toFixed(target % 1 !== 0 ? 1 : 0)))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, delay])

  return value
}

const cards = [
  {
    label: 'Aktif Ders',      numValue: 6,    suffix: '',       sub: '2 yeni eklendi',
    icon: BookOpen,  color: 'text-indigo-600', bg: 'bg-indigo-50/80',
    border: 'border-indigo-100', glow: 'hover:shadow-indigo-100/60',
    ring: 'ring-indigo-100',
  },
  {
    label: 'Bugün Çalışılan', numValue: 2.4,  suffix: ' saat',  sub: 'Hedef: 4 saat',
    icon: Clock,     color: 'text-violet-600', bg: 'bg-violet-50/80',
    border: 'border-violet-100', glow: 'hover:shadow-violet-100/60',
    ring: 'ring-violet-100',
  },
  {
    label: 'Seri',            numValue: 12,   suffix: ' gün',   sub: 'Rekor: 21 gün',
    icon: Flame,     color: 'text-orange-600', bg: 'bg-orange-50/80',
    border: 'border-orange-100', glow: 'hover:shadow-orange-100/60',
    ring: 'ring-orange-100',
  },
  {
    label: 'Başarımlar',      numValue: 8,    suffix: ' / 24',  sub: '3 yakın',
    icon: Trophy,    color: 'text-amber-600',  bg: 'bg-amber-50/80',
    border: 'border-amber-100',  glow: 'hover:shadow-amber-100/60',
    ring: 'ring-amber-100',
  },
]

function StatCard({
  label, numValue, suffix, sub,
  icon: Icon, color, bg, border, glow, ring,
  delay,
}: (typeof cards)[0] & { delay: number }) {
  const count = useCounter(numValue, 1000, delay + 100)
  const displayValue = numValue % 1 !== 0 ? count.toFixed(1) : Math.round(count).toString()

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`bg-white rounded-2xl border ${border} p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg ${glow} transition-shadow cursor-default`}
    >
      <motion.div
        whileHover={{ scale: 1.12, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center ring-1 ${ring}`}
      >
        <Icon className={`w-4 h-4 ${color}`} />
      </motion.div>

      <div>
        <p className="text-xl font-black text-gray-900 tabular-nums">
          {displayValue}{suffix}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{sub}</p>
      </div>
    </motion.div>
  )
}

export default function StatsGrid() {
  return (
    <motion.div
      variants={stagger(0.07)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} delay={i * 80} />
      ))}
    </motion.div>
  )
}
