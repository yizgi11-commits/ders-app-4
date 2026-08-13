import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'
import { PROGRESS_WEIGHTS } from '@/lib/subjects/types'

// GET /api/goals — list goals, with computed progress
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: goals, error } = await supabase
    .from('goals')
    .select('*, subjects(id, name, icon, color)')
    .eq('user_id', user.id)
    .order('deadline', { ascending: true, nullsFirst: false })

  if (error) return safeError(error, 'Hedefler alınamadı')

  const topicIds = (goals ?? []).map(g => g.topic_id).filter(Boolean) as string[]
  let topicProgress: Record<string, number> = {}

  if (topicIds.length > 0) {
    const [{ data: sessions }, { data: flashcards }, { data: notes }] = await Promise.all([
      supabase.from('pomodoro_sessions').select('topic_id').eq('user_id', user.id).eq('status', 'completed').in('topic_id', topicIds),
      supabase.from('flashcards').select('topic_id, review_count').eq('user_id', user.id).in('topic_id', topicIds),
      supabase.from('notes').select('topic_id').eq('user_id', user.id).in('topic_id', topicIds),
    ])
    const hasFocus  = new Set((sessions ?? []).map((s: { topic_id: string }) => s.topic_id))
    const hasRecall = new Set((flashcards ?? []).filter((f: { review_count: number }) => f.review_count > 0).map((f: { topic_id: string }) => f.topic_id))
    const hasNote   = new Set((notes ?? []).map((n: { topic_id: string }) => n.topic_id))

    topicProgress = Object.fromEntries(topicIds.map(id => [id,
      (hasFocus.has(id) ? PROGRESS_WEIGHTS.focus : 0) +
      (hasRecall.has(id) ? PROGRESS_WEIGHTS.recall : 0) +
      (hasNote.has(id) ? PROGRESS_WEIGHTS.note : 0),
    ]))
  }

  const withProgress = (goals ?? []).map(g => ({
    ...g,
    progress_pct: g.topic_id ? (topicProgress[g.topic_id] ?? 0) : g.manual_progress_pct,
  }))

  return NextResponse.json({ goals: withProgress })
}

// POST /api/goals
// Body: { title, subject_id?, topic_id?, deadline? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const title = sanitizeString(body.title ?? '', MAX.GOAL_TEXT)
  const subjectId = body.subject_id && validateUUID(body.subject_id) ? body.subject_id : null
  const topicId   = body.topic_id && validateUUID(body.topic_id) ? body.topic_id : null
  const deadline  = body.deadline ? sanitizeString(body.deadline, 10) : null

  if (!title) return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id:    user.id,
      title,
      subject_id: subjectId,
      topic_id:   topicId,
      deadline,
    })
    .select('*, subjects(id, name, icon, color)')
    .single()

  if (error) return safeError(error, 'Hedef oluşturulamadı')
  return NextResponse.json({ ...data, progress_pct: data.manual_progress_pct }, { status: 201 })
}
