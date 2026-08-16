import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'
import { DURATION_OPTIONS, type TaskPriority } from '@/lib/planner/types'
import { checkAndUnlockAchievements } from '@/lib/gamification/check'

const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']

// GET /api/planner/tasks?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns Planner-created tasks (source = 'planner') in the given range,
// or just today's if no range is given.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end   = searchParams.get('end')

  let query = supabase
    .from('daily_tasks')
    .select('*, subjects(id, name, icon, color), topics(id, title)')
    .eq('user_id', user.id)
    .eq('source', 'planner')
    .order('date')
    .order('created_at')

  if (start) query = query.gte('date', start)
  if (end)   query = query.lte('date', end)
  if (!start && !end) query = query.eq('date', new Date().toISOString().split('T')[0])

  const { data, error } = await query
  if (error) return safeError(error, 'Görevler alınamadı')

  return NextResponse.json({ tasks: data ?? [] })
}

// POST /api/planner/tasks
// Body: { subject_id, topic_id?, topic_text?, duration_minutes, date, priority }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const subjectId = body.subject_id ?? null
  const topicId   = body.topic_id ?? null
  const topicText = sanitizeString(body.topic_text ?? '', MAX.TOPIC_NAME) || null
  const duration  = Number(body.duration_minutes)
  const date      = sanitizeString(body.date ?? '', 10) || new Date().toISOString().split('T')[0]
  const priority: TaskPriority = VALID_PRIORITIES.includes(body.priority) ? body.priority : 'medium'

  if (!subjectId || !validateUUID(subjectId)) {
    return NextResponse.json({ error: 'subject_id gerekli' }, { status: 400 })
  }
  if (topicId && !validateUUID(topicId)) {
    return NextResponse.json({ error: 'Geçersiz topic_id' }, { status: 400 })
  }
  if (!DURATION_OPTIONS.includes(duration as typeof DURATION_OPTIONS[number])) {
    return NextResponse.json({ error: 'Geçersiz süre' }, { status: 400 })
  }

  // Verify subject ownership
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .eq('user_id', user.id)
    .single()
  if (!subject) return NextResponse.json({ error: 'Ders bulunamadı' }, { status: 404 })

  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      user_id:           user.id,
      template_id:       null,
      source:            'planner',
      subject_id:        subjectId,
      topic_id:          topicId,
      topic_text:        topicText,
      duration_minutes:  duration,
      priority,
      date,
    })
    .select('*, subjects(id, name, icon, color), topics(id, title)')
    .single()

  if (error) return safeError(error, 'Görev oluşturulamadı')

  void checkAndUnlockAchievements(supabase, user.id, 'planner')

  return NextResponse.json(data, { status: 201 })
}
