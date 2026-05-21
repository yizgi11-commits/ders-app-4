import type { Variants, Transition } from 'framer-motion'

export const SPRING: Transition        = { type: 'spring', stiffness: 380, damping: 28 }
export const SPRING_FAST: Transition   = { type: 'spring', stiffness: 460, damping: 32 }
export const SPRING_SLOW: Transition   = { type: 'spring', stiffness: 220, damping: 28 }
export const EASE_OUT: Transition      = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: SPRING },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: SPRING },
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: SPRING },
}

export function stagger(staggerChildren = 0.07, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  }
}
