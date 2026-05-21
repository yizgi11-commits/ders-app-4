import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DURATIONS, type SessionType } from '@/lib/pomodoro/types'

// POST /api/pomodoro/start
// Body: { type: SessionType, taskId?: string }
// Creates a new pomodoro_sessions row → returns sessionId
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const type: SessionType = body?.type ?? 'focus'
  const taskId: string | null = body?.taskId ?? null

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id:          user.id,
      task_id:          taskId,
      type,
      duration_seconds: DURATIONS[type],
      status:           'active',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sessionId: data.id })
}
