import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'
import { checkLimit, isOverCapAfterInsert } from '@/lib/subscription'

// GET /api/flashcards?subject_id=&topic_id=&due_today=1
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get('subject_id')
  const topicId   = searchParams.get('topic_id')
  const dueToday  = searchParams.get('due_today') === '1'
  const savedOnly = searchParams.get('saved') === '1'
  const today     = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('flashcards')
    .select(`
      *,
      subjects ( id, name, icon, color ),
      topics ( id, title )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (subjectId) query = query.eq('subject_id', subjectId)
  if (topicId)   query = query.eq('topic_id', topicId)
  if (dueToday)  query = query.lte('next_review_date', today)
  if (savedOnly) query = query.eq('is_favorite', true)

  // Also return count of cards due today (for dashboard widget) — the
  // two queries are independent, so run them together.
  const [{ data, error }, { count: dueCount }] = await Promise.all([
    query,
    supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_date', today),
  ])

  if (error) return safeError(error, 'Kartlar alınamadı')

  return NextResponse.json({
    flashcards: data ?? [],
    due_count:  dueCount ?? 0,
  })
}

// POST /api/flashcards  — manual creation
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { allowed, limit, tier } = await checkLimit(supabase, user.id, 'vaultFlashcards')
  if (!allowed) {
    return NextResponse.json(
      { error: `Free planda en fazla ${limit} flashcard oluşturabilirsin. Pro ile sınırsız olur.`, locked: true },
      { status: 403 },
    )
  }

  const body = await req.json()
  const front      = sanitizeString(body.front ?? '', MAX.FLASHCARD_SIDE)
  const back       = sanitizeString(body.back  ?? '', MAX.FLASHCARD_SIDE)
  const subject_id = body.subject_id && validateUUID(body.subject_id) ? body.subject_id : null
  const topic_id   = body.topic_id && validateUUID(body.topic_id) ? body.topic_id : null

  if (!front || !back) {
    return NextResponse.json({ error: 'Ön yüz ve arka yüz zorunludur' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id:          user.id,
      subject_id:       subject_id || null,
      topic_id:         topic_id || null,
      front,
      back,
      next_review_date: today,
    })
    .select(`*, subjects ( id, name, icon, color )`)
    .single()

  if (error) return safeError(error, 'Kart oluşturulamadı')

  // Concurrent creates can all pass the pre-insert count above — verify
  // the cap AFTER inserting and roll this row back if we went over.
  if (await isOverCapAfterInsert(supabase, user.id, tier, 'vaultFlashcards')) {
    await supabase.from('flashcards').delete().eq('id', data.id).eq('user_id', user.id)
    return NextResponse.json(
      { error: `Free planda en fazla ${limit} flashcard oluşturabilirsin. Pro ile sınırsız olur.`, locked: true },
      { status: 403 },
    )
  }

  return NextResponse.json(data, { status: 201 })
}
