import { Suspense } from 'react'
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer'
import StudyStats from '@/components/pomodoro/StudyStats'
import { Timer } from 'lucide-react'

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4 h-24 animate-pulse bg-gray-50" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-border p-5 h-44 animate-pulse" />
    </div>
  )
}

export default function PomodoroPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Timer className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pomodoro Zamanlayıcı</h1>
          <p className="text-sm text-muted-foreground">Odaklan, mola ver, tekrarla.</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left — Timer */}
        <PomodoroTimer />

        {/* Right — Stats (server rendered, with Suspense) */}
        <Suspense fallback={<StatsSkeleton />}>
          <StudyStats />
        </Suspense>
      </div>
    </div>
  )
}
