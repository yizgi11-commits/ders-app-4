'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/states'

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <ErrorState onRetry={reset} className="w-full max-w-md" />
    </div>
  )
}
