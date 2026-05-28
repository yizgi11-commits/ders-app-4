import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/flashcards/[id]
// Body: { result: 'know'|'again' }  ← review
//    or { front?, back?, subject_id? }  ← edit
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  const body   = await req.json()

  // ── Spaced repetition review ───────────────────────────────────
  if (body.result === 'know' || body.result === 'again') {
    // Fetch current count first
    const { data: card } = await supabase
      .from('flashcards')
      .select('review_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!card) return NextResponse.json({ error: 'Kart bulunamadı' }, { status: 404 })

    const daysToAdd  = body.result === 'know' ? 3 : 1
    const nextDate   = new Date()
    nextDate.setDate(nextDate.getDate() + daysToAdd)
    const nextStr    = nextDate.toISOString().split('T')[0]

    const { data: updated, error } = await supabase
      .from('flashcards')
      .update({
        next_review_date: nextStr,
        review_count:     card.review_count + 1,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ flashcard: updated, next_review: nextStr })
  }

  // ── Edit card fields ───────────────────────────────────────────
  const updates: Record<string, unknown> = {}
  if (body.front      !== undefined) updates.front      = String(body.front).trim()
  if (body.back       !== undefined) updates.back       = String(body.back).trim()
  if (body.subject_id !== undefined) updates.subject_id = body.subject_id || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`*, subjects ( id, name, icon, color )`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/flashcards/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
