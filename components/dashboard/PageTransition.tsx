'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

// Enter-only animation: the new route mounts (and starts fetching)
// immediately instead of waiting for the old page's exit animation.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
