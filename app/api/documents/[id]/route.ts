import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID, safeError } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/documents/[id]
// Body: { is_favorite?, subject_id?, topic_id? }
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.is_favorite === 'boolean') updates.is_favorite = body.is_favorite
  if (body.subject_id !== undefined) updates.subject_id = body.subject_id || null
  if (body.topic_id   !== undefined) updates.topic_id   = body.topic_id || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, storage_path, size_bytes, subject_id, topic_id, is_favorite, created_at, subjects(id, name, icon, color), topics(id, title)')
    .single()

  if (error) return safeError(error, 'Belge güncellenemedi')
  return NextResponse.json(data)
}

// DELETE /api/documents/[id] — removes the row and the stored file
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })

  if (doc.storage_path) {
    await supabase.storage.from('pdfs').remove([doc.storage_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', user.id)
  if (error) return safeError(error, 'Belge silinemedi')

  return new NextResponse(null, { status: 204 })
}

// POST /api/documents/[id] — issues a short-lived signed URL for viewing
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!doc?.storage_path) {
    return NextResponse.json({ error: 'Bu belgenin dosyası bulunamadı' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(doc.storage_path, 60 * 10)

  if (error || !data) return safeError(error, 'Bağlantı oluşturulamadı')
  return NextResponse.json({ url: data.signedUrl })
}
