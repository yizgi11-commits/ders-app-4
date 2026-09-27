'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/states'

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
    <div className="max-w-md mx-auto py-16">
      <ErrorState onRetry={reset} />
      <p className="mt-4 text-center">
        <Link href="/dashboard" className="text-sm text-text-secondary hover:text-accent transition-colors duration-[120ms]">
          Command Center&apos;a dön
        </Link>
      </p>
    </div>
  )
}
