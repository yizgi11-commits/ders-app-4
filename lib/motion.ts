import type { MotionProps, Variants, Transition } from 'framer-motion'

/** Design-system ease — same curve as the --ease-out CSS token. */
export const EASE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ── Design-system presets (Phase 1) — spread onto a motion element:
// ── <motion.div {...fadeIn}> ──────────────────────────────────────

export const fadeIn = {
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: EASE_CURVE },
} satisfies MotionProps

export const slideIn = {
  initial:    { opacity: 0, x: 16 },
  animate:    { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: EASE_CURVE },
} satisfies MotionProps

/**
 * Parent variants for staggered children:
 * <motion.ul variants={staggerContainer} initial="initial" animate="animate">
 * (Named staggerContainer because `stagger()` below is already used by
 * existing components.)
 */
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
} satisfies Variants

// ── Existing variants (hidden/show naming) — still used across the app ──

export const SPRING: Transition        = { type: 'spring', stiffness: 380, damping: 28 }
export const SPRING_FAST: Transition   = { type: 'spring', stiffness: 460, damping: 32 }
export const SPRING_SLOW: Transition   = { type: 'spring', stiffness: 220, damping: 28 }
export const EASE_OUT: Transition      = { duration: 0.22, ease: EASE_CURVE }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: SPRING },
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
