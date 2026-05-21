import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { countWords, estimateReadingTime } from '@/lib/notes/ai-notes'

// GET /api/notes
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search    = searchParams.get('search') ?? ''
  const folder_id = searchParams.get('folder_id')
  const subject_id = searchParams.get('subject_id')
  const filter    = searchParams.get('filter') ?? 'all'
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  let query = supabase
    .from('notes')
    .select(`
      *,
      folder:note_folders(id, name, color, icon),
      subject:subjects(name)
    `)
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  // Apply filter
  if (filter === 'pinned') {
    query = query.eq('is_pinned', true).eq('is_archived', false)
  } else if (filter === 'favorites') {
    query = query.eq('is_favorite', true).eq('is_archived', false)
  } else if (filter === 'archived') {
    query = query.eq('is_archived', true)
  } else if (filter === 'recent') {
    query = query.eq('is_archived', false)
  } else {
    // all — exclude archived by default
    query = query.eq('is_archived', false)
  }

  if (folder_id) {
    query = query.eq('folder_id', folder_id)
  }

  if (subject_id) {
    query = query.eq('subject_id', subject_id)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten joined subject name
  const notes = (data ?? []).map((n: Record<string, unknown>) => {
    const subject = n.subject as { name?: string } | null
    return {
      ...n,
      subject_name: subject?.name ?? null,
      subject: undefined,
    }
  })

  return NextResponse.json({ notes })
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const title      = String(body.title ?? 'Başlıksız Not').trim()
  const content    = String(body.content ?? '')
  const folder_id  = body.folder_id ?? null
  const subject_id = body.subject_id ?? null
  const tags       = Array.isArray(body.tags) ? body.tags.map(String) : []

  const word_count       = countWords(content)
  const reading_time_mins = estimateReadingTime(content)

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      content,
      folder_id,
      subject_id,
      tags,
      word_count,
      reading_time_mins,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
