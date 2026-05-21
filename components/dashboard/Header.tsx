'use client'

import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import MobileNav from './MobileNav'

interface HeaderProps {
  userName:  string
  userEmail: string
}

export default function Header({ userName, userEmail }: HeaderProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const saat = new Date().getHours()
  const selamlama = saat < 12 ? 'Günaydın' : saat < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-border/60 flex items-center px-4 lg:px-6 gap-4 shrink-0">
      <MobileNav />

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30, delay: 0.05 }}
        className="hidden sm:block"
      >
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {selamlama}, {userName.split(' ')[0]} 👋
        </p>
        <p className="text-[11px] text-muted-foreground">Bugün harika çalışacaksın!</p>
      </motion.div>

      <div className="flex-1" />

      {/* Search */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-gray-100/80 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors border border-transparent hover:border-border/60"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Ara...</span>
        <kbd className="ml-3 text-[10px] bg-white border border-border rounded px-1.5 py-0.5 font-mono shadow-sm">
          ⌘K
        </kbd>
      </motion.button>

      {/* Notifications */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        whileTap={{ scale: 0.9 }}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-600" />
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.4 }}
          className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"
        />
      </motion.button>

      {/* Avatar + name */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30, delay: 0.08 }}
        className="flex items-center gap-2.5"
      >
        <Avatar className="w-8 h-8 ring-2 ring-indigo-100 ring-offset-1">
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-xs font-semibold text-gray-900 leading-tight">{userName}</p>
          <p className="text-[10px] text-muted-foreground">{userEmail}</p>
        </div>
      </motion.div>
    </header>
  )
}
