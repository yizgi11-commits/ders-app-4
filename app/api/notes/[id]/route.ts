import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { countWords, estimateReadingTime } from '@/lib/notes/ai-notes'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'

// GET /api/notes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data, error } = await supabase
    .from('notes')
    .select(`
      *,
      folder:note_folders(id, name, color, icon),
      subject:subjects(name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })

  const subject = data.subject as { name?: string } | null
  return NextResponse.json({
    ...data,
    subject_name: subject?.name ?? null,
    subject: undefined,
  })
}

// PATCH /api/notes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const allowed = ['title', 'content', 'folder_id', 'subject_id', 'topic_id', 'tags', 'is_pinned', 'is_archived', 'is_favorite']
  const updates: Record<string, unknown> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // Enforce length limits on text fields
  if ('title' in updates)   updates.title   = sanitizeString(updates.title,   MAX.NOTE_TITLE)
  if ('content' in updates) updates.content = sanitizeString(updates.content, MAX.NOTE_CONTENT)

  // Recompute word counts if content changed
  if ('content' in updates) {
    const content = String(updates.content)
    updates.word_count        = countWords(content)
    updates.reading_time_mins = estimateReadingTime(content)
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return safeError(error, 'Not güncellenemedi')
  return NextResponse.json(data)
}

// DELETE /api/notes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return safeError(error, 'Not silinemedi')
  return NextResponse.json({ ok: true })
}
