'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Catches render/data-fetch errors from any page under /dashboard that
// doesn't define its own more specific error.tsx.
export default function DashboardError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard]', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto py-20 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-900">Bir şeyler ters gitti</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bu sayfa yüklenirken bir hata oluştu. Tekrar deneyebilir veya Command Center&apos;a dönebilirsin.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reset}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Tekrar dene
        </button>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl border border-border transition-colors"
        >
          Command Center
        </Link>
      </div>
    </div>
  )
}
