import { Suspense } from 'react'
import FocusTimer from '@/components/focus/FocusTimer'
import FocusHistory from '@/components/focus/FocusHistory'

function TimerSkeleton() {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-10 pt-2">
      <div className="size-[260px] rounded-full skeleton-shimmer-dark" />
      <div className="h-10 w-32 rounded-md skeleton-shimmer-dark" />
    </div>
  )
}

function HistorySkeleton() {
  return <div className="max-w-2xl mx-auto h-40 rounded-lg skeleton-shimmer-dark" />
}

// Focus Lab — the whole page is dark. The wrapper cancels the dashboard
// <main> padding (negative margins) so the dark canvas runs edge to edge
// under the header, then re-applies the same padding inside.
export default function FocusPage() {
  return (
    <div className="-m-4 -mb-24 lg:-m-6 lg:-mb-20 min-h-[calc(100dvh-3.5rem)] bg-dark-canvas px-4 pt-8 pb-28 lg:px-6 lg:pt-10 lg:pb-24">
      <Suspense fallback={<TimerSkeleton />}>
        <FocusTimer />
      </Suspense>

      <div className="mt-16">
        <Suspense fallback={<HistorySkeleton />}>
          <FocusHistory />
        </Suspense>
      </div>
    </div>
  )
}
