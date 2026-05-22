import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dashboard/weekly
// Returns real weekly progress data: daily bar chart + subject distribution + summary
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Week boundaries Mon–Sun
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek)
  const mondayStr = monday.toISOString().split('T')[0]

  // Prev week start for trend
  const prevMonday = new Date(monday)
  prevMonday.setDate(monday.getDate() - 7)
  const prevMondayStr = prevMonday.toISOString().split('T')[0]

  const [
    focusRes,
    prevFocusRes,
    weekTasksRes,
    subjectTasksRes,
  ] = await Promise.all([
    // Daily focus for Mon–today
    supabase
      .from('daily_focus_time')
      .select('date, focus_minutes, sessions_completed')
      .eq('user_id', user.id)
      .gte('date', mondayStr)
      .lte('date', todayStr)
      .order('date'),

    // Prev week total for trend
    supabase
      .from('daily_focus_time')
      .select('focus_minutes')
      .eq('user_id', user.id)
      .gte('date', prevMondayStr)
      .lt('date', mondayStr),

    // Week tasks completed count
    supabase
      .from('daily_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', mondayStr)
      .eq('completed', true),

    // Subject distribution: completed tasks this week with subject info
    supabase
      .from('daily_tasks')
      .select('xp_earned, task_templates(subject)')
      .eq('user_id', user.id)
      .gte('date', mondayStr)
      .eq('completed', true),
  ])

  // Build 7-day bar data (Mon=0 … Sun=6)
  const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
  const focusByDate = new Map<string, number>()
  for (const row of focusRes.data ?? []) {
    focusByDate.set(row.date, row.focus_minutes ?? 0)
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const minutes = focusByDate.get(dateStr) ?? 0
    const isFuture = dateStr > todayStr
    return {
      gun:  DAY_NAMES[i],
      saat: isFuture ? null : Math.round((minutes / 60) * 10) / 10,
    }
  })

  // Summary
  const weekMinutes   = (focusRes.data ?? []).reduce((s, r) => s + (r.focus_minutes ?? 0), 0)
  const weekHours     = Math.round((weekMinutes / 60) * 10) / 10
  const weekSessions  = (focusRes.data ?? []).reduce((s, r) => s + (r.sessions_completed ?? 0), 0)
  const weekTasksDone = weekTasksRes.count ?? 0

  const prevWeekMinutes = (prevFocusRes.data ?? []).reduce((s, r) => s + (r.focus_minutes ?? 0), 0)
  const trend = prevWeekMinutes > 0
    ? Math.round(((weekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100)
    : null

  // Pomodoro "focus score" = sessions completed / target (4/day * active days)
  const activeDays   = (focusRes.data ?? []).filter(r => (r.focus_minutes ?? 0) > 0).length
  const focusScore   = activeDays > 0 && weekSessions > 0
    ? Math.min(100, Math.round((weekSessions / (activeDays * 4)) * 100))
    : null

  // Subject distribution
  const subjectMap = new Map<string, number>()
  for (const row of subjectTasksRes.data ?? []) {
    const tmpl = Array.isArray(row.task_templates) ? row.task_templates[0] : row.task_templates
    const sub = (tmpl as { subject?: string } | null)?.subject ?? 'Diğer'
    subjectMap.set(sub, (subjectMap.get(sub) ?? 0) + 1)
  }

  const COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-gray-300']
  const totalTasks = Math.max(1, weekTasksDone)
  const subjects = Array.from(subjectMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      ders:   name,
      count,
      yuzde:  Math.round((count / totalTasks) * 100),
      renk:   COLORS[i] ?? 'bg-gray-300',
    }))

  return NextResponse.json({
    days,
    summary: {
      weekHours,
      weekTasksDone,
      focusScore,
      trend,
    },
    subjects,
    hasData: weekMinutes > 0 || weekTasksDone > 0,
  })
}
