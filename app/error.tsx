'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Root error boundary — catches errors on the landing page, auth pages,
// and onboarding (anything outside /dashboard, which has its own
// error.tsx).
export default function RootError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Root]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Bir şeyler ters gitti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sayfa yüklenirken bir hata oluştu. Tekrar deneyebilirsin.
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Tekrar dene
        </button>
      </div>
    </div>
  )
}
