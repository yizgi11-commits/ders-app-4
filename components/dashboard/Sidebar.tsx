'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, BarChart2, Settings, Zap, Timer,
  LogOut, Brain, Map, Archive, Milestone, User, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@/lib/subscription'

const commandItem = { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard }

const navItems = [
  { href: '/dashboard/focus',    label: 'Focus',    icon: Timer },
  { href: '/dashboard/atlas',    label: 'Atlas',    icon: Map },
  { href: '/dashboard/planner',  label: 'Planner',  icon: CalendarDays },
  { href: '/dashboard/vault',    label: 'Vault',    icon: Archive },
  { href: '/dashboard/recall',   label: 'Recall',   icon: Brain },
  { href: '/dashboard/journey',  label: 'Journey',  icon: Milestone },
  { href: '/dashboard/insights', label: 'Insights', icon: BarChart2 },
]

const bottomItems = [
  { href: '/dashboard/profile',  label: 'Profile',  icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ tier }: { tier: SubscriptionTier }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleCikis() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
  }

  function renderItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) {
    const active = pathname === href
    return (
      <Link key={href} href={href}>
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className={cn(
            'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
            active ? 'text-white' : 'text-white/35 hover:text-white/65 hover:bg-white/[0.04]'
          )}
        >
          {active && (
            <motion.div
              layoutId="sidebar-pill"
              className="absolute inset-0 bg-white/[0.09] rounded-lg border border-white/[0.07]"
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            />
          )}
          <Icon className={cn(
            'w-4 h-4 shrink-0 relative z-10 transition-colors',
            active ? 'text-indigo-400' : ''
          )} />
          <span className="relative z-10 text-[13px]">{label}</span>
          {active && (
            <motion.div
              layoutId="sidebar-dot"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 relative z-10"
            />
          )}
        </motion.div>
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-gray-950 border-r border-white/[0.06] shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <motion.div
          whileHover={{ rotate: [0, -12, 12, 0], scale: 1.08 }}
          transition={{ duration: 0.45 }}
          className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-950/60 shrink-0"
        >
          <Zap className="w-4 h-4 text-white" />
        </motion.div>
        <div>
          <p className="text-sm font-bold text-white leading-tight tracking-tight">Noetic OS</p>
          <p className="text-[10px] text-white/25 tracking-widest uppercase">Öğrenme İşletim Sistemi</p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 mb-1.5">
        <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.12em]">Command Center</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {renderItem(commandItem)}

        <div className="my-2 mx-3 border-t border-white/[0.06]" />

        {navItems.map(renderItem)}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-4 border-t border-white/[0.06] flex flex-col gap-0.5">
        {tier === 'free' && (
          <Link href="/dashboard/upgrade">
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-3 py-2 mb-1.5 rounded-lg text-[13px] font-semibold text-indigo-300 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 hover:from-indigo-500/25 hover:to-violet-500/25 transition-colors"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-indigo-300" />
              Upgrade
            </motion.div>
          </Link>
        )}

        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-white/35 hover:text-white/65 hover:bg-white/[0.04] transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </motion.div>
          </Link>
        ))}

        <motion.button
          onClick={handleCikis}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400/50 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Çıkış Yap
        </motion.button>
      </div>
    </aside>
  )
}
