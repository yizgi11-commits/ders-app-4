import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/goals/[id]
// Body: { title?, deadline?, manual_progress_pct?, completed? }
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const body = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = sanitizeString(body.title, MAX.GOAL_TEXT)
  if (body.deadline !== undefined) updates.deadline = body.deadline || null
  if (body.manual_progress_pct !== undefined) {
    updates.manual_progress_pct = Math.max(0, Math.min(100, Number(body.manual_progress_pct) || 0))
  }
  if (typeof body.completed === 'boolean') updates.completed = body.completed

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, subjects(id, name, icon, color)')
    .single()

  if (error) return safeError(error, 'Hedef güncellenemedi')
  return NextResponse.json({ ...data, progress_pct: data.topic_id ? data.manual_progress_pct : data.manual_progress_pct })
}

// DELETE /api/goals/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
  if (error) return safeError(error, 'Hedef silinemedi')
  return new NextResponse(null, { status: 204 })
}
