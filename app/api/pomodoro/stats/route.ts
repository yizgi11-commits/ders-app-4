import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/pomodoro/stats
// Returns study_statistics + today's focus time + this week's total minutes
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // 7 days ago
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 6)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  const [{ data: statistics }, { data: todayData }, { data: weekData }] = await Promise.all([
    supabase.from('study_statistics').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('daily_focus_time').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).gte('date', weekAgoStr),
  ])

  const weekMinutes = (weekData ?? []).reduce(
    (sum: number, r: { focus_minutes: number }) => sum + r.focus_minutes,
    0
  )

  return NextResponse.json({ statistics, today: todayData, weekMinutes })
}
