'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { EASE_CURVE } from '@/lib/motion'

// Enter-only, subtle: opacity + 4px lift over 200ms. The new route mounts
// (and starts fetching) immediately — no exit wait, no full-screen wipe.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: EASE_CURVE }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
