'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const columns = [
  {
    title: 'Ürün',
    links: [
      { label: 'Özellikler', href: '#features' },
      { label: 'Nasıl Çalışır?', href: '#how' },
      { label: 'Fiyatlandırma', href: '#pricing' },
      { label: 'Güncellemeler', href: '#' },
    ],
  },
  {
    title: 'Şirket',
    links: [
      { label: 'Hakkımızda', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Kariyer', href: '#' },
      { label: 'Basın', href: '#' },
    ],
  },
  {
    title: 'Destek',
    links: [
      { label: 'Yardım Merkezi', href: '#' },
      { label: 'İletişim', href: '#' },
      { label: 'Gizlilik Politikası', href: '#' },
      { label: 'Kullanım Şartları', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Study OS</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Türkiye'nin en akıllı çalışma planlama platformu. Hedeflerine odaklan, gerisini bize bırak.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-white/80 font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/40 text-sm hover:text-white/70 transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-white/30 text-sm">© 2025 Study OS. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Gizlilik
            </Link>
            <Link href="#" className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Koşullar
            </Link>
            <Link href="#" className="text-white/30 text-sm hover:text-white/50 transition-colors">
              Çerezler
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
