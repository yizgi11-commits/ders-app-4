'use client'

import { useState, useEffect } from 'react'
import DailyGoals from './DailyGoals'

interface GoalData {
  focus_minutes_goal: number
  pomodoro_goal:      number
  tasks_goal:         number
}
interface ProgressData {
  focusMinutes:  number
  pomodorosDone: number
  tasksDone:     number
}

// Skeleton
function GoalsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="h-4 w-32 rounded-lg bg-white/10" />
      {[1,2,3].map(i => <div key={i} className="h-8 rounded-xl bg-white/[0.05]" />)}
    </div>
  )
}

export default function DailyGoalsWidget() {
  const [data, setData] = useState<{ goals: GoalData; progress: ProgressData } | null>(null)

  useEffect(() => {
    fetch('/api/daily-goals')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return <GoalsSkeleton />

  return (
    <DailyGoals
      initialGoals={data.goals}
      progress={data.progress}
    />
  )
}
