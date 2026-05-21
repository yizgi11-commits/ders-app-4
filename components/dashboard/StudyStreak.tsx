import { Flame, CalendarCheck, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { UserStreak } from '@/lib/tasks/types'
import { StreakCalendar } from './StreakCalendar'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export default async function StudyStreak() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let streak: UserStreak = {
    user_id: '',
    current_streak: 0,
    longest_streak: 0,
    last_streak_date: null,
    updated_at: new Date().toISOString(),
  }
  let activeDates   = new Set<string>()
  let thisWeekCount = 0

  if (user) {
    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<UserStreak>()

    if (data) streak = data

    const { data: taskDates } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', daysAgo(14))

    activeDates = new Set((taskDates ?? []).map((t: { date: string }) => t.date))

    const today  = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    const mondayStr = monday.toISOString().split('T')[0]

    const { data: weekTasks } = await supabase
      .from('daily_tasks')
      .select('date')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', mondayStr)

    thisWeekCount = new Set((weekTasks ?? []).map((t: { date: string }) => t.date)).size
  }

  const last14 = Array.from({ length: 14 }, (_, i) => ({
    dateStr: daysAgo(13 - i),
    active:  activeDates.has(daysAgo(13 - i)),
  }))

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">Çalışma Serisi</h2>
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-sm font-bold text-orange-600">{streak.current_streak} gün</span>
        </div>
      </div>

      {/* Main streak display */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/60 shrink-0">
          <Flame className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 tabular-nums">{streak.current_streak}</p>
          <p className="text-xs text-muted-foreground">günlük seri 🔥</p>
          <p className="text-xs text-orange-600 font-medium mt-0.5">
            En uzun: {streak.longest_streak} gün
          </p>
        </div>
      </div>

      {/* Animated 14-day calendar */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-2.5 font-medium uppercase tracking-wide">
          Son 14 Gün
        </p>
        <StreakCalendar days={last14} />
      </div>

      {/* Summary */}
      <div className="flex gap-2">
        {[
          { icon: CalendarCheck, color: 'text-indigo-500', value: `${thisWeekCount}/7`,            label: 'Bu hafta' },
          { icon: Target,        color: 'text-green-500',  value: '30',                            label: 'Hedef gün' },
          { icon: Flame,         color: 'text-orange-500', value: `${streak.longest_streak}`,      label: 'Rekor' },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="flex-1 bg-gray-50/80 rounded-xl p-3 text-center border border-border/70">
            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
            <p className="text-base font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
