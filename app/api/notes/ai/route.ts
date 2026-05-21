import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateSummary,
  extractKeyPoints,
  generateFlashcards,
  generateQuiz,
} from '@/lib/notes/ai-notes'

type AIType = 'summary' | 'keypoints' | 'flashcards' | 'quiz'

// POST /api/notes/ai
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const note_id = String(body.note_id ?? '')
  const type    = String(body.type ?? '') as AIType

  if (!note_id) return NextResponse.json({ error: 'note_id gerekli' }, { status: 400 })
  if (!['summary', 'keypoints', 'flashcards', 'quiz'].includes(type)) {
    return NextResponse.json({ error: 'Geçersiz type' }, { status: 400 })
  }

  // Fetch the note (verify ownership)
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, content, updated_at, user_id')
    .eq('id', note_id)
    .eq('user_id', user.id)
    .single()

  if (noteError || !note) {
    return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
  }

  // Check cache: find existing result for this note+type
  const { data: cached } = await supabase
    .from('note_ai_results')
    .select('*')
    .eq('note_id', note_id)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached) {
    // Return cache if it was generated after the last note update
    const cacheTime   = new Date(cached.created_at).getTime()
    const noteUpdated = new Date(note.updated_at).getTime()
    if (cacheTime >= noteUpdated) {
      return NextResponse.json({ result: cached.result, cached: true })
    }
  }

  // Generate result
  const content = note.content as string
  let result: unknown

  if (type === 'summary') {
    result = { text: generateSummary(content) }
  } else if (type === 'keypoints') {
    result = { points: extractKeyPoints(content) }
  } else if (type === 'flashcards') {
    result = { cards: generateFlashcards(content) }
  } else {
    result = { questions: generateQuiz(content) }
  }

  // Save to cache (upsert by deleting old + inserting new)
  await supabase
    .from('note_ai_results')
    .delete()
    .eq('note_id', note_id)
    .eq('type', type)

  await supabase
    .from('note_ai_results')
    .insert({ note_id, type, result })

  return NextResponse.json({ result, cached: false })
}
