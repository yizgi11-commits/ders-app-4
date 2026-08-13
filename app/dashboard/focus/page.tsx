import { Suspense } from 'react'
import { Timer } from 'lucide-react'
import FocusTimer from '@/components/focus/FocusTimer'
import FocusHistory from '@/components/focus/FocusHistory'

function TimerSkeleton() {
  return <div className="max-w-xl mx-auto rounded-2xl bg-gray-900 h-[520px] animate-pulse" />
}

function HistorySkeleton() {
  return <div className="rounded-2xl bg-white border border-border h-40 animate-pulse" />
}

export default function FocusPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Timer className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Focus</h1>
          <p className="text-sm text-muted-foreground">Deep, distraction-free study sessions.</p>
        </div>
      </div>

      <Suspense fallback={<TimerSkeleton />}>
        <FocusTimer />
      </Suspense>

      <Suspense fallback={<HistorySkeleton />}>
        <FocusHistory />
      </Suspense>
    </div>
  )
}
