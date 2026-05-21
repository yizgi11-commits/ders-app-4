'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

const COLORS = [
  '#818cf8', '#a78bfa', '#f472b6', '#fbbf24',
  '#34d399', '#60a5fa', '#fb923c', '#e879f9',
]

const SHAPES = ['circle', 'rect', 'diamond'] as const

interface Particle {
  id:      number
  x:       number
  color:   string
  shape:   typeof SHAPES[number]
  size:    number
  delay:   number
  rot:     number
  rotEnd:  number
}

export default function ConfettiEffect({ count = 60 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id:     i,
      x:      Math.random() * 100,
      color:  COLORS[Math.floor(Math.random() * COLORS.length)],
      shape:  SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size:   4 + Math.random() * 8,
      delay:  Math.random() * 0.8,
      rot:    Math.random() * 360,
      rotEnd: Math.random() * 720 - 360,
    })),
  [count])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute top-0"
          style={{ left: `${p.x}%` }}
          initial={{ y: -20, opacity: 1, rotate: p.rot, scale: 1 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 1, 0],
            rotate: p.rot + p.rotEnd,
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: p.delay,
            ease: 'easeIn',
          }}
        >
          {p.shape === 'circle' && (
            <div
              style={{ width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color }}
            />
          )}
          {p.shape === 'rect' && (
            <div
              style={{ width: p.size, height: p.size * 0.5, backgroundColor: p.color }}
            />
          )}
          {p.shape === 'diamond' && (
            <div
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                transform: 'rotate(45deg)',
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}
