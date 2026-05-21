import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/topics — create topic
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const title     = String(body.title ?? '').trim()
  const subjectId = String(body.subject_id ?? '')

  if (!title || !subjectId) return NextResponse.json({ error: 'title ve subject_id gerekli' }, { status: 400 })

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/topics — update topic (status, title, notes)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('topics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
