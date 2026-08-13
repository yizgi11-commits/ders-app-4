'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, LayoutDashboard, CalendarDays, BarChart2, Settings,
  Zap, Timer, Brain, Map, Archive, Milestone, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',          label: 'Command Center', icon: LayoutDashboard },
  { href: '/dashboard/focus',    label: 'Focus',          icon: Timer },
  { href: '/dashboard/atlas',    label: 'Atlas',          icon: Map },
  { href: '/dashboard/planner',  label: 'Planner',        icon: CalendarDays },
  { href: '/dashboard/vault',    label: 'Vault',          icon: Archive },
  { href: '/dashboard/recall',   label: 'Recall',         icon: Brain },
  { href: '/dashboard/journey',  label: 'Journey',        icon: Milestone },
  { href: '/dashboard/insights', label: 'Insights',       icon: BarChart2 },
  { href: '/dashboard/profile',  label: 'Profile',        icon: User },
  { href: '/dashboard/settings', label: 'Settings',       icon: Settings },
]

export default function MobileNav() {
  const [open, setOpen]  = useState(false)
  const pathname         = usePathname()

  return (
    <div className="lg:hidden">
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="fixed top-0 left-0 h-full w-72 bg-gray-950 z-50 shadow-2xl flex flex-col border-r border-white/[0.06]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-950/60">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-white tracking-tight">Noetic OS</p>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.88 }}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </motion.button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-2.5 py-1 flex flex-col gap-0.5 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }, i) => {
                  const active = pathname === href
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 30 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg text-[13px] font-medium transition-colors min-h-[44px]',
                          active
                            ? 'bg-white/[0.09] text-white border border-white/[0.07]'
                            : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-400' : '')} />
                        {label}
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
