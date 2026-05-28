import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'

// POST /api/topics — create topic
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const title     = sanitizeString(body.title ?? '', MAX.TOPIC_NAME)
  const subjectId = String(body.subject_id ?? '')

  if (!title || !subjectId) return NextResponse.json({ error: 'title ve subject_id gerekli' }, { status: 400 })
  if (!validateUUID(subjectId)) return NextResponse.json({ error: 'Geçersiz subject_id' }, { status: 400 })

  // Verify subject ownership
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .eq('user_id', user.id)
    .single()

  if (!subject) return NextResponse.json({ error: 'Ders bulunamadı' }, { status: 404 })

  // Get next sort_order
  const { count } = await supabase
    .from('topics')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId)

  const { data, error } = await supabase
    .from('topics')
    .insert({
      user_id:    user.id,
      subject_id: subjectId,
      title,
      status:     'not_started',
      sort_order: (count ?? 0),
    })
    .select()
    .single()

  if (error) return safeError(error, 'Konu oluşturulamadı')
  return NextResponse.json(data)
}

// PATCH /api/topics — update topic (status, title, notes)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { id, ...rawUpdates } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('title'  in rawUpdates) updates.title  = sanitizeString(rawUpdates.title,  MAX.TOPIC_NAME)
  if ('status' in rawUpdates) updates.status = rawUpdates.status
  if ('notes'  in rawUpdates) updates.notes  = sanitizeString(rawUpdates.notes,  MAX.NOTE_CONTENT)
  if ('sort_order' in rawUpdates) updates.sort_order = Number(rawUpdates.sort_order)

  const { data, error } = await supabase
    .from('topics')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return safeError(error, 'Konu güncellenemedi')
  return NextResponse.json(data)
}

// DELETE /api/topics — delete topic
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return safeError(error, 'Konu silinemedi')
  return NextResponse.json({ ok: true })
}
