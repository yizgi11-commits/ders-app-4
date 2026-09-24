'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import { MOBILE_PRIMARY, MOBILE_MORE, isActive, isDarkRoute } from './nav'

// Bottom tab bar (below lg). Four primary destinations + "More", which
// opens a sheet with the remaining pages.
export default function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the sheet after navigating, and on Escape.
  useEffect(() => { setMoreOpen(false) }, [pathname])
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const moreActive = MOBILE_MORE.some(i => isActive(pathname, i.href))
  const dark = isDarkRoute(pathname)
  const tabClass = (active: boolean) => cn(
    'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-[160ms]',
    dark
      ? (active ? 'text-dark-accent' : 'text-dark-text-muted')
      : (active ? 'text-accent' : 'text-text-muted'),
  )

  return (
    <>
      <nav className={cn(
        'lg:hidden fixed bottom-0 inset-x-0 z-40 border-t pb-[env(safe-area-inset-bottom)]',
        dark ? 'bg-dark-canvas border-dark-border' : 'bg-surface border-border',
      )}>
        <div className="h-14 grid grid-cols-5">
          {MOBILE_PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
                <Icon className="size-5" />
                {label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={tabClass(moreActive || moreOpen)}
          >
            <MoreHorizontal className="size-5" />
            More
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/30"
            />
            <motion.div
              key="more-sheet"
              role="dialog"
              aria-label="Diğer sayfalar"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: EASE_CURVE }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-2xl border-t border-border shadow-lg px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted">MORE</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Kapat"
                  className="p-1.5 rounded-md text-text-secondary hover:bg-surface-subtle"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {MOBILE_MORE.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 h-11 px-3 rounded-md text-base font-medium transition-colors duration-[160ms]',
                        active ? 'bg-accent-soft text-accent' : 'text-text hover:bg-surface-subtle',
                      )}
                    >
                      <Icon className="size-5" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
