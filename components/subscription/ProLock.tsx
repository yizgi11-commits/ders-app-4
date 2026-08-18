'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'

// Reusable "Pro Preview" overlay — dims + blurs the locked content and
// centers a small "Pro'da açılır" badge that links to /dashboard/upgrade.
// No interstitial/modal: the section stays visible (so Free users see
// what they're missing) but isn't interactive underneath.
export default function ProLock({ label = 'Pro’da açılır', children }: {
  label?:    string
  children:  React.ReactNode
}) {
  return (
    <Link href="/dashboard/upgrade" className="relative block group">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-1.5 bg-gray-900/90 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg group-hover:bg-gray-900 transition-colors">
          <Lock className="w-3.5 h-3.5 text-indigo-300" /> {label}
        </span>
      </div>
    </Link>
  )
}
