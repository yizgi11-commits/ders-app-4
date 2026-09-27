'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Özellikler', href: '#features' },
  { label: 'Nasıl Çalışır', href: '#how' },
  { label: 'Fiyatlar', href: '#pricing' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b border-dark-border bg-transparent"
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 h-16">
        <Link href="/" className="text-md font-semibold tracking-wide text-dark-text">NOETIC</Link>

        <div className="hidden sm:flex items-center gap-7">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} className="text-sm text-dark-text-secondary hover:text-dark-text transition-colors duration-[160ms]">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Link href="/giris" className="text-sm font-medium text-dark-text-secondary hover:text-dark-text px-3 py-2 transition-colors duration-[160ms]">
            Giriş Yap
          </Link>
          <Link href="/kayit" className="text-sm font-medium text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-md transition-colors duration-[160ms]">
            Başla
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(p => !p)}
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={mobileOpen}
          className="sm:hidden p-2 -mr-2 rounded-md text-dark-text-secondary hover:text-dark-text"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="sm:hidden border-t border-dark-border px-5 py-3 flex flex-col">
          {NAV_LINKS.map(link => (
            <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="py-2.5 text-sm text-dark-text-secondary hover:text-dark-text">
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 mt-2 pt-3 border-t border-dark-border">
            <Link href="/giris" className="flex-1 text-center text-sm font-medium text-dark-text border border-dark-border py-2.5 rounded-md">Giriş Yap</Link>
            <Link href="/kayit" className="flex-1 text-center text-sm font-medium text-white bg-accent py-2.5 rounded-md">Başla</Link>
          </div>
        </div>
      )}
    </motion.header>
  )
}
