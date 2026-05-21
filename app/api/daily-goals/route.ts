import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/daily-goals — fetch today's goals + progress
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const [goalsRes, focusRes, sessionsRes, tasksRes] = await Promise.all([
    supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('daily_focus_time')
      .select('focus_minutes, sessions_completed')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('pomodoro_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'focus')
      .eq('status', 'completed'),
    supabase
      .from('daily_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('completed', true),
  ])

  const goals = goalsRes.data ?? {
    focus_minutes_goal: 60,
    pomodoro_goal:       4,
    tasks_goal:          3,
  }

  return NextResponse.json({
    goals: {
      focus_minutes_goal: goals.focus_minutes_goal,
      pomodoro_goal:       goals.pomodoro_goal,
      tasks_goal:          goals.tasks_goal,
    },
    progress: {
      focusMinutes:  focusRes.data?.focus_minutes ?? 0,
      pomodorosDone: sessionsRes.count ?? 0,
      tasksDone:     tasksRes.count ?? 0,
    },
  })
}

// POST /api/daily-goals — upsert today's goals
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('daily_goals')
    .upsert({
      user_id:             user.id,
      date:                today,
      focus_minutes_goal:  Math.max(1, Number(body.focus_minutes_goal) || 60),
      pomodoro_goal:       Math.max(1, Number(body.pomodoro_goal)      || 4),
      tasks_goal:          Math.max(1, Number(body.tasks_goal)         || 3),
    }, { onConflict: 'user_id,date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
