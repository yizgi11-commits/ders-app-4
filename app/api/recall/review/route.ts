import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID, safeError } from '@/lib/security'
import { RECALL_GRADES, intervalForGrade, type RecallGrade } from '@/lib/recall/types'

// POST /api/recall/review
// Body: { flashcard_id: string, grade: RecallGrade }
// Applies the graded interval, bumps review_count and records the
// outcome in recall_reviews so analytics has real history to read.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const flashcardId = String(body?.flashcard_id ?? '')
  const grade       = body?.grade as RecallGrade

  if (!validateUUID(flashcardId)) return NextResponse.json({ error: 'Geçersiz kart id' }, { status: 400 })
  if (!RECALL_GRADES.includes(grade)) return NextResponse.json({ error: 'Geçersiz değerlendirme' }, { status: 400 })

  const { data: card } = await supabase
    .from('flashcards')
    .select('id, review_count, topic_id, subject_id')
    .eq('id', flashcardId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!card) return NextResponse.json({ error: 'Kart bulunamadı' }, { status: 404 })

  const newCount = card.review_count + 1
  const days     = intervalForGrade(grade, newCount)
  const next     = new Date()
  next.setDate(next.getDate() + days)
  const nextStr  = next.toISOString().split('T')[0]
  const now      = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('flashcards')
    .update({
      next_review_date: nextStr,
      review_count:     newCount,
      last_reviewed_at: now,
    })
    .eq('id', flashcardId)
    .eq('user_id', user.id)
    .select('id, next_review_date, review_count')
    .single()

  if (error) return safeError(error, 'Kart güncellenemedi')

  await supabase.from('recall_reviews').insert({
    user_id:       user.id,
    flashcard_id:  flashcardId,
    topic_id:      card.topic_id,
    subject_id:    card.subject_id,
    grade,
    interval_days: days,
    reviewed_at:   now,
  })

  return NextResponse.json({
    flashcard:        updated,
    next_review_date: nextStr,
    interval_days:    days,
  })
}
