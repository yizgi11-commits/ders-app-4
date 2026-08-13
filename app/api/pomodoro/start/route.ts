import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID } from '@/lib/security'

// POST /api/pomodoro/start
// Body: { durationSeconds: number, subjectId?: string, topicId?: string, taskId?: string }
// Creates a new pomodoro_sessions row → returns sessionId
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const durationSeconds: number = Number(body?.durationSeconds) || 25 * 60
  const subjectId: string | null = body?.subjectId && validateUUID(body.subjectId) ? body.subjectId : null
  const topicId: string | null   = body?.topicId   && validateUUID(body.topicId)   ? body.topicId   : null
  const taskId: string | null    = body?.taskId    && validateUUID(body.taskId)    ? body.taskId    : null

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id:          user.id,
      task_id:          taskId,
      subject_id:       subjectId,
      topic_id:         topicId,
      type:             'focus',
      duration_seconds: durationSeconds,
      status:           'active',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Oturum başlatılamadı' }, { status: 500 })

  return NextResponse.json({ sessionId: data.id })
}
