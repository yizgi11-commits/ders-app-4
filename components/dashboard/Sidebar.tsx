'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, CalendarDays,
  BarChart2, Trophy, Settings, Zap, Timer, LogOut, Sparkles, StickyNote, Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard',            label: 'Genel Bakış',   icon: LayoutDashboard },
  { href: '/dashboard/pomodoro',   label: 'Pomodoro',      icon: Timer },
  { href: '/dashboard/dersler',    label: 'Derslerim',     icon: BookOpen },
  { href: '/dashboard/plan',       label: 'Çalışma Planı', icon: CalendarDays },
  { href: '/dashboard/istatistik', label: 'İstatistikler', icon: BarChart2 },
  { href: '/dashboard/basarimlar', label: 'Başarımlar',    icon: Trophy },
  { href: '/dashboard/ai-coach',   label: 'AI Koç',        icon: Sparkles },
  { href: '/dashboard/notlar',     label: 'Notlar',        icon: StickyNote },
  { href: '/dashboard/flashcards', label: 'Flash Kartlar',  icon: Brain },
]

const bottomItems = [
  { href: '/dashboard/ayarlar', label: 'Ayarlar', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleCikis() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
    router.refresh()
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
          <p className="text-sm font-bold text-white leading-tight tracking-tight">Study OS</p>
          <p className="text-[10px] text-white/25 tracking-widest uppercase">Öğrenci Platformu</p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 mb-1.5">
        <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.12em]">Gezinti</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
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
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 py-4 border-t border-white/[0.06] flex flex-col gap-0.5">
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
