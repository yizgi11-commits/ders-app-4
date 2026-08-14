import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/flashcards/[id]
// Body: { result: 'know'|'again' }  ← review
//    or { front?, back?, subject_id? }  ← edit
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const body   = await req.json()

  // ── Spaced repetition review ───────────────────────────────────
  // Kept for the Vault study mode's two-button flow. Recall's four-grade
  // flow lives in /api/recall/review; both write to recall_reviews so the
  // analytics there sees every review regardless of where it happened.
  if (body.result === 'know' || body.result === 'again') {
    const { data: card } = await supabase
      .from('flashcards')
      .select('review_count, topic_id, subject_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!card) return NextResponse.json({ error: 'Kart bulunamadı' }, { status: 404 })

    const daysToAdd  = body.result === 'know' ? 3 : 1
    const nextDate   = new Date()
    nextDate.setDate(nextDate.getDate() + daysToAdd)
    const nextStr    = nextDate.toISOString().split('T')[0]
    const now        = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('flashcards')
      .update({
        next_review_date: nextStr,
        review_count:     card.review_count + 1,
        last_reviewed_at: now,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return safeError(error, 'Kart güncellenemedi')

    await supabase.from('recall_reviews').insert({
      user_id:       user.id,
      flashcard_id:  id,
      topic_id:      card.topic_id,
      subject_id:    card.subject_id,
      grade:         body.result === 'know' ? 'good' : 'again',
      interval_days: daysToAdd,
      reviewed_at:   now,
    })

    return NextResponse.json({ flashcard: updated, next_review: nextStr })
  }

  // ── Edit card fields ───────────────────────────────────────────
  const updates: Record<string, unknown> = {}
  if (body.front       !== undefined) updates.front       = sanitizeString(body.front, MAX.FLASHCARD_SIDE)
  if (body.back        !== undefined) updates.back        = sanitizeString(body.back,  MAX.FLASHCARD_SIDE)
  if (body.subject_id  !== undefined) updates.subject_id  = body.subject_id || null
  if (body.topic_id    !== undefined) updates.topic_id    = body.topic_id || null
  if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`*, subjects ( id, name, icon, color ), topics ( id, title )`)
    .single()

  if (error) return safeError(error, 'Kart güncellenemedi')
  return NextResponse.json(data)
}

// DELETE /api/flashcards/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return safeError(error, 'Kart silinemedi')
  return new NextResponse(null, { status: 204 })
}
