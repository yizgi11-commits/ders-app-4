'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Zap, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Özellikler', href: '#features' },
  { label: 'Nasıl Çalışır', href: '#how' },
  { label: 'Fiyatlar', href: '#pricing' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.07] backdrop-blur-2xl bg-[#080810]/85'
          : 'bg-transparent',
      )}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: [0, -12, 12, 0], scale: 1.08 }}
            transition={{ duration: 0.4 }}
            className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50"
          >
            <Zap className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-sm font-bold text-white tracking-tight">Noetic OS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/45 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.06] transition-all font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/giris"
            className="text-sm text-white/50 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.06] transition-all font-medium"
          >
            Giriş Yap
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/kayit"
              className="text-sm bg-white text-gray-900 font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-all shadow-lg"
            >
              Ücretsiz Başla
            </Link>
          </motion.div>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(p => !p)}
          className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:hidden border-t border-white/[0.07] bg-[#080810]/95 backdrop-blur-2xl px-5 py-4 flex flex-col gap-1"
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-white/60 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/[0.06] transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.07]">
            <Link href="/giris" className="flex-1 text-center text-sm text-white/50 bg-white/[0.05] border border-white/[0.08] py-2.5 rounded-xl">
              Giriş Yap
            </Link>
            <Link href="/kayit" className="flex-1 text-center text-sm font-semibold text-gray-900 bg-white py-2.5 rounded-xl">
              Başla — Ücretsiz
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
