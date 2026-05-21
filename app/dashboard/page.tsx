import { Suspense } from 'react'
import DailyTasks      from '@/components/dashboard/DailyTasks'
import XPCard          from '@/components/dashboard/XPCard'
import StudyStreak     from '@/components/dashboard/StudyStreak'
import WeeklyProgress  from '@/components/dashboard/WeeklyProgress'
import StatsGrid       from '@/components/dashboard/StatsGrid'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import DailyGoalsWidget from '@/components/gamification/DailyGoalsWidget'
import AICoachWidget from '@/components/ai/AICoachWidget'

// ── Inline skeletons (no extra file needed) ─────────────────────
function XPCardSkeleton() {
  return (
    <div className="rounded-2xl bg-indigo-600/20 p-5 h-56 animate-pulse" />
  )
}
function StreakSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 h-64 animate-pulse">
      <div className="h-4 w-36 rounded-lg bg-gray-100 mb-3" />
      <div className="h-24 rounded-xl bg-gray-100 mb-3" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array(14).fill(0).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const tarih = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <DashboardHeader tarih={tarih} />

      {/* Stats — client component, loads instantly */}
      <StatsGrid />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <DailyTasks />
          <WeeklyProgress />
        </div>

        {/* Right col — Suspense so heavy DB calls don't block page */}
        <div className="flex flex-col gap-5">
          <Suspense fallback={<XPCardSkeleton />}>
            <XPCard />
          </Suspense>
          <Suspense fallback={<StreakSkeleton />}>
            <StudyStreak />
          </Suspense>
          <DailyGoalsWidget />
        </div>
      </div>

      {/* AI Coach — full width below grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-3">
          <AICoachWidget />
        </div>
      </div>
    </div>
  )
}
