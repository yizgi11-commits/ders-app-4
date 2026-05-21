import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Geist, Geist_Mono } from 'next/font/google'
import { cn } from '@/lib/utils'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Study OS — Akıllı Öğrenci Platformu',
    template: '%s — Study OS',
  },
  description: 'Çalışmalarını takip et, XP kazan, hedeflerine ulaş. Öğrenciler için tasarlanmış premium verimlilik platformu.',
  keywords: ['öğrenci', 'ders takip', 'pomodoro', 'çalışma planı', 'XP sistemi'],
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={cn(geist.variable, geistMono.variable)} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
